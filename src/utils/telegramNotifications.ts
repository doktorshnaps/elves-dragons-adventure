import { supabase } from '@/integrations/supabase/client';

export type TelegramConnectionStatus = {
  connected: boolean;
  chatId: number | null;
  currentTelegramUserId: number | null;
  isTelegramWebApp: boolean;
  reason?: 'no_wallet' | 'no_chat_id' | 'no_player' | 'query_error' | 'mismatch';
};

const getCurrentTelegramUserId = () =>
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;

/**
 * Send a Telegram push notification to a player via Edge Function.
 */
export const sendTelegramNotification = async (
  walletAddress: string,
  message: string,
  eventType: string
): Promise<{ sent?: boolean; skipped?: boolean; reason?: string } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { wallet_address: walletAddress, message, event_type: eventType },
    });

    if (error) {
      console.warn('📱 TG notification invoke error:', error);
      return null;
    }

    if (data?.sent) {
      console.log('📱 TG notification sent successfully for', eventType);
    } else if (data?.skipped) {
      console.log(`📱 TG notification skipped: ${data.reason} (${eventType})`);
    } else {
      console.warn('📱 TG notification unexpected response:', data);
    }

    return data;
  } catch (err) {
    console.warn('📱 TG notification error:', err);
    return null;
  }
};

/**
 * Get Telegram connection status using secure RPC (no direct game_data SELECT).
 */
export const getTelegramConnectionStatus = async (
  walletAddress: string
): Promise<TelegramConnectionStatus> => {
  const currentTelegramUserId = getCurrentTelegramUserId();
  const isTelegramWebApp = !!window.Telegram?.WebApp;

  if (!walletAddress) {
    return { connected: false, chatId: null, currentTelegramUserId, isTelegramWebApp, reason: 'no_wallet' };
  }

  try {
    const { data, error } = await supabase.rpc('get_telegram_status', {
      p_wallet_address: walletAddress,
    });

    if (error) {
      console.warn('📱 get_telegram_status RPC error:', error);
      return { connected: false, chatId: null, currentTelegramUserId, isTelegramWebApp, reason: 'query_error' };
    }

    const result = data as { status: string; chat_id: number | null } | null;

    if (!result || result.status === 'no_player') {
      return { connected: false, chatId: null, currentTelegramUserId, isTelegramWebApp, reason: 'no_player' };
    }

    if (result.status === 'no_chat_id' || !result.chat_id) {
      return { connected: false, chatId: null, currentTelegramUserId, isTelegramWebApp, reason: 'no_chat_id' };
    }

    const chatId = result.chat_id;

    if (currentTelegramUserId && chatId !== currentTelegramUserId) {
      return { connected: false, chatId, currentTelegramUserId, isTelegramWebApp, reason: 'mismatch' };
    }

    return { connected: true, chatId, currentTelegramUserId, isTelegramWebApp };
  } catch (err) {
    console.warn('📱 get_telegram_status error:', err);
    return { connected: false, chatId: null, currentTelegramUserId, isTelegramWebApp, reason: 'query_error' };
  }
};

/**
 * Save Telegram chat_id using v2 RPC that returns structured result.
 */
export const saveTelegramChatId = async (walletAddress: string): Promise<boolean> => {
  const tgUserId = getCurrentTelegramUserId();
  if (!tgUserId) {
    console.log('📱 saveTelegramChatId: no Telegram user found');
    return false;
  }
  if (!walletAddress) {
    console.log('📱 saveTelegramChatId: no wallet address');
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('save_telegram_chat_id_v2', {
      p_wallet_address: walletAddress,
      p_chat_id: tgUserId,
    });

    if (error) {
      console.warn('📱 save_telegram_chat_id_v2 RPC error:', error);
      return false;
    }

    const result = data as { status: string; chat_id: number | null; was_updated: boolean } | null;
    console.log('📱 save_telegram_chat_id_v2 result:', result);

    if (result?.status === 'ok' && result.was_updated) {
      console.log('📱 Telegram chat_id saved:', tgUserId, 'for wallet:', walletAddress);
      return true;
    }

    if (result?.status === 'no_player') {
      console.warn('📱 No game_data row found for wallet:', walletAddress);
    }

    return false;
  } catch (err) {
    console.warn('📱 saveTelegramChatId error:', err);
    return false;
  }
};

export const connectTelegramNotifications = async (walletAddress: string) => {
  const saved = await saveTelegramChatId(walletAddress);
  const status = await getTelegramConnectionStatus(walletAddress);

  return {
    ...status,
    saved,
  };
};
