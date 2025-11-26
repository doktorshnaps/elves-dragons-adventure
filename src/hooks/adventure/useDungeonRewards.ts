import { useState, useCallback, useRef } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types/inventory';
import { getMonsterLoot } from '@/utils/monsterLootMapping';
import { v4 as uuidv4 } from 'uuid';
import { newItems } from '@/data/newItems';
import { useAddItemToInstances } from '@/hooks/useAddItemToInstances';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useQueryClient } from '@tanstack/react-query';

// Global idempotency for claim route (survives component remounts)
let globalClaimLock = false;
let lastClaimKeyGlobal: string | null = null;
let lastClaimAtGlobal = 0;
const CLAIM_TTL_MS = 7000;

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
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const isClaimingRef = useRef(false);
  const lastProcessedLevelRef = useRef<number>(-1);
  const isProcessingRef = useRef(false);
  const lastClaimKeyRef = useRef<string | null>(null);
  const isDefeatedRef = useRef(false); // Флаг поражения для блокировки начисления treasure hunt предметов

  const calculateReward = useCallback(async (monsters: MonsterKill[]): Promise<DungeonReward> => {
    console.log('🎯 calculateReward called with monsters:', monsters);
    let level1to3Count = 0;
    let level4to7Count = 0;
    let level8to10Count = 0;
    const lootedItems: Item[] = [];

    // Подсчитываем убитых монстров по уровням для подземелья "Гнездо Гигантских Пауков"
    for (const monster of monsters) {
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
          const allLoot = await getMonsterLoot(monster.name, dungeonNumber, monster.level, accountId || undefined);
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
      isDefeatedRef.current = true; // Устанавливаем флаг поражения
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

  // 🔒 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: claimKey приходит из useDungeonSync, не генерируется локально!
  const claimRewardAndExit = useCallback(async (
    claimKey: string | null, // Получаем из useDungeonSync.getCurrentClaimKey()
    cardHealthUpdates: Array<{ card_instance_id: string; current_health: number; current_defense: number }> = [],
    dungeonType: string,
    currentLevel: number
  ) => {
    // КРИТИЧНО: Если нет claim_key или награды (поражение), все равно сохраняем здоровье карт!
    const shouldSkipRewards = !claimKey || !pendingReward;
    
    if (shouldSkipRewards) {
      console.log('💔 [claimRewardAndExit] Поражение/ошибка - сохраняем ТОЛЬКО здоровье карт, без наград');
      
      // Сохраняем здоровье карт через batch update даже без claim наград
      if (cardHealthUpdates.length > 0 && accountId) {
        try {
          console.log('🩹 [claimRewardAndExit] Batch update здоровья карт при поражении:', cardHealthUpdates.length);
          
          const { error: batchError } = await supabase.rpc('batch_update_card_stats', {
            p_wallet_address: accountId,
            p_card_updates: cardHealthUpdates
          });
          
          if (batchError) {
            console.error('❌ Ошибка batch update при поражении:', batchError);
            toast({
              title: "Ошибка",
              description: "Не удалось сохранить состояние карт",
              variant: "destructive"
            });
            return false;
          }
          
          console.log('✅ Здоровье карт сохранено после поражения');
          
          // Инвалидируем кеш карт для обновления UI
          await queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
          
        } catch (err) {
          console.error('❌ Критическая ошибка batch update:', err);
          return false;
        }
      }
      
      return true;
    }
    
    if (isClaimingRef.current) {
      console.log('⚠️ Повторный вызов claimRewardAndExit заблокирован');
      return false;
    }
    
    console.log('💔 [claimRewardAndExit] Получены обновления здоровья карт:', cardHealthUpdates.length);

    // КРИТИЧЕСКАЯ ПРОВЕРКА: Если игрок был побеждён, НЕ начисляем treasure hunt предметы
    if (isDefeatedRef.current) {
      console.log('❌ Игрок был побеждён! Отменяем начисление treasure hunt предметов');
      return false;
    }

    // Global and storage-based idempotency
    const now = Date.now();
    if (globalClaimLock && lastClaimKeyGlobal === claimKey && now - lastClaimAtGlobal < CLAIM_TTL_MS) {
      console.warn('⏭️ CLAIM SKIP (global lock)', { claimKey });
      return false;
    }

    const storageKey = `claim_reward:${accountId || 'local'}:${claimKey}`;
    try {
      if (typeof window !== 'undefined') {
        const tsRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
        const ts = tsRaw ? parseInt(tsRaw) : 0;
        if (ts && now - ts < CLAIM_TTL_MS) {
          console.warn('⏭️ CLAIM SKIP (storage TTL)', { claimKey, ttl: CLAIM_TTL_MS });
          return false;
        }
        // Preemptively set session guard to block concurrent doubles
        sessionStorage.setItem(storageKey, String(now));
      }
    } catch {}

    // Set locks
    lastClaimKeyRef.current = claimKey;
    globalClaimLock = true;
    lastClaimKeyGlobal = claimKey;
    lastClaimAtGlobal = now;

    isClaimingRef.current = true;

    console.log(`💎 ============ ЗАБИРАЕМ НАГРАДУ И ВЫХОДИМ ============`);
    console.log(`🎁 Награда к начислению:`, pendingReward);
    console.log(`🔑 Используем claim_key из сервера:`, claimKey);

    try {
      const rewardAmount = pendingReward.totalELL || 0;
      const lootedItems = pendingReward.lootedItems || [];
      
      console.log(`💰 Начисляем ${rewardAmount} ELL`);
      console.log(`🎒 Начисляем ${lootedItems.length} предметов в item_instances`);
      
      // 🔒 КРИТИЧНО: Отправляем только claim_key, НЕ wallet_address!
      console.log('💔 [useDungeonRewards] ========== ОТПРАВКА В EDGE FUNCTION ==========');
      console.log('💔 [useDungeonRewards] claim_key:', claimKey.substring(0, 8));
      console.log('💔 [useDungeonRewards] card_health_updates:', cardHealthUpdates.length);
      
      const edgeFunctionPayload = {
        claim_key: claimKey, // Только claim_key!
        dungeon_type: dungeonType,
        level: currentLevel,
        ell_reward: rewardAmount,
        experience_reward: 0,
        items: lootedItems.map(it => ({
          template_id: (it as any).template_id,
          item_id: (it as any).item_id,
          name: it.name,
          type: it.type
        })),
        card_kills: [],
        card_health_updates: cardHealthUpdates
      };
      
      console.log('📤 [useDungeonRewards] ПОЛНАЯ СТРУКТУРА payload для claim-battle-rewards:');
      console.log(JSON.stringify(edgeFunctionPayload, null, 2));
      
      try {
        const { data: battleData, error: battleError } = await supabase.functions.invoke('claim-battle-rewards', {
          body: edgeFunctionPayload
        });
        
        if (battleError) {
          console.error('❌ Ошибка claim-battle-rewards:', battleError);
          toast({
            title: "Ошибка",
            description: "Не удалось начислить награды",
            variant: "destructive"
          });
          return false;
        }
        
        console.log('✅ Награды успешно начислены:', battleData);
        
        // Очищаем claim_key после успешного клейма
        localStorage.removeItem('currentClaimKey');
        
        // Инвалидируем кеши для обновления UI
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['gameData', accountId] }),
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] }),
          queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] })
        ]);
        
        toast({
          title: "🎉 Награды получены!",
          description: `+${rewardAmount} ELL, ${lootedItems.length} предметов`
        });
        
      } catch (battleErr) {
        console.error('❌ Критическая ошибка при начислении наград:', battleErr);
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при начислении наград",
          variant: "destructive"
        });
        return false;
      }
      
      // Сброс локальных состояний после успешного начисления
      setPendingReward(null);
      setAccumulatedReward(null);
      lastProcessedLevelRef.current = -1;
      isDefeatedRef.current = false;
      
      console.log(`✅ ============ НАГРАДЫ НАЧИСЛЕНЫ И ВЫХОД ВЫПОЛНЕН ============`);
      return true;
      
    } catch (error) {
      console.error('❌ Критическая ошибка в claimRewardAndExit:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось начислить награды",
        variant: "destructive"
      });
      return false;
    } finally {
      isClaimingRef.current = false;
    }
  }, [pendingReward, accountId, queryClient, toast]);

  const continueWithRisk = useCallback(() => {
    console.log('🎲 Игрок решил продолжить с риском потерять награду');
    // Награда остается в pending и будет начислена позже
    setPendingReward(null); // Сброс pending награды, но accumulated остается
  }, []);

  const resetRewards = useCallback(() => {
    console.log('🔄 Сброс всех наград');
    setPendingReward(null);
    setAccumulatedReward(null);
    lastProcessedLevelRef.current = -1;
    isClaimingRef.current = false;
    isDefeatedRef.current = false;
  }, []);

  return {
    pendingReward,
    accumulatedReward,
    processDungeonCompletion,
    claimRewardAndExit,
    continueWithRisk,
    resetRewards
  };
};
