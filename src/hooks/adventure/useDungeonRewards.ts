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
import { claimBattleRewards as claimBattleRewardsUtil } from '@/utils/claimBattleRewards';

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
      isDefeatedRef.current = true;
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

    // 🔒 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Больше не рассчитываем награды на клиенте
    // Просто сохраняем список убитых монстров для отправки на сервер при claim
    console.log(`💰 Сохранение информации об убитых монстрах для server-side расчета`);
    
    // Создаем "фиктивную" награду для UI, чтобы показать пользователю прогресс
    // Реальные награды будут рассчитаны сервером
    const displayReward: DungeonReward = {
      totalELL: 0, // Будет рассчитано сервером
      monstersKilled: monsters.length,
      completionBonus: 0,
      breakdown: {
        level1to3: { count: 0, reward: 0 },
        level4to7: { count: 0, reward: 0 },
        level8to10: { count: 0, reward: 0 }
      },
      isFullCompletion: isFullCompletion,
      lootedItems: [] // Будет рассчитано сервером
    };

    console.log(`✅ ИТОГОВАЯ информация для уровня ${currentLevel}:`, displayReward);
    console.log(`📈 Всего монстров убито: ${displayReward.monstersKilled}`);
    console.log(`🏁 ============================================================\n`);

    setPendingReward(displayReward);
    setAccumulatedReward(displayReward);
    
    isProcessingRef.current = false;
  }, [toast]);

  const claimRewardAndExit = useCallback(async (
    claimKey: string | null,
    cardHealthUpdates: Array<{ card_instance_id: string; current_health: number; current_defense: number }> = [],
    dungeonType: string,
    currentLevel: number,
    monsters: MonsterKill[] = [] // Добавлен параметр для killed_monsters
  ) => {
    console.log('🚨 [claimRewardAndExit] ========== ФУНКЦИЯ ВЫЗВАНА ==========');
    console.log('🚨 claim_key:', claimKey?.substring(0, 8));
    console.log('🚨 pendingReward:', pendingReward);
    console.log('🚨 cardHealthUpdates.length:', cardHealthUpdates.length);
    
    // КРИТИЧНО: Если нет claim_key — сохраняем только здоровье карт (поражение/сдача)
    // Но если есть claim_key — ВСЕГДА делаем claim, даже если pendingReward пустой
    const shouldSkipRewards = !claimKey;
    
    if (shouldSkipRewards) {
      console.log('💔 [claimRewardAndExit] Нет claim_key - сохраняем ТОЛЬКО здоровье карт, без наград');
      
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
            return { success: false, error: 'Не удалось сохранить состояние карт' };
          }
          
          console.log('✅ Здоровье карт сохранено после поражения');
          
          // Инвалидируем кеш карт для обновления UI
          await queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
          
        } catch (err) {
          console.error('❌ Критическая ошибка batch update:', err);
          return { success: false, error: String(err) };
        }
      }
      
      return { success: true, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
    }
    
    if (isClaimingRef.current) {
      console.log('⚠️ Повторный вызов claimRewardAndExit заблокирован');
      return { success: false, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
    }
    
    console.log('💔 [claimRewardAndExit] Получены обновления здоровья карт:', cardHealthUpdates.length);

    // КРИТИЧЕСКАЯ ПРОВЕРКА: Если игрок был побеждён, НЕ начисляем treasure hunt предметы
    if (isDefeatedRef.current) {
      console.log('❌ Игрок был побеждён! Отменяем начисление treasure hunt предметов');
      return { success: false, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
    }

    // Global and storage-based idempotency
    const now = Date.now();
    if (globalClaimLock && lastClaimKeyGlobal === claimKey && now - lastClaimAtGlobal < CLAIM_TTL_MS) {
      console.warn('⏭️ CLAIM SKIP (global lock)', { claimKey });
      return { success: false, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
    }

    const storageKey = `claim_reward:${accountId || 'local'}:${claimKey}`;
    try {
      if (typeof window !== 'undefined') {
        const tsRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
        const ts = tsRaw ? parseInt(tsRaw) : 0;
        if (ts && now - ts < CLAIM_TTL_MS) {
          console.warn('⏭️ CLAIM SKIP (storage TTL)', { claimKey, ttl: CLAIM_TTL_MS });
          return { success: false, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
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
      
      // 🔒 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Отправляем только минимум данных
      // Сервер сам рассчитает награды на основе killed_monsters
      const killed_monsters = monsters.map(m => ({
        monster_name: m.name,
        level: m.level
      }));

      console.log('💔 [useDungeonRewards] ========== ОТПРАВКА В EDGE FUNCTION ==========');
      console.log('💔 [useDungeonRewards] claim_key:', claimKey.substring(0, 8));
      console.log('💔 [useDungeonRewards] killed_monsters:', killed_monsters.length);
      console.log('💔 [useDungeonRewards] card_health_updates:', cardHealthUpdates.length);
      
      const edgeFunctionPayload = {
        claim_key: claimKey,
        dungeon_type: dungeonType,
        level: currentLevel,
        killed_monsters, // Список убитых монстров для server-side расчета
        card_kills: [],
        card_health_updates: cardHealthUpdates
      };
      
      console.log('📤 [useDungeonRewards] ПОЛНАЯ СТРУКТУРА payload для claim-battle-rewards:');
      console.log(JSON.stringify(edgeFunctionPayload, null, 2));
      
      try {
        // 🔒 SECURITY: Use utility function with challenge/nonce flow
        const result = await claimBattleRewardsUtil({
          wallet_address: accountId!,
          claim_key: claimKey,
          dungeon_type: dungeonType,
          level: currentLevel,
          ell_reward: 0, // Server will calculate
          experience_reward: 0, // Server will calculate
          items: [], // Server will calculate from killed_monsters
          killed_monsters, // Pass killed monsters for server-side calculation
          card_kills: [],
          card_health_updates: cardHealthUpdates
        });
        
        if (!result.success) {
          console.error('❌ Ошибка claim-battle-rewards:', result.message);
          toast({
            title: "Ошибка",
            description: result.message || "Не удалось начислить награды",
            variant: "destructive"
          });
          return { success: false, error: result.message || 'Не удалось начислить награды', rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
        }
        
        console.log('✅ Награды успешно начислены:', result.data);
        
        // Получаем реальные награды с сервера для отображения toast
        const serverRewards = result.data || {};
        const actualEllReward = serverRewards.ell_reward || 0;
        const actualExperienceReward = serverRewards.experience_reward || 0;
        const actualItems = Array.isArray(serverRewards.items) ? serverRewards.items : [];
        
        console.log('📊 Обработанные награды для модалки:', {
          ell_reward: actualEllReward,
          experience_reward: actualExperienceReward,
          items: actualItems
        });
        
        // Очищаем claim_key после успешного клейма
        localStorage.removeItem('currentClaimKey');
        
        // Инвалидируем кеши для обновления UI
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['gameData', accountId] }),
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] }),
          queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] })
        ]);
        
        // ✅ КРИТИЧНО: НЕ сбрасываем pendingReward здесь!
        // Родительский компонент сам сбросит после закрытия ClaimRewardsResultModal
        // Иначе возникает race condition: pendingReward=null ДО открытия модалки
        // setPendingReward(null);
        // setAccumulatedReward(null);
        
        lastProcessedLevelRef.current = -1;
        isDefeatedRef.current = false;
        
        console.log(`✅ ============ НАГРАДЫ НАЧИСЛЕНЫ И ВЫХОД ВЫПОЛНЕН ============`);
        console.log(`✅ ВНИМАНИЕ: pendingReward НЕ сброшен, будет сброшен родителем после закрытия модалки`);
        
        // Возвращаем данные наград для отображения в модальном окне
        return { 
          success: true, 
          rewards: {
            ell_reward: actualEllReward,
            experience_reward: actualExperienceReward,
            items: actualItems
          }
        };
        
      } catch (battleErr) {
        console.error('❌ Критическая ошибка при начислении наград:', battleErr);
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при начислении наград",
          variant: "destructive"
        });
        return { success: false, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
      }
      
    } catch (error) {
      console.error('❌ Критическая ошибка в claimRewardAndExit:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось начислить награды",
        variant: "destructive"
      });
      return { success: false, rewards: { ell_reward: 0, experience_reward: 0, items: [] } };
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
