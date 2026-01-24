import React, { useState, startTransition, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useTeamBattle } from '@/hooks/team/useTeamBattle';
import { AttackOrderSelector } from './AttackOrderSelector';
import { TeamBattleArena } from './TeamBattleArena';
import { DungeonType } from '@/constants/dungeons';
import { DungeonRewardModal } from '@/components/game/modals/DungeonRewardModal';
import { ClaimRewardsResultModal } from '@/components/game/modals/ClaimRewardsResultModal';
import { useDungeonRewards } from '@/hooks/adventure/useDungeonRewards';
import { setItemTemplatesCache, loadActiveTreasureHunt } from '@/utils/monsterLootMapping';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useDungeonSync } from '@/hooks/useDungeonSync';
import { useEnergy } from '@/utils/energyManager';
import { useToast } from '@/hooks/use-toast';
import { useGameStore } from '@/stores/gameStore';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { BattleSpeedProvider } from '@/contexts/BattleSpeedContext';
import { useBattleSpeed } from '@/contexts/BattleSpeedContext';
import { useItemTemplates } from '@/hooks/useItemTemplates';
import { useQueryClient } from '@tanstack/react-query';
import { useCardInstances } from '@/hooks/useCardInstances';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ActiveDungeonWarning } from '@/components/dungeon/ActiveDungeonWarning';

interface TeamBattlePageProps {
  dungeonType: DungeonType;
}

const TeamBattlePageInner: React.FC<TeamBattlePageProps> = ({
  dungeonType
}) => {
  const { language } = useLanguage();
  const { adjustDelay } = useBattleSpeed();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // ✅ КРИТИЧНО: Восстанавливаем battleStarted из Zustand, если есть активная сессия
  const [battleStarted, setBattleStarted] = useState<boolean>(() => {
    const savedState = useGameStore.getState().teamBattleState;
    const isRestoredSession = savedState?.dungeonType === dungeonType && savedState?.level > 0;
    console.log('🔄 [TeamBattlePage] Restoring battleStarted:', isRestoredSession, 'from saved level:', savedState?.level);
    return isRestoredSession;
  });
  const [claimResultModal, setClaimResultModal] = useState<{
    isOpen: boolean;
    rewards: {
      ell_reward: number;
      experience_reward: number;
      items: Array<{ name: string; type: string; quantity?: number }>;
    } | null;
  }>({
    isOpen: false,
    rewards: null
  });
  
  // Состояние для предупреждения об активной сессии
  const [activeSessionWarning, setActiveSessionWarning] = useState<{
    isOpen: boolean;
    sessions: Array<{ device_id: string; dungeon_type: string; level: number; last_activity: number }>;
  }>({ isOpen: false, sessions: [] });
  
  // ✅ КРИТИЧНО: Восстанавливаем monstersKilled из Zustand при возврате в подземелье
  const [monstersKilled, setMonstersKilled] = useState<Array<{level: number, dungeonType: string, name?: string}>>(() => {
    const savedState = useGameStore.getState().teamBattleState;
    if (savedState?.dungeonType === dungeonType && savedState?.monstersKilled) {
      console.log('🔄 [TeamBattlePage] Restoring monstersKilled:', savedState.monstersKilled.length);
      return savedState.monstersKilled;
    }
    return [];
  });
  // ✅ Ref инициализируем напрямую из сохранённого состояния
  const savedMonstersKilled = (() => {
    const savedState = useGameStore.getState().teamBattleState;
    if (savedState?.dungeonType === dungeonType && savedState?.monstersKilled) {
      return savedState.monstersKilled;
    }
    return [];
  })();
  const monstersKilledRef = useRef<Array<{level: number, dungeonType: string, name?: string}>>(savedMonstersKilled);
  const prevAliveOpponentsRef = React.useRef<number>(0);
  const prevOpponentsRef = React.useRef<Array<{id: number, name: string, health: number}>>([]);
  const processedLevelRef = React.useRef<number | null>(null);
  
  // ✅ КРИТИЧНО: Используем state вместо ref, чтобы изменение вызывало ре-рендер
  // Это исправляет зависание на "Обработка результатов боя..."
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  
  const { accountId } = useWalletContext();
  const { deviceId, startDungeonSession, endDungeonSession, updateDungeonLevel, getCurrentClaimKey } = useDungeonSync();
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [showingFinishDelay, setShowingFinishDelay] = useState(false);
  // Время создания сессии - используется чтобы не проверять сессию сразу после её создания
  const sessionCreatedAtRef = useRef<number>(0);
  
  // Инициализация кеша item templates и treasure hunt из StaticGameData
  const { templates: itemTemplatesMap } = useItemTemplates();
  
  useEffect(() => {
    // Предзагрузка кеша при наличии templates (выполняется один раз или при обновлении templates)
    if (itemTemplatesMap.size > 0) {
      const templatesArray = Array.from(itemTemplatesMap.values());
      setItemTemplatesCache(templatesArray);
      
      // ⚠️ ОПТИМИЗАЦИЯ PHASE 2A: Загружаем treasure hunt событие в кеш ОДИН РАЗ перед боем
      // чтобы избежать запросов к БД во время активного сражения
      loadActiveTreasureHunt().then(() => {
        console.log('✅ [INIT] Item templates and treasure hunt cache preloaded');
      }).catch(() => {
        console.log('ℹ️ [INIT] No active treasure hunt event to cache');
      });
    }
  }, [itemTemplatesMap.size]); // Зависимость от размера карты, чтобы перезагрузить при обновлении
  
  const { 
    pendingReward, 
    accumulatedReward,
    processDungeonCompletion, 
    claimRewardAndExit, 
    continueWithRisk,
    resetRewards 
  } = useDungeonRewards();
  
  const { 
    battleState,
    attackOrder,
    updateAttackOrder,
    executePlayerAttack,
    executeEnemyAttack,
    executeAbilityUse,
    resetBattle,
    handleLevelComplete,
    isPlayerTurn,
    alivePairs,
    aliveOpponents,
    lastRoll
  } = useTeamBattle(dungeonType, 1, battleStarted);
  const { cardInstances } = useCardInstances();
  
  // Функция для фактического начала боя (после проверок)
  const proceedWithBattleStart = async () => {
    // Снимаем энергию ТОЛЬКО если это первый уровень (вход в подземелье)
    if (battleState.level === 1) {
      const { getInitialEnergyState } = await import('@/utils/energyManager');
      const currentEnergy = getInitialEnergyState();
      
      console.log('⚡ Проверка энергии перед входом в подземелье:', currentEnergy);
      
      if (currentEnergy.current <= 0) {
        console.warn('❌ Not enough energy to start dungeon. Current:', currentEnergy.current);
        toast({
          title: t(language, 'battlePage.insufficientEnergy'),
          description: t(language, 'battlePage.waitForEnergy'),
          variant: "destructive"
        });
        return;
      }
      
      // Снимаем энергию только при первом входе
      const energyUsed = useEnergy();
      if (!energyUsed) {
        console.warn('❌ Failed to use energy');
        return;
      }
      
      console.log('✅ Энергия использована при входе в подземелье. Осталось:', currentEnergy.current - 1);
      
      // Создаем запись в БД о начале сессии подземелья
      const started = await startDungeonSession(dungeonType, 1);
      if (!started) {
        console.warn('Failed to start dungeon session');
        return;
      }
      // ✅ КРИТИЧНО: Запоминаем время создания сессии
      sessionCreatedAtRef.current = Date.now();
      console.log('📝 Session created at:', sessionCreatedAtRef.current);
    } else {
      console.log('⚡ Продолжение боя на уровне', battleState.level, '- энергия не списывается');
    }
    
    startTransition(() => {
      useGameStore.getState().setActiveBattleInProgress(true);
      setBattleStarted(true);
    });
  };
  
  const handleStartBattle = async () => {
    // Только на первом уровне проверяем активные сессии в БД
    if (battleState.level === 1 && accountId) {
      console.log('🔍 Проверка активных сессий в БД перед началом боя...');
      
      try {
        const TIMEOUT = 300000; // 5 минут
        const now = Date.now();
        
        const { data: sessions, error } = await supabase
          .from('active_dungeon_sessions')
          .select('device_id, dungeon_type, level, last_activity')
          .eq('account_id', accountId)
          .gte('last_activity', now - TIMEOUT);
        
        if (error) {
          console.error('❌ Ошибка проверки активных сессий:', error);
          // При сетевой ошибке показываем сообщение и НЕ продолжаем
          toast({
            title: t(language, 'errors.networkError') || 'Ошибка сети',
            description: t(language, 'errors.tryAgain') || 'Проверьте соединение и попробуйте снова',
            variant: 'destructive',
          });
          return;
        }
        
        if (sessions && sessions.length > 0) {
          console.log('⚠️ Найдены активные сессии:', sessions);
          // Показываем предупреждение
          setActiveSessionWarning({ isOpen: true, sessions });
          return;
        }
        
        console.log('✅ Активных сессий не найдено, продолжаем...');
      } catch (err) {
        console.error('❌ Ошибка при проверке сессий:', err);
        // При catch также не продолжаем
        toast({
          title: t(language, 'errors.networkError') || 'Ошибка сети',
          description: t(language, 'errors.tryAgain') || 'Проверьте соединение и попробуйте снова',
          variant: 'destructive',
        });
        return;
      }
    }
    
    await proceedWithBattleStart();
  };
  
  // Обработчик сброса активной сессии
  const handleResetActiveSession = async () => {
    setActiveSessionWarning({ isOpen: false, sessions: [] });
    
    console.log('🛑 Сброс активной сессии...');
    await endDungeonSession(true); // true = сбросить все устройства
    
    // Инвалидируем кеш сессий
    queryClient.invalidateQueries({ queryKey: ['activeDungeonSessions', accountId] });
    
    toast({
      title: t(language, 'activeDungeonWarning.sessionReset'),
      description: t(language, 'activeDungeonWarning.canStartNew'),
    });
  };
  const handleExitAndReset = async () => {
    // КРИТИЧНО: Сначала устанавливаем флаги завершения, ПОТОМ удаляем сессию
    // Флаги теперь управляются только через Zustand
    startTransition(() => {
      useGameStore.getState().setActiveBattleInProgress(false);
      // ✅ КРИТИЧНО: Очищаем сохраненное состояние боя при полном выходе
      useGameStore.getState().clearTeamBattleState();
      // Сбрасываем monstersKilled в state (не localStorage)
      setMonstersKilled([]);
    });
    
    // 💀 КРИТИЧНО: Удаляем мертвых героев из команды перед выходом
    const gameStore = useGameStore.getState();
    const currentTeam = gameStore.selectedTeam || [];
    
    if (currentTeam.length > 0 && cardInstances && cardInstances.length > 0) {
      console.log('🔍 Проверка команды на мертвых героев перед выходом...');
      
      const updatedTeam = currentTeam.filter((pair: any) => {
        const heroId = pair.hero?.instanceId || pair.hero?.id;
        const dragonId = pair.dragon?.instanceId || pair.dragon?.id;
        
        // Находим актуальные данные героя
        const heroInstance = cardInstances.find(ci => ci.id === heroId);
        const isHeroDead = heroInstance && heroInstance.current_health <= 0;
        
        if (isHeroDead) {
          console.log(`💀 Удаляем мертвого героя из команды: ${pair.hero?.name || 'Unknown'} (health: ${heroInstance?.current_health})`);
          return false;
        }
        
        return true;
      });
      
      if (updatedTeam.length !== currentTeam.length) {
        console.log(`✅ Команда обновлена: ${currentTeam.length} → ${updatedTeam.length} пар`);
        gameStore.setSelectedTeam(updatedTeam);
      }
    }
    
    // Небольшая задержка для синхронизации состояния перед удалением сессии
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Теперь безопасно завершаем сессию подземелья в БД
    await endDungeonSession();
    
    // ✅ КРИТИЧНО: Очищаем localStorage, чтобы /dungeons не показывал устаревшие данные
    try {
      localStorage.removeItem('activeDungeonSession');
      localStorage.removeItem('currentClaimKey');
      localStorage.removeItem('teamBattleState');
      console.log('✅ [handleExitAndReset] localStorage очищен');
    } catch (e) {
      console.warn('⚠️ [handleExitAndReset] Failed to clear localStorage:', e);
    }
    
    // КРИТИЧНО: Инвалидируем ВСЕ связанные кэши ДО навигации
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['gameData', accountId] }),
      queryClient.invalidateQueries({ queryKey: ['activeDungeonSessions', accountId] }),
      queryClient.invalidateQueries({ queryKey: ['cardInstances'] }),
    ]);
    
    startTransition(() => {
      resetBattle();
      resetRewards();
      navigate('/dungeons');
    });
  };
  // ✅ Общий хендлер для сохранения состояния боя при выходе в меню
  const handleSaveBattleStateAndNavigate = useCallback((targetRoute: string = '/dungeons') => {
    startTransition(() => {
      // ✅ КРИТИЧНО: Сохраняем ПОЛНОЕ состояние боя в Zustand перед выходом
      // включая opponents, currentTurn, currentAttacker чтобы резюмировать бой
      const currentBattleState = {
        level: battleState.level,
        dungeonType: dungeonType,
        playerPairs: battleState.playerPairs,
        opponents: battleState.opponents, // ✅ Сохраняем противников!
        currentTurn: battleState.currentTurn,
        currentAttacker: battleState.currentAttacker,
        monstersKilled: monstersKilledRef.current
      };
      useGameStore.getState().setTeamBattleState(currentBattleState);
      useGameStore.getState().setActiveBattleInProgress(true);
      console.log('📝 [handleSaveBattleState] Saved FULL battle state to Zustand:', {
        level: battleState.level,
        opponentsCount: battleState.opponents.length,
        playerPairsCount: battleState.playerPairs.length
      });
      
      navigate(targetRoute);
    });
  }, [battleState, dungeonType, navigate]);
  
  const handleBackToMenu = () => {
    handleSaveBattleStateAndNavigate('/dungeons');
  };
  
  // ✅ Callback для TeamBattleArena — сохраняет состояние и переходит в /menu
  const handleArenaMenuReturn = useCallback(() => {
    handleSaveBattleStateAndNavigate('/menu');
  }, [handleSaveBattleStateAndNavigate]);
  const handleNextLevel = async () => {
    // ✅ КРИТИЧНО: Сначала обновляем уровень в БД, потом локально
    const nextLevel = battleState.level + 1;
    
    // Обновляем сессию в БД (асинхронно, не блокируем UI)
    updateDungeonLevel(nextLevel).then(success => {
      if (success) {
        console.log('✅ [handleNextLevel] Level synced to DB:', nextLevel);
      } else {
        console.warn('⚠️ [handleNextLevel] Failed to sync level to DB, continuing anyway');
      }
    });
    
    startTransition(() => {
      handleLevelComplete();
      // НЕ ОЧИЩАЕМ monstersKilled - накапливаем убийства через все уровни подземелья!
      // battleStarted остается true - бой продолжается на следующем уровне
    });
  };

  // Общая функция для сбора обновлений здоровья/брони карт
  const collectCardHealthUpdates = useCallback(() => {
    console.log('🚨 [collectCardHealthUpdates] ========== ФУНКЦИЯ ВЫЗВАНА ==========');
    console.log('🚨 [collectCardHealthUpdates] battleState.playerPairs.length:', battleState.playerPairs.length);
    console.log('🚨 [collectCardHealthUpdates] cardInstances.length:', cardInstances?.length || 0);
    
    // Детальное логирование всех ID в cardInstances
    console.log('🔎 [DEBUG] ========== ВСЕ CARD INSTANCES В ПАМЯТИ ==========');
    if (cardInstances && cardInstances.length > 0) {
      cardInstances.forEach((ci, idx) => {
        console.log(`  [${idx}] instance_id: "${ci.id}"`);
        console.log(`       template_id: "${ci.card_template_id}"`);
        console.log(`       card_type: "${ci.card_type}"`);
        console.log(`       name: "${ci.card_data?.name || 'Unknown'}"`);
      });
    } else {
      console.error('❌ cardInstances пустой или undefined!');
    }
    
    // Детальное логирование всех ID в playerPairs
    console.log('🔎 [DEBUG] ========== ВСЕ КАРТЫ В BATTLE STATE ==========');
    battleState.playerPairs.forEach((pair, idx) => {
      console.log(`  Pair ${idx}:`);
      if (pair.hero) {
        console.log(`    HERO - id: "${pair.hero.id}", name: "${pair.hero.name}"`);
        console.log(`           currentHealth: ${pair.hero.currentHealth}, health: ${pair.hero.health}`);
        console.log(`           currentDefense: ${pair.hero.currentDefense}, defense: ${pair.hero.defense}`);
      }
      if (pair.dragon) {
        console.log(`    DRAGON - id: "${pair.dragon.id}", name: "${pair.dragon.name}"`);
        console.log(`             currentHealth: ${pair.dragon.currentHealth}, health: ${pair.dragon.health}`);
        console.log(`             currentDefense: ${pair.dragon.currentDefense}, defense: ${pair.dragon.defense}`);
      }
    });
    
    // Собираем текущее здоровье и броню карт из battleState.playerPairs
    const cardHealthUpdates = battleState.playerPairs.flatMap(pair => {
      const updates = [];
      
      // Героя всегда добавляем - КРИТИЧНО: используем ТОЛЬКО instanceId (UUID из БД)
      if (pair.hero) {
        const heroInstanceId = pair.hero.instanceId;
        
        if (!heroInstanceId) {
          console.error('❌ [CRITICAL] Hero instanceId отсутствует!', {
            heroName: pair.hero.name,
            heroId: pair.hero.id,
            pair: pair
          });
          // НЕ добавляем героя в updates если нет instanceId!
        } else {
          console.log('💚 [HERO] Добавляем в updates:', {
            name: pair.hero.name,
            instance_id: heroInstanceId,
            current_health: Math.floor(pair.hero.currentHealth || 0),
            current_defense: pair.hero.currentDefense || 0
          });
          
          updates.push({
            card_instance_id: heroInstanceId,
            current_health: Math.floor(pair.hero.currentHealth || 0),
            current_defense: pair.hero.currentDefense || 0
          });
        }
      }
      
      // Дракона добавляем если есть
      if (pair.dragon) {
        const dragonInstanceId = pair.dragon.instanceId;
        
        if (!dragonInstanceId) {
          console.error('❌ [CRITICAL] Dragon instanceId отсутствует!', {
            dragonName: pair.dragon.name,
            dragonId: pair.dragon.id,
            pair: pair
          });
          // НЕ добавляем дракона в updates если нет instanceId!
        } else {
          console.log('🐉 [DRAGON] Добавляем в updates:', {
            name: pair.dragon.name,
            instance_id: dragonInstanceId,
            current_health: pair.dragon.currentHealth,
            current_defense: pair.dragon.currentDefense
          });
          
          updates.push({
            card_instance_id: dragonInstanceId, // ТОЛЬКО UUID из БД!
            current_health: pair.dragon.currentHealth || 0,
            current_defense: pair.dragon.currentDefense || 0
          });
        }
      }
      
      return updates;
    });
    
    console.log('💔 [collectCardHealthUpdates] ========== ИТОГОВЫЙ РЕЗУЛЬТАТ ==========');
    console.log('💔 [collectCardHealthUpdates] Собрано card_health_updates:', cardHealthUpdates.length);
    console.log('💔 [collectCardHealthUpdates] Детальная структура card_health_updates:');
    cardHealthUpdates.forEach((update, idx) => {
      console.log(`  [${idx}] card_instance_id: "${update.card_instance_id}"`);
      console.log(`      current_health: ${update.current_health}`);
      console.log(`      current_defense: ${update.current_defense}`);
    });
    console.log('💔 [collectCardHealthUpdates] JSON структура для отправки:', JSON.stringify(cardHealthUpdates, null, 2));
    
    return cardHealthUpdates;
  }, [battleState.playerPairs, cardInstances]);

  const handleClaimAndExit = async () => {
    console.log('💰 ============ ВЫЗОВ handleClaimAndExit ============');
    console.log('💰 Текущее состояние isClaiming:', isClaiming);
    console.log('💰 Monsters killed:', monstersKilled.length);
    console.log('💰 ===================================================');
    
    // Предотвращаем двойной вызов
    if (isClaiming) {
      console.log('⏳ Уже идет процесс начисления наград, пропускаем повторный вызов');
      return;
    }
    
    setIsClaiming(true);
    console.log('✅ isClaiming установлен в true, показываем "Обработка результатов боя..."');
    console.log('💰 ============ НАЧАЛО handleClaimAndExit ============');
    
    // 🔒 Таймаут безопасности: если процесс завис на >15 секунд, сбрасываем и показываем ошибку
    const safetyTimeout = setTimeout(() => {
      console.error('⏰ КРИТИЧЕСКАЯ ОШИБКА: Процесс claim завис на >15 секунд, принудительный сброс');
      setIsClaiming(false);
      toast({
        title: "⏰ Таймаут",
        description: "Процесс обработки наград завис. Попробуйте переподключиться.",
        variant: "destructive"
      });
      handleExitAndReset();
    }, 15000); // 15 секунд таймаут
    
    toast({
      title: "🚨 Сохранение прогресса",
      description: "Начинаем сохранение здоровья и брони карт...",
    });
    
    const cardHealthUpdates = collectCardHealthUpdates();
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: если нет card_instances для сохранения, 
    // все равно продолжаем claim наград (ELL, предметы, опыт)
    // но предупреждаем о проблеме с картами
    if (cardHealthUpdates.length === 0) {
      console.warn('⚠️ Нет card_instances для обновления здоровья. Это означает, что карты команды не синхронизированы с БД.');
      console.warn('⚠️ Продолжаем claim наград, но здоровье/броня карт не будут сохранены.');
      
      toast({
        title: "⚠️ Внимание",
        description: "Карты команды не синхронизированы с БД. Здоровье не будет сохранено, но награды будут начислены.",
        variant: "default"
      });
    } else {
      toast({
        title: "📤 Отправка данных",
        description: `Сохраняем ${cardHealthUpdates.length} из ${battleState.playerPairs.length * 2} карт...`,
      });
    }
    
    // Продолжаем claim даже если cardHealthUpdates пустой - награды все равно нужно начислить
    try {
      const result = await claimRewardAndExit(
        getCurrentClaimKey(), 
        cardHealthUpdates, 
        dungeonType, 
        battleState.level,
        monstersKilled // Передаем список убитых монстров для server-side расчета
      );
      
      console.log('🎁 ========== РЕЗУЛЬТАТ claimRewardAndExit ==========');
      console.log('🎁 Тип результата:', typeof result);
      console.log('🎁 Полный объект результата:', JSON.stringify(result, null, 2));
      console.log('🎁 result.success:', result && typeof result === 'object' ? result.success : 'N/A');
      console.log('🎁 result.rewards:', result && typeof result === 'object' && 'rewards' in result ? result.rewards : 'N/A');
      console.log('🎁 ===================================================');
      
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        console.log('✅ Результат успешный, проверяем наличие rewards...');
        // Показываем модалку с результатами наград всегда, если есть объект rewards
        if ('rewards' in result && result.rewards) {
          console.log('🎉 НАЙДЕНЫ НАГРАДЫ! Показываем модалку с наградами:', result.rewards);
          console.log('🔒 КРИТИЧНО: Сбрасываем флаг isClaiming и открываем модалку');
          
          // ✅ РЕШЕНИЕ: Сбрасываем state флаг - это вызовет ре-рендер и уберет "Обработка..."
          setIsClaiming(false);
          console.log('✅ isClaiming сброшен в false');
          
          // Открываем финальную модалку с наградами
          setClaimResultModal({
            isOpen: true,
            rewards: result.rewards
          });
          console.log('✅ ClaimResultModal установлена с isOpen: true');
        } else {
          console.warn('⚠️ Нет объекта rewards в результате, выходим без модалки');
          console.warn('⚠️ result:', result);
          setIsClaiming(false);
          handleExitAndReset();
        }
      } else {
        console.error('❌ Ошибка при начислении наград или некорректный результат');
        console.error('❌ result:', result);
        console.error('❌ Условия проверки:');
        console.error('   - result существует:', !!result);
        console.error('   - result это объект:', typeof result === 'object');
        console.error('   - result.success существует:', result && typeof result === 'object' && 'success' in result);
        console.error('   - result.success === true:', result && typeof result === 'object' && 'success' in result ? result.success : false);
        
        setIsClaiming(false);
        toast({
          title: "❌ Ошибка",
          description: "Не удалось сохранить состояние карт",
          variant: "destructive"
        });
        handleExitAndReset();
      }
    } catch (error) {
      console.error('❌ Критическая ошибка handleClaimAndExit:', error);
      setIsClaiming(false);
      toast({
        title: "❌ Критическая ошибка",
        description: "Произошла ошибка при обработке наград",
        variant: "destructive"
      });
      handleExitAndReset();
    } finally {
      // ✅ Очищаем таймаут (флаг уже сброшен выше)
      clearTimeout(safetyTimeout);
    }
  };

  // Функция для сдачи - сохраняет здоровье карт БЕЗ наград
  const handleSurrenderWithSave = useCallback(async () => {
    toast({
      title: "🏳️ Сдача",
      description: "Сохраняем текущее состояние карт...",
    });
    
    const cardHealthUpdates = collectCardHealthUpdates();
    
    if (cardHealthUpdates.length === 0) {
      console.warn('⚠️ Нет card_instances для обновления здоровья при сдаче.');
      toast({
        title: "⚠️ Внимание",
        description: "Не удалось найти карты для сохранения состояния.",
        variant: "default"
      });
      // Все равно выходим (monstersKilled сбросится в handleExitAndReset)
      handleExitAndReset();
      return;
    }
    
    // Вызываем claimRewardAndExit с флагом skip rewards (передаем null для claim_key)
    // Это сохранит только здоровье карт, без начисления наград
    const result = await claimRewardAndExit(null, cardHealthUpdates, dungeonType, battleState.level, []);
    
    if (result && result.success) {
      toast({
        title: "✅ Состояние сохранено",
        description: "Здоровье и броня карт сохранены при сдаче.",
      });
    } else {
      toast({
        title: "⚠️ Ошибка сохранения",
        description: "Не удалось сохранить состояние карт, но выход выполнен.",
        variant: "destructive"
      });
    }
    
    // monstersKilled сбросится в handleExitAndReset
    handleExitAndReset();
  }, [collectCardHealthUpdates, claimRewardAndExit, dungeonType, battleState.level, handleExitAndReset]);

  const handleContinue = () => {
    continueWithRisk(); // Сохраняет накопленные награды в accumulatedReward
    handleNextLevel(); // Очистит monstersKilled и перейдет на следующий уровень
  };

  // ✅ Keep-alive: обновляем last_activity через Edge Function, чтобы сессия не считалась «просроченной»
  useEffect(() => {
    const isActiveLocal = battleStarted && useGameStore.getState().activeBattleInProgress;
    if (!accountId || !deviceId || !isActiveLocal) return;

    // Сразу «пингуем» сессию при возврате на страницу
    updateDungeonLevel(battleState.level).catch(() => {});

    // Далее — раз в минуту, чтобы last_activity всегда был свежим
    const interval = window.setInterval(() => {
      const stillActiveLocal = battleStarted && useGameStore.getState().activeBattleInProgress;
      if (!stillActiveLocal) return;
      updateDungeonLevel(battleState.level).catch(() => {});
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [accountId, deviceId, battleStarted, battleState.level, updateDungeonLevel]);

  // Мониторинг активной сессии: показываем «сессия потеряна» только если запись удалена (realtime DELETE)
  // Важно: прямой SELECT по active_dungeon_sessions может возвращать пусто из-за RLS и даёт ложные срабатывания.
  useEffect(() => {
    const isActiveLocal = battleStarted && useGameStore.getState().activeBattleInProgress;
    if (!accountId || !isActiveLocal) return;

    const channel = supabase
      .channel(`battle_session_monitor:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_dungeon_sessions',
          filter: `account_id=eq.${accountId}`
        },
        () => {
          const stillActiveLocal = battleStarted && useGameStore.getState().activeBattleInProgress;
          if (stillActiveLocal) {
            console.log('Session deleted remotely');
            setSessionTerminated(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, battleStarted]);

  // Автоматически активируем бой при загрузке, если есть активное подземелье
  useEffect(() => {
    const isActiveBattle = useGameStore.getState().activeBattleInProgress;
    const hasTeamBattleState = useGameStore.getState().battleState;
    
    if (isActiveBattle && hasTeamBattleState && !battleStarted) {
      console.log('🔄 Автовозобновление активного боя');
      setBattleStarted(true);
    }
  }, [battleStarted]);

  // Отслеживаем убийства монстров по уменьшению здоровья конкретных противников
  useEffect(() => {
    if (!battleStarted) {
      // Инициализация при старте боя
      prevOpponentsRef.current = aliveOpponents.map(opp => ({
        id: opp.id,
        name: opp.name,
        health: opp.health
      }));
      prevAliveOpponentsRef.current = aliveOpponents.length;
      processedLevelRef.current = null; // Сброс при старте нового боя
      return;
    }

    const prevOpponents = prevOpponentsRef.current;
    const currentOpponents = aliveOpponents.map(opp => ({
      id: opp.id,
      name: opp.name,
      health: opp.health
    }));

    // Ищем монстров, которые были убиты (исчезли из списка живых)
    const killedMonsters = prevOpponents.filter(prevOpp => 
      prevOpp.health > 0 && // Был жив раньше
      !currentOpponents.find(currOpp => currOpp.id === prevOpp.id && currOpp.health > 0) // Теперь мертв или отсутствует
    );

    if (killedMonsters.length > 0) {
      const newKills = killedMonsters.map(monster => ({
        level: battleState.level,
        dungeonType,
        name: monster.name
      }));
      
      console.log('🎯 KILL DEBUG: New kills data:', JSON.stringify(newKills, null, 2));
      setMonstersKilled(prev => [...prev, ...newKills]);
      console.log(`💀 Убито монстров: ${killedMonsters.map(m => m.name).join(', ')} на уровне ${battleState.level}`);
    }

    // Обновляем предыдущее состояние
    prevOpponentsRef.current = currentOpponents;
    prevAliveOpponentsRef.current = aliveOpponents.length;
  }, [aliveOpponents, battleState.level, dungeonType, battleStarted]);

  // Синхронизируем ref с актуальными убийствами (без localStorage)
  useEffect(() => {
    monstersKilledRef.current = monstersKilled;
  }, [monstersKilled]);

  // Check if battle is over
  const isBattleOver = alivePairs.length === 0 || aliveOpponents.length === 0;
  
  // Обработка завершения боя
  useEffect(() => {
    if (!battleStarted) return;
    if (!isBattleOver) return;

    const isVictory = alivePairs.length > 0;
    const isFullCompletion = isVictory && battleState.level >= 100;

    // Предотвращаем повторную обработку одного и того же уровня
    if (processedLevelRef.current === battleState.level) {
      console.log(`⚠️ Уровень ${battleState.level} уже обработан, пропускаем`);
      return;
    }

    // Фикс гонки: ждём, пока эффект подсчёта убийств обновит state
    processedLevelRef.current = battleState.level;

    // Победа/поражение — даём времени анимациям
    if (!isVictory) {
      const kills = monstersKilledRef.current;
      console.log('💀 ПОРАЖЕНИЕ - очистка состояния боя');
      // Флаги управляются через Zustand, не localStorage
      useGameStore.getState().setActiveBattleInProgress(false);
      processDungeonCompletion(kills, battleState.level, isFullCompletion, true); // isDefeat = true
    } else {
      // Задержка 1.8с, чтобы успели проиграться бросок кубика, полет оружия и смерть монстра
      setShowingFinishDelay(true);
      const delayMs = adjustDelay(1800);
      setTimeout(() => {
        const kills = monstersKilledRef.current;
        console.log('✅ ПОБЕДА - обработка наград (после задержки)', { delayMs, level: battleState.level, kills: kills.length });
        processDungeonCompletion(kills, battleState.level, isFullCompletion, false);
        setShowingFinishDelay(false);
      }, delayMs);
    }
  }, [isBattleOver, battleStarted, alivePairs.length, battleState.level, processDungeonCompletion]);
  
  if (isBattleOver && battleStarted && !showingFinishDelay) {
    console.log('🎬 [RENDER] isBattleOver detected:', {
      isBattleOver,
      battleStarted,
      showingFinishDelay,
      pendingReward: !!pendingReward,
      isClaiming,
      claimResultModalOpen: claimResultModal.isOpen,
      alivePairs: alivePairs.length
    });
    
    // Если модальное окно еще не готово
    if (!pendingReward && !isClaiming && !claimResultModal.isOpen) {
      console.log('🔍 [RENDER] Нет pending reward и не идет claiming');
      // При полном поражении награды нет — показываем экран поражения с выходом
      if (alivePairs.length === 0) {
        console.log('💀 [RENDER] Показываем экран полного поражения');
        return (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]">
            <Card variant="menu" className="p-6 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-white text-center">{t(language, 'battlePage.teamDefeated')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-white/80">{t(language, 'battlePage.noReward')}</p>
                <Button variant="menu" onClick={handleClaimAndExit}>{t(language, 'battlePage.exit')}</Button>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Иначе краткая заглушка на обработку (например, при победе)
      return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]">
          <Card variant="menu" className="p-6 max-w-md w-full">
            <CardContent className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-white/80">{t(language, 'battlePage.processingResults')}</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Если идет процесс обработки наград, показываем индикатор
    if (isClaiming && !claimResultModal.isOpen) {
      console.log('⏳ [RENDER] Показываем "Обработка результатов боя..." (isClaiming=true, claimResultModal.isOpen=false)');
      return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]">
          <Card variant="menu" className="p-6 max-w-md w-full">
            <CardContent className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-white/80">{t(language, 'battlePage.processingResults')}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Показываем только модальное окно с наградой, убираем промежуточный экран победы/поражения
    console.log('🎁 [RENDER] Проверка модальных окон:', {
      pendingRewardExists: !!pendingReward,
      isClaiming,
      claimResultModalOpen: claimResultModal.isOpen
    });
    
    return (
      <>
        <DungeonRewardModal
          isOpen={!!pendingReward && !isClaiming && !claimResultModal.isOpen}
          onClose={handleClaimAndExit}
          onContinue={handleContinue}
          reward={accumulatedReward ?? pendingReward}
          canContinue={alivePairs.length > 0 && battleState.level < 100}
          currentLevel={battleState.level}
          teamPairs={battleState.playerPairs}
        />
        
        <ClaimRewardsResultModal
          isOpen={claimResultModal.isOpen}
          onClose={() => {
            console.log('🚪 [RENDER] Закрываем ClaimRewardsResultModal');
            
            // КРИТИЧНО: Сбрасываем все флаги перед закрытием
            setIsClaiming(false); // Убираем экран "Обработка результатов боя..."
            resetRewards(); // Сбрасываем pendingReward
            setClaimResultModal({ isOpen: false, rewards: null });
            
            handleExitAndReset();
          }}
          rewards={claimResultModal.rewards || { ell_reward: 0, experience_reward: 0, items: [] }}
        />
      </>
    );
  }

  // Функция восстановления сессии при сетевом сбое
  const handleRestoreSession = async () => {
    // ✅ ИСПРАВЛЕНО: startDungeonSession уже обновляет запись в БД через Edge Function
    // Убран клиентский upsert, который блокировался RLS
    const restored = await startDungeonSession(dungeonType, battleState.level);
    if (restored) {
      console.log('✅ Сессия восстановлена, продолжаем бой на уровне', battleState.level);
      setSessionTerminated(false);
      // ✅ Запоминаем время создания сессии для проверки
      sessionCreatedAtRef.current = Date.now();
    } else {
      toast({
        title: t(language, 'battlePage.restoreFailed'),
        description: t(language, 'battlePage.anotherDeviceActive'),
        variant: "destructive"
      });
    }
  };

  // Блокирующее окно при удалении сессии на другом устройстве
  if (sessionTerminated) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[200]">
        <Card variant="menu" className="p-6 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">{t(language, 'battlePage.dungeonFinished')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/80">
              {t(language, 'battlePage.sessionLost')}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="menu" onClick={handleRestoreSession}>
                {t(language, 'battlePage.restoreBattle')}
              </Button>
              <Button variant="outline" onClick={handleExitAndReset}>
                {t(language, 'battlePage.exit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!battleStarted) {
    return <>
        <div className="fixed top-4 left-4 z-10">
          <Button onClick={handleBackToMenu} variant="ghost" size="sm" className="bg-card/50 backdrop-blur-sm border border-border/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t(language, 'battlePage.back')}
          </Button>
        </div>
        
        <AttackOrderSelector playerPairs={battleState.playerPairs} attackOrder={attackOrder} onOrderChange={updateAttackOrder} onStartBattle={handleStartBattle} />
        
        {/* Диалог предупреждения об активной сессии */}
        <ActiveDungeonWarning
          open={activeSessionWarning.isOpen}
          onContinue={() => setActiveSessionWarning({ isOpen: false, sessions: [] })}
          onEndAndRestart={handleResetActiveSession}
          onCancel={() => setActiveSessionWarning({ isOpen: false, sessions: [] })}
          activeSessions={activeSessionWarning.sessions}
        />
      </>;
  }
  return <>
      <div className="fixed top-4 left-4 z-10">
        
      </div>
      
      <TeamBattleArena 
        playerPairs={battleState.playerPairs} 
        opponents={battleState.opponents} 
        attackOrder={attackOrder} 
        isPlayerTurn={isPlayerTurn} 
        onAttack={executePlayerAttack} 
        onAbilityUse={executeAbilityUse} 
        onEnemyAttack={executeEnemyAttack} 
        level={battleState.level} 
        lastRoll={lastRoll}
        onSurrenderWithSave={handleSurrenderWithSave}
        onMenuReturn={handleArenaMenuReturn}
        dungeonType={dungeonType}
        monstersKilledRef={monstersKilledRef}
      />
      
      {/* Модалка с результатами наград после клейма */}
      {claimResultModal.isOpen && claimResultModal.rewards && (
        <ClaimRewardsResultModal
          isOpen={claimResultModal.isOpen}
          onClose={() => {
            setClaimResultModal({ isOpen: false, rewards: null });
            handleExitAndReset();
          }}
          rewards={claimResultModal.rewards}
        />
      )}
      
    </>;

};

export const TeamBattlePage: React.FC<TeamBattlePageProps> = (props) => {
  return (
    <BattleSpeedProvider>
      <TeamBattlePageInner {...props} />
    </BattleSpeedProvider>
  );
};