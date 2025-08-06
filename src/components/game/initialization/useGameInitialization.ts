import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generatePack } from "@/utils/cardUtils";
import { Card } from "@/types/cards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useGameInitialization = (setCards: (cards: Card[]) => void) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showFirstTimePack, setShowFirstTimePack] = useState(false);

  useEffect(() => {
    if (!user) return;

    const initializeGame = async () => {
      try {
        // Проверяем данные игры в Supabase
        const { data: gameData, error } = await supabase
          .from('game_data')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching game data:', error);
          return;
        }

        // Если данных нет или игра не инициализирована
        if (!gameData || !gameData.initialized || (Array.isArray(gameData.cards) && gameData.cards.length === 0)) {
          console.log('Initializing game for user:', user.id);
          
          const firstPack = generatePack();
          const secondPack = generatePack();
          const initialCards = [...firstPack, ...secondPack];
          
          // Обновляем или создаем запись в Supabase
          const { error: upsertError } = await supabase
            .from('game_data')
            .upsert({
              user_id: user.id,
              cards: initialCards as any,
              balance: 100,
              initialized: true
            });

          if (upsertError) {
            console.error('Error initializing game data:', upsertError);
            toast({
              title: "Ошибка инициализации",
              description: "Не удалось инициализировать игру",
              variant: "destructive"
            });
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
          
          // Показываем диалог с бесплатной колодой
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
  }, [user, setCards, toast]);

  return { showFirstTimePack, setShowFirstTimePack };
};