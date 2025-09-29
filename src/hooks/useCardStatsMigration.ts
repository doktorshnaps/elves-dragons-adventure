import { useEffect, useRef } from 'react';
import { useGameData } from './useGameData';
import { calculateCardStats } from '@/utils/cardUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Хук для автоматической миграции характеристик карт
 * Обновляет существующие карты по новой формуле расчета
 */
export const useCardStatsMigration = () => {
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    const migrateCardStats = async () => {
      // Проверяем, не выполняли ли мы уже миграцию (v5 исправляет множители драконов с учетом ключевых слов)
      const migrationKey = 'cardStatsMigration_v5';
      const hasMigrated = localStorage.getItem(migrationKey);
      
      if (hasMigrated || hasMigratedRef.current || !gameData.cards || gameData.cards.length === 0) {
        return;
      }

      hasMigratedRef.current = true;
      console.log('🔄 Начинается миграция характеристик карт...');

      try {
        // Обновляем характеристики всех карт (героев и драконов)
        const updatedCards = gameData.cards.map(card => {
          const newStats = calculateCardStats(card.name, card.rarity, card.type);
          
          return {
            ...card,
            power: newStats.power,
            defense: newStats.defense,
            health: newStats.health,
            magic: newStats.magic,
            // Обновляем currentHealth если оно больше нового max health
            currentHealth: card.currentHealth && card.currentHealth > newStats.health 
              ? newStats.health 
              : (card.currentHealth || newStats.health)
          };
        });

        // Обновляем карты в game_data
        await updateGameData({ cards: updatedCards });

        // Обновляем card_instances в базе данных
        const walletAddress = localStorage.getItem('walletAccountId');
        if (walletAddress) {
          for (const card of updatedCards) {
            const newStats = calculateCardStats(card.name, card.rarity, card.type);
            
            const { error } = await supabase
              .from('card_instances')
              .update({
                max_health: newStats.health,
                current_health: Math.min(card.currentHealth || newStats.health, newStats.health),
                card_data: JSON.parse(JSON.stringify({
                  ...card,
                  power: newStats.power,
                  defense: newStats.defense,
                  health: newStats.health,
                  magic: newStats.magic
                }))
              })
              .eq('wallet_address', walletAddress)
              .eq('card_template_id', card.id);

            if (error) {
              console.error('Ошибка обновления card_instance:', error);
            }
          }
        }

        // Помечаем миграцию как выполненную
        localStorage.setItem(migrationKey, 'true');
        
        console.log('✅ Миграция характеристик карт завершена');
        
        toast({
          title: "Характеристики обновлены",
          description: "Характеристики всех карт обновлены по новой формуле",
        });
      } catch (error) {
        console.error('❌ Ошибка миграции:', error);
        hasMigratedRef.current = false;
      }
    };

    migrateCardStats();
  }, [gameData.cards, updateGameData, toast]);
};
