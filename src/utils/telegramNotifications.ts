import { supabase } from '@/integrations/supabase/client';

/**
 * Send a Telegram push notification to a player via Edge Function.
 * Fire-and-forget — errors are logged but never thrown.
 */
export const sendTelegramNotification = (
  walletAddress: string,
  message: string,
  eventType: string
) => {
  supabase.functions
    .invoke('send-telegram-notification', {
      body: { wallet_address: walletAddress, message, event_type: eventType },
    })
    .then(({ error }) => {
      if (error) console.warn('📱 TG notification failed:', error);
    })
    .catch((err) => console.warn('📱 TG notification error:', err));
};

/**
 * Save the Telegram chat_id for the current player.
 * Should be called once on app initialization if running inside Telegram Mini App.
 */
export const saveTelegramChatId = async (walletAddress: string) => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!tgUser?.id || !walletAddress) return;

  try {
    await supabase.rpc('save_telegram_chat_id', {
      p_wallet_address: walletAddress,
      p_chat_id: tgUser.id,
    });
    console.log('📱 Telegram chat_id saved:', tgUser.id);
  } catch (err) {
    console.warn('📱 Failed to save telegram chat_id:', err);
  }
};
