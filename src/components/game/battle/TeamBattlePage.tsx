import React, { useState, startTransition, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useTeamBattle } from '@/hooks/team/useTeamBattle';
import { useCardHealthSync } from '@/hooks/useCardHealthSync';
import { AttackOrderSelector } from './AttackOrderSelector';
import { TeamBattleArena } from './TeamBattleArena';
import { DungeonType } from '@/constants/dungeons';
import { DungeonRewardModal } from '@/components/game/modals/DungeonRewardModal';
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
  const [battleStarted, setBattleStarted] = useState<boolean>(false);
  const [monstersKilled, setMonstersKilled] = useState<Array<{level: number, dungeonType: string, name?: string}>>([]);
  const monstersKilledRef = useRef<Array<{level: number, dungeonType: string, name?: string}>>([]);
  const prevAliveOpponentsRef = React.useRef<number>(0);
  const prevOpponentsRef = React.useRef<Array<{id: number, name: string, health: number}>>([]);
  const processedLevelRef = React.useRef<number | null>(null);
  
  const { accountId } = useWalletContext();
  const { deviceId, startDungeonSession, endDungeonSession } = useDungeonSync();
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [showingFinishDelay, setShowingFinishDelay] = useState(false);
  
  // Sync health from database ONLY when NOT in battle (prevents DB spam)
  useCardHealthSync(true); // true = skip during battle
  
  // Инициализация кеша item templates и treasure hunt из StaticGameData (ТОЛЬКО ОДИН РАЗ при монтировании)
  const { templates: itemTemplatesMap } = useItemTemplates();
  const itemTemplatesInitialized = useRef(false);
  
  useEffect(() => {
    // Выполняем только один раз при монтировании компонента
    if (itemTemplatesInitialized.current) return;
    
    if (itemTemplatesMap.size > 0) {
      const templatesArray = Array.from(itemTemplatesMap.values());
      setItemTemplatesCache(templatesArray);
      
      // Загружаем treasure hunt событие ОДИН РАЗ при инициализации
      loadActiveTreasureHunt().then(() => {
        console.log('✅ Item templates and treasure hunt cache initialized');
      });
      
      itemTemplatesInitialized.current = true;
    }
  }, []); // Пустой массив зависимостей - только при монтировании
  
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
  } = useTeamBattle(dungeonType);
  const { cardInstances } = useCardInstances();
  const handleStartBattle = async () => {
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
    } else {
      console.log('⚡ Продолжение боя на уровне', battleState.level, '- энергия не списывается');
    }
    
    startTransition(() => {
      useGameStore.getState().setActiveBattleInProgress(true);
      setBattleStarted(true);
    });
  };
  const handleExitAndReset = async () => {
    // Завершаем сессию подземелья в БД
    await endDungeonSession();
    
    // КРИТИЧНО: Инвалидируем и перезагружаем gameData ДО навигации
    // чтобы selectedTeam был актуальным на странице /dungeons
    await queryClient.invalidateQueries({ queryKey: ['gameData', accountId] });
    await queryClient.refetchQueries({ queryKey: ['gameData', accountId] });
    
    startTransition(() => {
      useGameStore.getState().setActiveBattleInProgress(false);
      resetBattle();
      resetRewards();
      navigate('/dungeons');
    });
  };
  const handleBackToMenu = () => {
    startTransition(() => {
      // Preserve current battle progress and team; just navigate back
      navigate('/dungeons');
    });
  };
  const handleNextLevel = () => {
    startTransition(() => {
      handleLevelComplete();
      setMonstersKilled([]); // Сбрасываем список убитых монстров для нового уровня
      // battleStarted остается true - бой продолжается на следующем уровне
    });
  };

  const handleClaimAndExit = async () => {
    console.log('🚨 [handleClaimAndExit] ФУНКЦИЯ ВЫЗВАНА!');
    console.log('🚨 battleState.playerPairs:', battleState.playerPairs);
    console.log('🚨 cardInstances:', cardInstances);
    console.log('🚨 cardInstances.length:', cardInstances?.length);
    
    // Собираем текущее здоровье и броню карт из battleState.playerPairs
    const cardHealthUpdates = battleState.playerPairs.flatMap(pair => {
      const updates = [];
      
      // Героя всегда добавляем
      if (pair.hero) {
        const heroInstance = cardInstances.find(ci => ci.card_template_id === pair.hero.id);
        if (heroInstance) {
          console.log('💔 [HERO] Данные для сохранения:', {
            name: pair.hero.name,
            template_id: pair.hero.id,
            instance_id: heroInstance.id,
            current_health_from_pair: pair.hero.currentHealth,
            fallback_health: pair.hero.health,
            current_defense_from_pair: pair.hero.currentDefense,
            fallback_defense: pair.hero.defense
          });
          
          updates.push({
            card_instance_id: heroInstance.id, // Используем уникальный ID карты
            current_health: pair.hero.currentHealth ?? pair.hero.health,
            current_defense: pair.hero.currentDefense ?? pair.hero.defense // ИСПРАВЛЕНО: берем индивидуальную броню героя
          });
        }
      }
      
      // Дракона добавляем если есть
      if (pair.dragon) {
        const dragonInstance = cardInstances.find(ci => ci.card_template_id === pair.dragon.id);
        if (dragonInstance) {
          console.log('💔 [DRAGON] Данные для сохранения:', {
            name: pair.dragon.name,
            template_id: pair.dragon.id,
            instance_id: dragonInstance.id,
            current_health_from_pair: pair.dragon.currentHealth,
            fallback_health: pair.dragon.health,
            current_defense_from_pair: pair.dragon.currentDefense,
            fallback_defense: pair.dragon.defense
          });
          
          updates.push({
            card_instance_id: dragonInstance.id, // Используем уникальный ID карты
            current_health: pair.dragon.currentHealth ?? pair.dragon.health,
            current_defense: pair.dragon.currentDefense ?? pair.dragon.defense // ИСПРАВЛЕНО: добавлен fallback
          });
        }
      }
      
      return updates;
    });
    
    console.log('💔 [TeamBattlePage] Собраны повреждения карт для сохранения:', cardHealthUpdates);
    
    const success = await claimRewardAndExit(cardHealthUpdates);
    if (success) {
      handleExitAndReset();
    }
  };

  const handleContinue = () => {
    continueWithRisk(); // Сохраняет накопленные награды в accumulatedReward
    handleNextLevel(); // Очистит monstersKilled и перейдет на следующий уровень
  };

  // Мониторинг активной сессии в БД: если удалена на другом устройстве — блокируем
  useEffect(() => {
    // Следим ТОЛЬКО когда бой активен на этом устройстве
    const isActiveLocal = battleStarted || useGameStore.getState().activeBattleInProgress;
    if (!accountId || !deviceId || !isActiveLocal) return;

    const checkSession = async () => {
      try {
        const now = Date.now();
        const TIMEOUT = 300000; // 5 минут - даем запас для троттлинга heartbeat в фоновых вкладках
        const { data, error } = await supabase
          .from('active_dungeon_sessions')
          .select('device_id')
          .eq('account_id', accountId)
          .eq('device_id', deviceId)
          .gte('last_activity', now - TIMEOUT)
          .limit(1);

        if (error) throw error;
        // Если записи нет — считаем, что сессию завершили удаленно (только если локально бой активен)
        const stillActiveLocal = battleStarted || useGameStore.getState().activeBattleInProgress;
        if ((!data || data.length === 0) && stillActiveLocal) {
          setSessionTerminated(true);
        }
      } catch (e) {
        console.error('Session check error:', e);
      }
    };

    // Проверяем сразу
    checkSession();

    // Подписываемся на изменения в БД (Real-time подписка более эффективна чем polling)
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
          const stillActiveLocal = battleStarted || localStorage.getItem('activeBattleInProgress') === 'true';
          if (stillActiveLocal) {
            console.log('Session deleted remotely, blocking battle');
            setSessionTerminated(true);
          }
        }
      )
      .subscribe();

    // Убираем периодическую проверку - полагаемся только на Real-time подписку
    // Это снижает нагрузку с 16 запросов select:active_dungeon_sessions до 0

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, deviceId, battleStarted]);

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

  // Синхронизируем ref с актуальными убийствами, чтобы избежать гонок состояний
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
      localStorage.removeItem('teamBattleState');
      localStorage.removeItem('activeBattleInProgress');
      localStorage.removeItem('battleState'); // legacy
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
    // Если модальное окно еще не готово
    if (!pendingReward) {
      // При полном поражении награды нет — показываем экран поражения с выходом
      if (alivePairs.length === 0) {
        return (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]">
            <Card variant="menu" className="p-6 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-white text-center">{t(language, 'battlePage.teamDefeated')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-white/80">{t(language, 'battlePage.noReward')}</p>
                <Button variant="menu" onClick={handleExitAndReset}>{t(language, 'battlePage.exit')}</Button>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Иначе краткая заглушка на обработку (например, при победе)
      return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]">
          <Card variant="menu" className="p-6 max-w-md w-full">
            <CardContent className="text-center">
              <p className="text-white/80">{t(language, 'battlePage.processingResults')}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Показываем только модальное окно с наградой, убираем промежуточный экран победы/поражения
    return (
      <DungeonRewardModal
        isOpen={!!pendingReward}
        onClose={handleClaimAndExit}
        onContinue={handleContinue}
        reward={accumulatedReward ?? pendingReward}
        canContinue={alivePairs.length > 0 && battleState.level < 100}
      />
    );
  }

  // Функция восстановления сессии при сетевом сбое
  const handleRestoreSession = async () => {
    const restored = await startDungeonSession(dungeonType, battleState.level);
    if (restored) {
      console.log('✅ Сессия восстановлена, продолжаем бой');
      setSessionTerminated(false);
      // Отправляем heartbeat сразу
      await supabase
        .from('active_dungeon_sessions')
        .upsert({
          account_id: accountId,
          device_id: deviceId,
          dungeon_type: dungeonType,
          level: battleState.level,
          started_at: Date.now(),
          last_activity: Date.now()
        }, {
          onConflict: 'account_id,device_id'
        });
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
      </>;
  }
  return <>
      <div className="fixed top-4 left-4 z-10">
        
      </div>
      
      <TeamBattleArena playerPairs={battleState.playerPairs} opponents={battleState.opponents} attackOrder={attackOrder} isPlayerTurn={isPlayerTurn} onAttack={executePlayerAttack} onAbilityUse={executeAbilityUse} onEnemyAttack={executeEnemyAttack} level={battleState.level} lastRoll={lastRoll} />
      
    </>;
};

export const TeamBattlePage: React.FC<TeamBattlePageProps> = (props) => {
  return (
    <BattleSpeedProvider>
      <TeamBattlePageInner {...props} />
    </BattleSpeedProvider>
  );
};