import { supabase } from '@/integrations/supabase/client';

export type TelegramConnectionStatus = {
  connected: boolean;
  chatId: number | null;
  currentTelegramUserId: number | null;
  isTelegramWebApp: boolean;
  reason?: 'no_wallet' | 'no_chat_id' | 'query_error' | 'mismatch';
};

const getCurrentTelegramUserId = () =>
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;

/**
 * Send a Telegram push notification to a player via Edge Function.
 * Logs the result for diagnostics.
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

export const getTelegramConnectionStatus = async (
  walletAddress: string
): Promise<TelegramConnectionStatus> => {
  const currentTelegramUserId = getCurrentTelegramUserId();
  const isTelegramWebApp = !!window.Telegram?.WebApp;

  if (!walletAddress) {
    return {
      connected: false,
      chatId: null,
      currentTelegramUserId,
      isTelegramWebApp,
      reason: 'no_wallet',
    };
  }

  try {
    const { data, error } = await supabase
      .from('game_data')
      .select('telegram_chat_id')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      console.warn('📱 Failed to load telegram connection status:', error);
      return {
        connected: false,
        chatId: null,
        currentTelegramUserId,
        isTelegramWebApp,
        reason: 'query_error',
      };
    }

    const chatId = data?.telegram_chat_id ?? null;
    if (!chatId) {
      return {
        connected: false,
        chatId: null,
        currentTelegramUserId,
        isTelegramWebApp,
        reason: 'no_chat_id',
      };
    }

    if (currentTelegramUserId && chatId !== currentTelegramUserId) {
      console.warn('📱 Telegram chat_id mismatch:', { walletAddress, chatId, currentTelegramUserId });
      return {
        connected: false,
        chatId,
        currentTelegramUserId,
        isTelegramWebApp,
        reason: 'mismatch',
      };
    }

    return {
      connected: true,
      chatId,
      currentTelegramUserId,
      isTelegramWebApp,
    };
  } catch (err) {
    console.warn('📱 Failed to check telegram connection status:', err);
    return {
      connected: false,
      chatId: null,
      currentTelegramUserId,
      isTelegramWebApp,
      reason: 'query_error',
    };
  }
};

/**
 * Save the Telegram chat_id for the current player.
 * Should be called once on app initialization if running inside Telegram Mini App.
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
    const { error } = await supabase.rpc('save_telegram_chat_id', {
      p_wallet_address: walletAddress,
      p_chat_id: tgUserId,
    });
    if (error) {
      console.warn('📱 Failed to save telegram chat_id:', error);
      return false;
    }

    const status = await getTelegramConnectionStatus(walletAddress);
    if (!status.chatId || status.chatId !== tgUserId) {
      console.warn('📱 Telegram chat_id was not persisted after save:', {
        walletAddress,
        expectedChatId: tgUserId,
        actualChatId: status.chatId,
        reason: status.reason,
      });
      return false;
    }

    console.log('📱 Telegram chat_id saved:', tgUserId, 'for wallet:', walletAddress);
    return true;
  } catch (err) {
    console.warn('📱 Failed to save telegram chat_id:', err);
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
