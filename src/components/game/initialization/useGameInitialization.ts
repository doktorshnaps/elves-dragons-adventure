import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/cards";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useGameStore } from "@/stores/gameStore";

export const useGameInitialization = (setCards: (cards: Card[]) => void) => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const hasInitializedRef = useRef(false);

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
          .select('*')
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
            .select('balance, cards')
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
          
          // Синхронизируем с Zustand store
          useGameStore.getState().setCards([]);
          useGameStore.getState().setBalance(startingBalance);
          
          setCards([]);
          
          // Отправляем событие для обновления баланса
          const balanceEvent = new CustomEvent('balanceUpdate', { 
            detail: { balance: startingBalance }
          });
          window.dispatchEvent(balanceEvent);
          
          toast({
            title: "Добро пожаловать в игру!",
            description: "Начните зарабатывать ресурсы и получать карты!",
          });
        } else {
          // Загружаем существующие данные
          const cards = Array.isArray(gameData.cards) ? gameData.cards as unknown as Card[] : [];
          setCards(cards);
          useGameStore.getState().setCards(cards);
          useGameStore.getState().setBalance(gameData.balance);
          
          // Отправляем событие для обновления баланса
          const balanceEvent = new CustomEvent('balanceUpdate', { 
            detail: { balance: gameData.balance }
          });
          window.dispatchEvent(balanceEvent);
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
  }, [accountId, isConnected, setCards, toast]);

  return {};
};