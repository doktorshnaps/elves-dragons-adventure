import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useGameStore } from "@/stores/gameStore";
import { useQueryClient } from "@tanstack/react-query";
import { saveTelegramChatId } from "@/utils/telegramNotifications";
import useTelegram from "@/hooks/useTelegram";

/**
 * РЕФАКТОРИНГ: Убрана зависимость от setCards
 * Карты теперь загружаются из card_instances через useCards()
 * Этот хук только инициализирует game_data для нового игрока
 */
export const useGameInitialization = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const hasInitializedRef = useRef(false);
  const tgChatIdSavedRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { isTelegram, tgWebApp } = useTelegram();

  console.log('🎮 useGameInitialization: accountId=', accountId, 'isConnected=', isConnected, 'hasInitialized=', hasInitializedRef.current);

  useEffect(() => {
    console.log('🔄 useGameInitialization effect: accountId=', accountId, 'isConnected=', isConnected, 'hasInitialized=', hasInitializedRef.current);
    if (!isConnected || !accountId || hasInitializedRef.current) {
      console.log('⏭️ Skipping initialization:', { isConnected, accountId, hasInitialized: hasInitializedRef.current });
      return;
    }

    const initializeGame = async () => {
      try {
        hasInitializedRef.current = true;
        console.log('🚀 Initializing game for wallet:', accountId);
        
        // Проверяем данные игры в Supabase по кошельку
        console.log('📊 Checking existing game data for:', accountId);
        const { data: gameData, error } = await supabase
          .from('game_data')
          .select('balance')
          .eq('wallet_address', accountId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching game data:', error);
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось проверить данные игрока",
            variant: "destructive"
          });
          return;
        }

        console.log('📦 Existing game data:', gameData ? 'Found' : 'Not found');

        // Если данных нет, создаем новую запись
        if (!gameData) {
          console.log('✨ Creating new game data for wallet:', accountId);
          
          // Используем RPC функцию для безопасного создания game_data (уже с balance=100)
          console.log('📞 Calling ensure_game_data_exists RPC...');
          const { data: userId, error: insertError } = await supabase
            .rpc('ensure_game_data_exists', {
              p_wallet_address: accountId
            });

          if (insertError) {
            console.error('❌ Error creating game data:', insertError);
            toast({
              title: "Ошибка инициализации",
              description: `Не удалось создать данные игрока: ${insertError.message}`,
              variant: "destructive"
            });
            return;
          }

          console.log('✅ Game data created, user_id:', userId);

          // Получаем созданные данные
          const { data: newGameData, error: fetchError } = await supabase
            .from('game_data')
            .select('balance')
            .eq('wallet_address', accountId)
            .single();

          if (fetchError || !newGameData) {
            console.error('Error fetching created game data:', fetchError);
            toast({
              title: "Ошибка загрузки",
              description: "Не удалось загрузить данные игрока",
              variant: "destructive"
            });
            return;
          }
          
          console.log('Loaded new game data:', newGameData);
          const startingBalance = newGameData.balance || 100;
          
          // Синхронизируем баланс с Zustand store
          useGameStore.getState().setBalance(startingBalance);
          
          // Инвалидируем кэш React Query вместо window.dispatchEvent
          queryClient.invalidateQueries({ queryKey: ['gameData'] });
          
          toast({
            title: "Добро пожаловать в игру!",
            description: "Начните зарабатывать ресурсы и получать карты!",
          });
        } else {
          // Загружаем существующий баланс
          // РЕФАКТОРИНГ: cards больше не синхронизируем - используйте useCards() и card_instances
          useGameStore.getState().setBalance(gameData.balance);
          
          // Инвалидируем кэш React Query вместо window.dispatchEvent
          queryClient.invalidateQueries({ queryKey: ['gameData'] });
        }

      } catch (error) {
        console.error('Error in game initialization:', error);
      }
    };

    initializeGame();
    
    // Сброс флага при смене кошелька
    return () => {
      hasInitializedRef.current = false;
    };
  }, [accountId, isConnected, toast, queryClient]);

  // Dedicated stable effect for saving Telegram chat_id
  useEffect(() => {
    if (!accountId || !isTelegram || !tgWebApp) return;
    const tgUserId = tgWebApp.initDataUnsafe?.user?.id;
    if (!tgUserId) return;

    // Don't re-save if already saved for this wallet+chatId combo
    const key = `${accountId}:${tgUserId}`;
    if (tgChatIdSavedRef.current === key) return;

    console.log('📱 Auto-saving Telegram chat_id:', tgUserId, 'for wallet:', accountId);
    saveTelegramChatId(accountId).then((ok) => {
      if (ok) {
        tgChatIdSavedRef.current = key;
        console.log('📱 Auto-save Telegram chat_id succeeded');
      } else {
        console.log('📱 Auto-save Telegram chat_id skipped or failed (use Settings to connect manually)');
      }
    });
  }, [accountId, isTelegram, tgWebApp]);

  return {};
};