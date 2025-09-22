import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generatePack } from "@/utils/cardUtils";
import { Card } from "@/types/cards";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";

export const useGameInitialization = (setCards: (cards: Card[]) => void) => {
  const { toast } = useToast();
  const { accountId, isConnected } = useWallet();
  const [showFirstTimePack, setShowFirstTimePack] = useState(false);

  useEffect(() => {
    if (!isConnected || !accountId) return;

    const initializeGame = async () => {
      try {
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

        // Если данных нет, создаем новую запись
        if (!gameData) {
          const firstPack = generatePack();
          const secondPack = generatePack();
          const initialCards = [...firstPack, ...secondPack];
          
          // Получаем текущего аутентифицированного пользователя
          const { data: { user } } = await supabase.auth.getUser();
          
          const { error: insertError } = await supabase
            .from('game_data')
            .insert({
              user_id: user?.id,
              wallet_address: accountId,
              cards: initialCards as any,
              balance: 100,
              initialized: true
            });

          if (insertError) {
            console.error('Error creating game data:', insertError);
            return;
          }

          // Синхронизируем с localStorage
          localStorage.setItem('gameCards', JSON.stringify(initialCards));
          localStorage.setItem('gameBalance', '100');
          localStorage.setItem('gameInitialized', 'true');
          
          setCards(initialCards);
          
          // Отправляем событие для обновления баланса
          const balanceEvent = new CustomEvent('balanceUpdate', { 
            detail: { balance: 100 }
          });
          window.dispatchEvent(balanceEvent);
          
          // Показываем диалог с приветствием
          setShowFirstTimePack(true);
          
          toast({
            title: "Добро пожаловать в игру!",
            description: "Вы получили 2 начальные колоды карт и 100 ELL",
          });
        } else {
          // Загружаем существующие данные
          const cards = Array.isArray(gameData.cards) ? gameData.cards as unknown as Card[] : [];
          setCards(cards);
          localStorage.setItem('gameCards', JSON.stringify(cards));
          localStorage.setItem('gameBalance', gameData.balance.toString());
          localStorage.setItem('gameInitialized', 'true');
          
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
  }, [accountId, isConnected, setCards, toast]);

  return { showFirstTimePack, setShowFirstTimePack };
};