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
  const isClaimingRef = useRef(false);
  const lastProcessedLevelRef = useRef<number>(-1);
  const isProcessingRef = useRef(false);
  const lastClaimKeyRef = useRef<string | null>(null);

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
          const allLoot = await getMonsterLoot(monster.name, dungeonNumber, monster.level);
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

  const claimRewardAndExit = useCallback(async () => {
    if (!pendingReward || isClaimingRef.current) {
      console.log('⚠️ Повторный вызов claimRewardAndExit заблокирован', { 
        hasPendingReward: !!pendingReward, 
        isClaiming: isClaimingRef.current 
      });
      return;
    }

    // Создаем детерминированный ключ для этой награды, чтобы предотвратить повторные начисления
    const itemsKey = (pendingReward.lootedItems || [])
      .map(it => it.name)
      .sort()
      .join('|');
    const claimKey = `${pendingReward.totalELL}::${itemsKey}`;

    // In-hook quick guard
    if (lastClaimKeyRef.current === claimKey) {
      console.log('⚠️ CLAIM SKIP (hook key already processed)', claimKey);
      return;
    }

    // Global and storage-based idempotency
    const now = Date.now();
    if (globalClaimLock && lastClaimKeyGlobal === claimKey && now - lastClaimAtGlobal < CLAIM_TTL_MS) {
      console.warn('⏭️ CLAIM SKIP (global lock)', { claimKey });
      return;
    }

    const storageKey = `claim_reward:${(accountId || 'local')}:${claimKey}`;
    try {
      if (typeof window !== 'undefined') {
        const tsRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
        const ts = tsRaw ? parseInt(tsRaw) : 0;
        if (ts && now - ts < CLAIM_TTL_MS) {
          console.warn('⏭️ CLAIM SKIP (storage TTL)', { claimKey, ttl: CLAIM_TTL_MS });
          return;
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
    console.log(`🔑 Уникальный ключ награды:`, claimKey);

    try {
      const rewardAmount = pendingReward.totalELL || 0;
      const lootedItems = pendingReward.lootedItems || [];
      
      console.log(`💰 Начисляем ${rewardAmount} ELL`);
      console.log(`🎒 Начисляем ${lootedItems.length} предметов в item_instances`);
      
      // Объединяем обновления баланса в один вызов
      const updates: any = {};
      
      if (rewardAmount > 0) {
        const currentBalance = gameData.balance || 0;
        updates.balance = currentBalance + rewardAmount;
        console.log(`💰 Новый баланс: ${updates.balance} ELL (было: ${currentBalance})`);
      }

      if (lootedItems.length > 0) {
        // Отправляем начисление предметов через edge-функцию с идемпотентностью по claimKey
        try {
          const normalized = lootedItems.map(it => ({
            name: it.name ?? null,
            type: it.type ?? 'material',
            template_id: (it as any).template_id ?? null,
            item_id: (it as any).item_id ?? null,
          }));
          console.log('🛰️ Вызов edge claim-item-reward', { count: normalized.length, claimKey });
          const { data, error } = await supabase.functions.invoke('claim-item-reward', {
            body: {
              wallet_address: accountId || 'local',
              claim_key: claimKey,
              items: normalized,
            }
          });
          if (error) {
            console.error('❌ Edge claim-item-reward error', error);
            throw error;
          }
          console.log('✅ Edge claim-item-reward result', data);
        } catch (edgeErr) {
          console.error('❌ Ошибка edge claim-item-reward, fallback отменён чтобы избежать дублей:', edgeErr);
          // Не вызываем локальный addItemsToInstances, чтобы не удвоить предметы
        }
      }

      // Единый вызов updateGameData с обоими обновлениями
      if (Object.keys(updates).length > 0) {
        await updateGameData(updates);
        console.log('✅ Награда успешно начислена!');
        // Persist claim timestamp to strengthen idempotency across sessions
        try {
          if (typeof window !== 'undefined') {
            const storageKey = `claim_reward:${(accountId || 'local')}:${claimKey}`;
            localStorage.setItem(storageKey, String(Date.now()));
          }
        } catch {}
        
        // Начисляем реферальные бонусы (6% -> 3% -> 1.5%)
        
        // Начисляем реферальные бонусы (6% -> 3% -> 1.5%)
        if (rewardAmount > 0 && accountId) {
          try {
            console.log(`🤝 Обработка реферальных начислений для ${accountId}, сумма: ${rewardAmount}`);
            await supabase.rpc('process_referral_earnings', {
              p_earner_wallet_address: accountId,
              p_amount: rewardAmount
            });
            console.log('✅ Реферальные начисления обработаны');
          } catch (refError) {
            console.error('❌ Ошибка при обработке реферальных начислений:', refError);
            // Не блокируем основной процесс если реферальная система не сработала
          }
        }
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

      // НЕ сбрасываем флаг isClaimingRef, чтобы предотвратить повторные вызовы
      return true; // Сигнализируем о выходе
    } catch (error) {
      console.error('❌ Ошибка при начислении награды:', error);
      isClaimingRef.current = false; // Сбрасываем только при ошибке
      toast({
        title: "Ошибка",
        description: "Не удалось начислить награду",
        variant: "destructive"
      });
      return false;
    }
  }, [pendingReward, gameData.balance, updateGameData, toast, addItemsToInstances, accountId]);

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
    isClaimingRef.current = false;
    lastClaimKeyRef.current = null; // Сбрасываем ключ для новых сессий
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