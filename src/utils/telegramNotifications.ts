import { supabase } from '@/integrations/supabase/client';

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

/**
 * Save the Telegram chat_id for the current player.
 * Should be called once on app initialization if running inside Telegram Mini App.
 */
export const saveTelegramChatId = async (walletAddress: string): Promise<boolean> => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!tgUser?.id) {
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
      p_chat_id: tgUser.id,
    });
    if (error) {
      console.warn('📱 Failed to save telegram chat_id:', error);
      return false;
    }
    console.log('📱 Telegram chat_id saved:', tgUser.id, 'for wallet:', walletAddress);
    return true;
  } catch (err) {
    console.warn('📱 Failed to save telegram chat_id:', err);
    return false;
  }
};
