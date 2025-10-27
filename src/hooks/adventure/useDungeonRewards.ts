import { useState, useCallback, useRef } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types/inventory';
import { getMonsterLoot } from '@/utils/monsterLootMapping';
import { v4 as uuidv4 } from 'uuid';
import { newItems } from '@/data/newItems';
import { useAddItemToInstances } from '@/hooks/useAddItemToInstances';

export interface MonsterKill {
  level: number;
  dungeonType: string;
  name?: string; // Добавляем имя монстра для системы лута
}

export interface DungeonReward {
  totalELL: number;
  monstersKilled: number;
  completionBonus: number;
  breakdown: {
    level1to3: { count: number; reward: number };
    level4to7: { count: number; reward: number };
    level8to10: { count: number; reward: number };
  };
  isFullCompletion: boolean;
  lootedItems: Item[];
}

export const useDungeonRewards = () => {
  const [pendingReward, setPendingReward] = useState<DungeonReward | null>(null);
  const [accumulatedReward, setAccumulatedReward] = useState<DungeonReward | null>(null);
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const { addItemsToInstances } = useAddItemToInstances();
  const isClaimingRef = useRef(false);
  const lastProcessedLevelRef = useRef<number>(-1);
  const isProcessingRef = useRef(false);

  const calculateReward = useCallback((monsters: MonsterKill[]): DungeonReward => {
    console.log('🎯 calculateReward called with monsters:', monsters);
    let level1to3Count = 0;
    let level4to7Count = 0;
    let level8to10Count = 0;
    const lootedItems: Item[] = [];

    // Подсчитываем убитых монстров по уровням для подземелья "Гнездо Гигантских Пауков"
    monsters.forEach(monster => {
      console.log('🏹 Processing monster:', monster);
      if (monster.dungeonType === 'spider_nest') {
        if (monster.level >= 1 && monster.level <= 3) {
          level1to3Count++;
        } else if (monster.level >= 4 && monster.level <= 7) {
          level4to7Count++;
        } else if (monster.level >= 8 && monster.level <= 10) {
          level8to10Count++;
        }

        // Генерируем лут с учётом подземелья и уровня
        if (monster.name) {
          console.log('🎁 Generating loot for monster:', monster.name, 'Level:', monster.level);
          // Определяем номер подземелья на основе dungeonType
          const dungeonNumber = monster.dungeonType === 'spider_nest' ? 1 : undefined;
          const allLoot = getMonsterLoot(monster.name, dungeonNumber, monster.level);
          if (allLoot && allLoot.length > 0) {
            console.log(`💰 Generated ${allLoot.length} items from monster:`, allLoot);
            lootedItems.push(...allLoot);
          } else {
            console.log('❌ No loot generated for:', monster.name);
          }
        } else {
          console.log('⚠️ Monster has no name:', monster);
        }
      }
    });

    // Рассчитываем награды согласно условиям
    const level1to3Reward = level1to3Count * 1; // 1 ELL за монстров 1-3 уровня
    const level4to7Reward = level4to7Count * 2; // 2 ELL за монстров 4-7 уровня
    const level8to10Reward = level8to10Count * 5; // 5 ELL за монстров 8-10 уровня

    const totalELL = level1to3Reward + level4to7Reward + level8to10Reward;
    
    console.log('💎 Final reward calculated:', { totalELL, lootedItems: lootedItems.length, breakdown: { level1to3Count, level4to7Count, level8to10Count } });
    return {
      totalELL,
      monstersKilled: monsters.length,
      completionBonus: 0, // Пока без бонуса за завершение
      breakdown: {
        level1to3: { count: level1to3Count, reward: level1to3Reward },
        level4to7: { count: level4to7Count, reward: level4to7Reward },
        level8to10: { count: level8to10Count, reward: level8to10Reward }
      },
      isFullCompletion: false, // Устанавливается при полном завершении подземелья
      lootedItems
    };
  }, []);

  const processDungeonCompletion = useCallback(async (
    monsters: MonsterKill[], 
    currentLevel: number, 
    isFullCompletion: boolean = false,
    isDefeat: boolean = false
  ) => {
    // Защита от повторной обработки того же уровня
    if (isProcessingRef.current) {
      console.log(`⚠️ Уже идет обработка, пропуск вызова для уровня ${currentLevel}`);
      return;
    }
    
    // Для побед: проверяем, не обработали ли уже этот уровень
    if (!isDefeat && lastProcessedLevelRef.current === currentLevel && pendingReward !== null) {
      console.log(`⚠️ Уровень ${currentLevel} уже обработан и награда готова`);
      return;
    }

    isProcessingRef.current = true;
    lastProcessedLevelRef.current = currentLevel;

    console.log(`🏁 ============ ОБРАБОТКА ЗАВЕРШЕНИЯ УРОВНЯ ${currentLevel} ============`);
    console.log(`💎 Монстров убито на уровне: ${monsters.length}`);
    console.log(`🎯 Поражение: ${isDefeat}`);

    // Если поражение - сбрасываем все накопленные награды
    if (isDefeat) {
      console.log(`❌ ПОРАЖЕНИЕ! Сброс всех накопленных наград`);
      setAccumulatedReward(null);
      setPendingReward(null);
      lastProcessedLevelRef.current = -1;
      isProcessingRef.current = false;
      toast({
        title: "Поражение!",
        description: "Вся накопленная награда потеряна",
        variant: "destructive"
      });
      return;
    }

    const levelReward = calculateReward(monsters);
    console.log(`💰 Награда за текущий уровень ${currentLevel}:`, levelReward);
    
    // Используем функциональное обновление для правильного чтения текущего значения
    setAccumulatedReward(prevAccumulated => {
      console.log(`📊 Предыдущая накопленная награда:`, prevAccumulated);
      
      // Суммируем с накопленной наградой
      const totalAccumulated: DungeonReward = prevAccumulated ? {
        totalELL: prevAccumulated.totalELL + levelReward.totalELL,
        monstersKilled: prevAccumulated.monstersKilled + levelReward.monstersKilled,
        completionBonus: 0,
        breakdown: {
          level1to3: {
            count: prevAccumulated.breakdown.level1to3.count + levelReward.breakdown.level1to3.count,
            reward: prevAccumulated.breakdown.level1to3.reward + levelReward.breakdown.level1to3.reward
          },
          level4to7: {
            count: prevAccumulated.breakdown.level4to7.count + levelReward.breakdown.level4to7.count,
            reward: prevAccumulated.breakdown.level4to7.reward + levelReward.breakdown.level4to7.reward
          },
          level8to10: {
            count: prevAccumulated.breakdown.level8to10.count + levelReward.breakdown.level8to10.count,
            reward: prevAccumulated.breakdown.level8to10.reward + levelReward.breakdown.level8to10.reward
          }
        },
        isFullCompletion: false,
        lootedItems: [...(prevAccumulated.lootedItems || []), ...(levelReward.lootedItems || [])]
      } : levelReward;

      totalAccumulated.isFullCompletion = isFullCompletion;

      // Если полное завершение подземелья (дошли до 10 уровня), добавляем бонус
      if (isFullCompletion) {
        totalAccumulated.completionBonus = Math.floor(totalAccumulated.totalELL * 0.5);
        totalAccumulated.totalELL += totalAccumulated.completionBonus;
        console.log(`🎉 ПОЛНОЕ ЗАВЕРШЕНИЕ! Бонус +50%: ${totalAccumulated.completionBonus} ELL`);
      }

      console.log(`✅ ИТОГОВАЯ накопленная награда ПОСЛЕ обработки уровня ${currentLevel}:`, totalAccumulated);
      console.log(`📈 Всего ELL накоплено: ${totalAccumulated.totalELL}`);
      console.log(`📈 Всего монстров убито: ${totalAccumulated.monstersKilled}`);
      console.log(`📈 Всего предметов: ${totalAccumulated.lootedItems.length}`);
      console.log(`🏁 ============================================================\n`);

      setPendingReward(totalAccumulated);
      return totalAccumulated;
    });
    
    isProcessingRef.current = false;
  }, [calculateReward, toast]);

  const claimRewardAndExit = useCallback(async () => {
    if (!pendingReward || isClaimingRef.current) return;
    isClaimingRef.current = true;

    console.log(`💎 ============ ЗАБИРАЕМ НАГРАДУ И ВЫХОДИМ ============`);
    console.log(`🎁 Награда к начислению:`, pendingReward);

    try {
      const rewardAmount = pendingReward.totalELL || 0;
      const lootedItems = pendingReward.lootedItems || [];
      
      console.log(`💰 Начисляем ${rewardAmount} ELL`);
      console.log(`🎒 Начисляем ${lootedItems.length} предметов`);
      console.log(`📦 Текущий баланс: ${gameData.balance} ELL`);
      console.log(`📦 Текущий инвентарь: ${gameData.inventory?.length || 0} предметов`);
      
      // Объединяем обновления баланса и инвентаря в один вызов
      const updates: any = {};
      
      if (rewardAmount > 0) {
        const currentBalance = gameData.balance || 0;
        updates.balance = currentBalance + rewardAmount;
        console.log(`💰 Новый баланс: ${updates.balance} ELL (было: ${currentBalance})`);
      }

      if (lootedItems.length > 0) {
        const currentInventory = gameData.inventory || [];
        updates.inventory = [...currentInventory, ...lootedItems];
        console.log(`🎒 Новый инвентарь: ${updates.inventory.length} предметов (было: ${currentInventory.length})`);
        
        // Добавляем предметы в item_instances
        console.log('📝 Добавляем предметы в item_instances:', lootedItems);
        await addItemsToInstances(lootedItems.map(it => ({
          name: it.name,
          type: it.type
        })));
        console.log('✅ Предметы добавлены в item_instances');
      }

      // Единый вызов updateGameData с обоими обновлениями
      if (Object.keys(updates).length > 0) {
        await updateGameData(updates);
        console.log('✅ Награда успешно начислена!');
      } else {
        console.warn('⚠️ Нет обновлений для начисления!');
      }

      // Сбрасываем все состояния
      setPendingReward(null);
      setAccumulatedReward(null);
      
      console.log(`💎 =====================================================\n`);
      
      toast({
        title: "Награда получена!",
        description: `Получено ${rewardAmount} ELL и ${lootedItems.length} предметов`,
      });

      return true; // Сигнализируем о выходе
    } catch (error) {
      console.error('❌ Ошибка при начислении награды:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось начислить награду",
        variant: "destructive"
      });
      return false;
    } finally {
      isClaimingRef.current = false;
    }
  }, [pendingReward, gameData.balance, gameData.inventory, updateGameData, toast]);

  const continueWithRisk = useCallback(() => {
    setAccumulatedReward(prev => {
      console.log(`🎲 ============ ИГРОК ВЫБРАЛ ПРОДОЛЖИТЬ ============`);
      console.log(`💰 Сохраняем накопленную награду:`, prev);
      console.log(`⚠️ При поражении вся награда будет потеряна!`);
      console.log(`🎲 ================================================\n`);
      return prev; // Возвращаем то же значение, просто для логирования
    });
    
    // Закрываем модальное окно, но сохраняем накопленную награду
    setPendingReward(null);
    isProcessingRef.current = false; // Разрешаем обработку следующего уровня
    // НЕ сбрасываем lastProcessedLevelRef - пусть он отслеживает последний обработанный уровень
    
    toast({
      title: "Продолжаем!",
      description: "Будьте осторожны - при поражении вся награда будет потеряна",
      variant: "default"
    });
  }, [toast]);

  const resetRewards = useCallback(() => {
    setAccumulatedReward(null);
    setPendingReward(null);
    lastProcessedLevelRef.current = -1;
    isProcessingRef.current = false;
  }, []);

  return {
    pendingReward,
    accumulatedReward,
    processDungeonCompletion,
    claimRewardAndExit,
    continueWithRisk,
    resetRewards,
    calculateReward
  };
};