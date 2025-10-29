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

  useEffect(() => {
    if (!isConnected || !accountId || hasInitializedRef.current) return;

    const initializeGame = async () => {
      try {
        hasInitializedRef.current = true;
        console.log('Initializing game for wallet:', accountId);
        
        // Проверяем данные игры в Supabase по кошельку
        const { data: gameData, error } = await supabase
          .from('game_data')
          .select('*')
          .eq('wallet_address', accountId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching game data:', error);
          return;
        }

        // Если данных нет, создаем новую запись без стартовых колод
        if (!gameData) {
          // Используем RPC функцию для безопасного создания game_data
          const { data: userId, error: insertError } = await supabase
            .rpc('ensure_game_data_exists', {
              p_wallet_address: accountId
            });

          if (insertError) {
            console.error('Error creating game data:', insertError);
            return;
          }

          // После создания записи обновляем её с пустыми начальными данными
          const { error: updateError } = await supabase
            .from('game_data')
            .update({
              cards: [] as any,
              balance: 0,
              initialized: true
            })
            .eq('wallet_address', accountId);

          if (updateError) {
            console.error('Error updating game data:', updateError);
            return;
          }

          // Синхронизируем с Zustand store
          useGameStore.getState().setCards([]);
          useGameStore.getState().setBalance(0);
          
          setCards([]);
          
          // Отправляем событие для обновления баланса
          const balanceEvent = new CustomEvent('balanceUpdate', { 
            detail: { balance: 0 }
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