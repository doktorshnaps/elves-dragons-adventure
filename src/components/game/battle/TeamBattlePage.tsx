import React, { useState, startTransition, useEffect } from 'react';
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
import { preloadItemTemplates } from '@/utils/monsterLootMapping';
interface TeamBattlePageProps {
  dungeonType: DungeonType;
}
export const TeamBattlePage: React.FC<TeamBattlePageProps> = ({
  dungeonType
}) => {
  const navigate = useNavigate();
  const [battleStarted, setBattleStarted] = useState<boolean>(false);
  const [monstersKilled, setMonstersKilled] = useState<Array<{level: number, dungeonType: string, name?: string}>>([]);
  const prevAliveOpponentsRef = React.useRef<number>(0);
  const prevOpponentsRef = React.useRef<Array<{id: number, name: string, health: number}>>([]);
  const processedLevelRef = React.useRef<number | null>(null);
  
  // Sync health from database on component mount
  useCardHealthSync();
  
  // Preload item templates for loot generation
  useEffect(() => {
    preloadItemTemplates();
  }, []);
  
  const { 
    pendingReward, 
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
  const handleStartBattle = () => {
    startTransition(() => {
      localStorage.setItem('activeBattleInProgress', 'true');
      setBattleStarted(true);
    });
  };
  const handleExitAndReset = () => {
    startTransition(() => {
      localStorage.removeItem('activeBattleInProgress');
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
      localStorage.removeItem('activeBattleInProgress');
      setBattleStarted(false);
    });
  };

  const handleClaimAndExit = async () => {
    const success = await claimRewardAndExit();
    if (success) {
      handleExitAndReset();
    }
  };

  const handleContinue = () => {
    continueWithRisk();
    setMonstersKilled([]); // Сбрасываем только для UI, накопленные награды остаются
    handleNextLevel();
  };

  // Автоматически активируем бой при загрузке, если есть активное подземелье
  useEffect(() => {
    const isActiveBattle = localStorage.getItem('activeBattleInProgress') === 'true';
    const hasTeamBattleState = localStorage.getItem('teamBattleState');
    
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

  // Check if battle is over
  const isBattleOver = alivePairs.length === 0 || aliveOpponents.length === 0;
  
  // Обработка завершения боя
  useEffect(() => {
    if (!battleStarted) return;
    if (!isBattleOver) return;

    // Не обрабатываем, если никого не убили (предотвращает повторное модальное окно при инициализации нового уровня)
    if (monstersKilled.length === 0) return;

    // Предотвращаем повторную обработку одного и того же уровня
    if (processedLevelRef.current === battleState.level) return;
    processedLevelRef.current = battleState.level;

    const isVictory = alivePairs.length > 0;
    const isFullCompletion = isVictory && battleState.level >= 10;
    
    console.log(`🏁 Бой завершен. Победа: ${isVictory}, Уровень: ${battleState.level}, Убито монстров: ${monstersKilled.length}`);
    console.log('🎯 BATTLE END DEBUG: Monsters killed data:', JSON.stringify(monstersKilled, null, 2));
    
    if (!isVictory) {
      localStorage.removeItem('teamBattleState');
      localStorage.removeItem('activeBattleInProgress');
      localStorage.removeItem('battleState'); // legacy
      processDungeonCompletion(monstersKilled, battleState.level, isFullCompletion, true); // isDefeat = true
    } else {
      processDungeonCompletion(monstersKilled, battleState.level, isFullCompletion, false);
    }
  }, [isBattleOver, battleStarted, monstersKilled.length, alivePairs.length, battleState.level, processDungeonCompletion]);
  
  if (isBattleOver && battleStarted) {
    // Показываем только модальное окно с наградой, убираем промежуточный экран победы/поражения
    return <>
        {pendingReward && (
          <DungeonRewardModal
            isOpen={!!pendingReward}
            onClose={handleClaimAndExit}
            onContinue={handleContinue}
            reward={pendingReward}
            canContinue={alivePairs.length > 0 && battleState.level < 10}
          />
        )}
      </>;
  }
  if (!battleStarted) {
    return <>
        <div className="fixed top-4 left-4 z-10">
          <Button onClick={handleBackToMenu} variant="ghost" size="sm" className="bg-card/50 backdrop-blur-sm border border-border/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
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