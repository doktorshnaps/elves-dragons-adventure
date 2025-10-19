import { useState, useCallback, useRef } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types/inventory';
import { getMonsterLoot } from '@/utils/monsterLootMapping';
import { v4 as uuidv4 } from 'uuid';
import { newItems } from '@/data/newItems';

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
  const isClaimingRef = useRef(false);
  const lastProcessedLevelRef = useRef<number>(-1);
  const isProcessingRef = useRef(false);

  const calculateReward = useCallback(async (monsters: MonsterKill[]): Promise<DungeonReward> => {
    console.log('🎯 calculateReward called with monsters:', monsters);
    let level1to3Count = 0;
    let level4to7Count = 0;
    let level8to10Count = 0;
    const lootedItems: Item[] = [];

    // Мапинг типов подземелий к номерам
    const dungeonTypeToNumber: Record<string, number> = {
      'spider_nest': 1,
      'bone_dungeon': 2,
      'dark_mage': 3,
      'sea_serpent': 4,
      'ice_throne': 5,
      'forgotten_souls': 6,
      'dragon_lair': 7,
      'pantheon_gods': 8
    };

    // Подсчитываем убитых монстров по уровням и собираем лут
    for (const monster of monsters) {
      console.log('🏹 Processing monster:', monster);
      
      if (monster.level >= 1 && monster.level <= 3) {
        level1to3Count++;
      } else if (monster.level >= 4 && monster.level <= 7) {
        level4to7Count++;
      } else if (monster.level >= 8 && monster.level <= 10) {
        level8to10Count++;
      }

      // Генерируем предметы с монстра используя систему дропов из БД
      if (monster.name && monster.dungeonType) {
        const dungeonNumber = dungeonTypeToNumber[monster.dungeonType] || 1;
        console.log(`🎁 Rolling loot for monster: ${monster.name} (dungeon ${dungeonNumber}, level ${monster.level})`);
        
        const monsterLoot = await getMonsterLoot(monster.name, dungeonNumber, monster.level);
        
        if (monsterLoot && monsterLoot.length > 0) {
          console.log(`💰 Generated ${monsterLoot.length} items from monster:`, monsterLoot);
          lootedItems.push(...monsterLoot);
        } else {
          console.log('❌ No loot generated for:', monster.name);
        }
      } else {
        console.log('⚠️ Monster missing name or dungeonType:', monster);
      }
    }

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
    if (isProcessingRef.current || lastProcessedLevelRef.current === currentLevel) {
      console.log(`⚠️ Пропуск дублирующего вызова для уровня ${currentLevel}`);
      return;
    }

    isProcessingRef.current = true;
    lastProcessedLevelRef.current = currentLevel;

    console.log(`💎 Обработка завершения уровня. Монстров убито: ${monsters.length}, уровень: ${currentLevel}, Поражение: ${isDefeat}`);

    // Если поражение - сбрасываем все накопленные награды
    if (isDefeat) {
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

    const levelReward = await calculateReward(monsters);
    
    // Суммируем с накопленной наградой
    const totalAccumulated: DungeonReward = accumulatedReward ? {
      totalELL: accumulatedReward.totalELL + levelReward.totalELL,
      monstersKilled: accumulatedReward.monstersKilled + levelReward.monstersKilled,
      completionBonus: 0,
      breakdown: {
        level1to3: {
          count: accumulatedReward.breakdown.level1to3.count + levelReward.breakdown.level1to3.count,
          reward: accumulatedReward.breakdown.level1to3.reward + levelReward.breakdown.level1to3.reward
        },
        level4to7: {
          count: accumulatedReward.breakdown.level4to7.count + levelReward.breakdown.level4to7.count,
          reward: accumulatedReward.breakdown.level4to7.reward + levelReward.breakdown.level4to7.reward
        },
        level8to10: {
          count: accumulatedReward.breakdown.level8to10.count + levelReward.breakdown.level8to10.count,
          reward: accumulatedReward.breakdown.level8to10.reward + levelReward.breakdown.level8to10.reward
        }
      },
      isFullCompletion: false,
      lootedItems: [...(accumulatedReward.lootedItems || []), ...(levelReward.lootedItems || [])]
    } : levelReward;

    totalAccumulated.isFullCompletion = isFullCompletion;

    // Если полное завершение подземелья (дошли до 10 уровня), добавляем бонус
    if (isFullCompletion) {
      totalAccumulated.completionBonus = Math.floor(totalAccumulated.totalELL * 0.5);
      totalAccumulated.totalELL += totalAccumulated.completionBonus;
    }

    setAccumulatedReward(totalAccumulated);
    setPendingReward(totalAccumulated);
    isProcessingRef.current = false;
  }, [calculateReward, toast, accumulatedReward]);

  const claimRewardAndExit = useCallback(async () => {
    if (!pendingReward || isClaimingRef.current) return;
    isClaimingRef.current = true;

    try {
      const rewardAmount = pendingReward.totalELL || 0;
      const lootedItems = pendingReward.lootedItems || [];
      
      console.log(`🎁 Начисление награды: ${rewardAmount} ELL и ${lootedItems.length} предметов`);
      console.log(`🎒 Предметы для добавления:`, lootedItems);
      
      // Объединяем обновления баланса и инвентаря в один вызов
      const updates: any = {};
      
      if (rewardAmount > 0) {
        const currentBalance = gameData.balance || 0;
        updates.balance = currentBalance + rewardAmount;
        console.log(`💰 Новый баланс: ${updates.balance} (было: ${currentBalance})`);
      }

      if (lootedItems.length > 0) {
        const currentInventory = gameData.inventory || [];
        updates.inventory = [...currentInventory, ...lootedItems];
        console.log(`🎒 Новый инвентарь: ${updates.inventory.length} предметов (было: ${currentInventory.length})`);
      }

      // Единый вызов updateGameData с обоими обновлениями
      if (Object.keys(updates).length > 0) {
        await updateGameData(updates);
        console.log('✅ Награда успешно начислена');
      }

      // Сбрасываем все состояния
      setPendingReward(null);
      setAccumulatedReward(null);
      
      toast({
        title: "Награда получена!",
        description: `Получено ${rewardAmount} ELL и ${lootedItems.length} предметов`,
      });

      return true; // Сигнализируем о выходе
    } catch (error) {
      console.error('Ошибка при начислении награды:', error);
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
    // Закрываем модальное окно, но сохраняем накопленную награду
    setPendingReward(null);
    isProcessingRef.current = false; // Разрешаем обработку следующего уровня
    lastProcessedLevelRef.current = -1; // Сбрасываем последний обработанный уровень для нового раунда
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
