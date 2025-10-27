import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sword, Shield, Heart, ArrowLeft, Zap } from 'lucide-react';
import { TeamPair } from '@/types/teamBattle';
import { Opponent } from '@/types/battle';
import { useGameStore } from '@/stores/gameStore';
import { getXPProgress } from '@/utils/accountLeveling';
import { useNavigate } from 'react-router-dom';
import { TeamHealthBars } from './TeamHealthBars';
import { InlineDiceDisplay } from './InlineDiceDisplay';
import { AttackAnimation } from './AttackAnimation';
import { useDungeonSync } from '@/hooks/useDungeonSync';
interface TeamBattleArenaProps {
  playerPairs: TeamPair[];
  opponents: Opponent[];
  attackOrder: string[];
  isPlayerTurn: boolean;
  onAttack: (pairId: string, targetId: number) => void;
  onAbilityUse?: (pairId: string, abilityId: string, targetId: number | string) => void;
  onEnemyAttack: () => void;
  level: number;
  lastRoll?: { attackerRoll: number; defenderRoll: number; source: 'player' | 'enemy'; damage: number; isBlocked: boolean; isCritical?: boolean; level: number } | null;
}
export const TeamBattleArena: React.FC<TeamBattleArenaProps> = ({
  playerPairs,
  opponents,
  attackOrder,
  isPlayerTurn,
  onAttack,
  onAbilityUse,
  onEnemyAttack,
  level,
  lastRoll
}) => {
  const navigate = useNavigate();
  const { endDungeonSession } = useDungeonSync();
  const {
    accountLevel,
    accountExperience
  } = useGameStore();
  const [selectedPair, setSelectedPair] = React.useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = React.useState<number | string | null>(null);
  const [attackingPair, setAttackingPair] = React.useState<string | null>(null);
  const [attackedTarget, setAttackedTarget] = React.useState<number | null>(null);
  const [defendingPair, setDefendingPair] = React.useState<string | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  
  // Dice roll state - теперь берем из реальных бросков
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(true);
  const [diceKey, setDiceKey] = useState(0);
  
  // Attack animation state
  const [attackAnimation, setAttackAnimation] = useState<{
    isActive: boolean;
    type: 'normal' | 'critical' | 'blocked';
    source: 'player' | 'enemy';
    damage?: number;
  }>({
    isActive: false,
    type: 'normal',
    source: 'player',
    damage: 0
  });

  // Refs для получения позиций кубиков
  const playerDiceRef = React.useRef<HTMLDivElement>(null);
  const enemyDiceRef = React.useRef<HTMLDivElement>(null);

  // Функция для получения центра элемента относительно его родителя
  const getDicePosition = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return { x: 0, y: 0 };
    const rect = ref.current.getBoundingClientRect();
    const parentRect = ref.current.offsetParent?.getBoundingClientRect();
    if (!parentRect) return { x: 0, y: 0 };
    return {
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top + rect.height / 2
    };
  };
  const alivePairs = playerPairs.filter(pair => pair.health > 0);
  const aliveOpponents = opponents.filter(opp => opp.health > 0);
  const handleAttack = () => {
    if (selectedPair && selectedTarget !== null && typeof selectedTarget === 'number') {
      const pairId = selectedPair;
      const targetId = selectedTarget;
      
      // Show dice roll animation - Player attacking
      setIsPlayerAttacking(true);
      setIsDiceRolling(true);
      setDiceKey(prev => prev + 1);
      
      // Запускаем анимацию атаки
      setAttackingPair(pairId);
      setAttackedTarget(targetId);

      // Останавливаем вращение кубиков через 1500мс (показываем результат)
      setTimeout(() => {
        setIsDiceRolling(false);
        
        // Сразу после остановки кубиков выполняем атаку (наносим урон)
        onAttack(pairId, targetId);
      }, 1500);

      // Убираем эффекты анимации через 4000мс (после полного цикла анимации)
      setTimeout(() => {
        setSelectedPair(null);
        setSelectedTarget(null);
        setAttackingPair(null);
        setAttackedTarget(null);
      }, 4000);
    }
  };
  const handleEnemyAttack = useCallback(() => {
    console.log('🎯 handleEnemyAttack called, alivePairs:', alivePairs.length);
    // Случайно выбираем живую пару для защиты
    const randomPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
    
    if (randomPair) {
      // Enemy turn dice animation
      setIsPlayerAttacking(false);
      setDefendingPair(randomPair.id);
      setIsDiceRolling(true);
      setDiceKey(prev => prev + 1);
      console.log('🎲 Enemy dice: start rolling');

      // Останавливаем вращение кубиков через 1500мс (показываем результат)
      setTimeout(() => {
        setIsDiceRolling(false);
        console.log('🎲 Enemy dice: stop rolling');
        
        // Сразу после остановки кубиков выполняем атаку (наносим урон)
        console.log('⚔️ Calling onEnemyAttack');
        onEnemyAttack();
      }, 1500);

      // Убираем защитника через 4000мс (после полного цикла анимации)
      setTimeout(() => {
        setDefendingPair(null);
      }, 4000);
    } else {
      console.log('⚔️ No pair to defend, calling onEnemyAttack directly');
      onEnemyAttack();
    }
  }, [alivePairs, onEnemyAttack]);
  const getCurrentAttacker = () => {
    const orderedPairs = [...alivePairs].sort((a, b) => a.attackOrder - b.attackOrder);
    return orderedPairs[0];
  };
  const currentAttacker = getCurrentAttacker();

  // Получаем прогресс опыта для отображения
  const xpProgress = getXPProgress(accountExperience);

  // Сбрасываем все состояния анимаций при смене уровня
  useEffect(() => {
    setAttackAnimation({ isActive: false, type: 'normal', source: 'player', damage: 0 });
    setIsDiceRolling(false);
    setAttackingPair(null);
    setAttackedTarget(null);
    setDefendingPair(null);
    setSelectedPair(null);
    setSelectedTarget(null);
    setIsAttacking(false);
  }, [level]);

  // Запускаем анимацию атаки когда кубики перестают вращаться
  useEffect(() => {
    // Проверяем что lastRoll существует, кубики не вращаются и уровень совпадает
    if (lastRoll && !isDiceRolling && lastRoll.level === level) {
      // Небольшая задержка перед запуском анимации, чтобы кубики остановились
      const startTimer = setTimeout(() => {
        const animationType = lastRoll.isBlocked 
          ? 'blocked' 
          : lastRoll.isCritical 
            ? 'critical' 
            : 'normal';
        
        setAttackAnimation({
          isActive: true,
          type: animationType,
          source: lastRoll.source,
          damage: lastRoll.damage
        });

        // Останавливаем анимацию через 2000мс (длительность всей анимации)
        const stopTimer = setTimeout(() => {
          setAttackAnimation({ isActive: false, type: 'normal', source: 'player', damage: 0 });
        }, 2000);

        return () => clearTimeout(stopTimer);
      }, 100);

      return () => clearTimeout(startTimer);
    }
  }, [lastRoll, isDiceRolling, level]);

  // Автоматический ход противника
  useEffect(() => {
    const isActive = useGameStore.getState().activeBattleInProgress;
    if (!isActive) return;
    if (!isPlayerTurn && aliveOpponents.length > 0 && alivePairs.length > 0) {
      console.log('🎯 Enemy turn triggered - scheduling attack');
      const timer = setTimeout(() => {
        console.log('⚔️ Executing enemy attack');
        handleEnemyAttack();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, aliveOpponents.length, alivePairs.length, handleEnemyAttack]);
  const handleMenuReturn = () => {
    // Mark that we're in an active battle for auto-resume
    localStorage.setItem('activeBattleInProgress', 'true');
    navigate('/menu');
  };
  const handleSurrender = async () => {
    // Завершаем сессию в БД
    await endDungeonSession();
    
    // Сброс состояния подземелья
    localStorage.removeItem('battleState');
    localStorage.removeItem('teamBattleState');
    localStorage.removeItem('activeBattleInProgress');
    navigate('/dungeons');
  };
  const handleAutoBattle = () => {
    if (autoBattle) {
      // Выключаем автобой
      setAutoBattle(false);
      setSelectedPair(null);
      setSelectedTarget(null);
      setIsAttacking(false);
    } else {
      // Включаем автобой
      setAutoBattle(true);
    }
  };

  // Автобой логика
  useEffect(() => {
    // Проверяем что не в процессе атаки, чтобы не запустить несколько атак подряд
    if (autoBattle && isPlayerTurn && !isAttacking && alivePairs.length > 0 && aliveOpponents.length > 0) {
      const timer = setTimeout(() => {
        // Ход игрока - выбираем случайную пару и цель
        const randomPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
        const randomTarget = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
        if (randomPair && randomTarget) {
          setIsAttacking(true);
          setAttackingPair(randomPair.id);
          setAttackedTarget(randomTarget.id);
          setTimeout(() => {
            onAttack(randomPair.id, randomTarget.id);
            setTimeout(() => {
              setAttackingPair(null);
              setAttackedTarget(null);
              setIsAttacking(false);
            }, 3500); // Ждем завершения анимации и переключения хода
          }, 200);
        }
      }, 1000); // Задержка 1 секунда для автобоя

      return () => clearTimeout(timer);
    }
  }, [autoBattle, isPlayerTurn, isAttacking, alivePairs.length, aliveOpponents.length, alivePairs, aliveOpponents, onAttack]);
  return <div className="h-screen w-screen overflow-hidden p-2 flex flex-col relative">
      <div className="w-full h-full flex flex-col space-y-2">
        {/* Header */}
        <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <CardHeader className="relative py-3">
            <div className="absolute left-4 top-3 flex gap-2">
              <Button variant="menu" size="sm" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }} onClick={handleMenuReturn}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Меню
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Сдаться
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Покинуть подземелье?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Подземелье будет закрыто и весь прогресс будет утерян. При повторном входе вы начнете с первого уровня.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Нет</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSurrender}>Да</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <CardTitle className="text-center text-lg text-white">
              Командный бой - Уровень {level}
            </CardTitle>
            
            {/* Account Level and XP Progress */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="text-xs text-white/70">
                Уровень: {accountLevel}
              </div>
              <div className="w-40">
                <Progress value={xpProgress.progress * 100} className="h-1" />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>{xpProgress.currentLevelXP}</span>
                  <span>{xpProgress.nextLevelXP}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
          {/* Player Team - Upper Part */}
          <Card variant="menu" className="flex-1 min-h-0" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center gap-2 text-white justify-center text-sm">
                <Shield className="w-4 h-4" />
                Ваша команда
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {playerPairs.map((pair, index) => (
                  <div key={pair.id} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${pair.health <= 0 ? 'bg-black/30 border-white/30 opacity-50' : attackingPair === pair.id ? 'bg-red-500/30 border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50' : defendingPair === pair.id ? 'bg-blue-500/30 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50' : selectedPair === pair.id ? 'bg-white/20 border-white' : 'bg-black/20 border-white/50 hover:border-white'}`} onClick={() => {
                    if (pair.health > 0 && isPlayerTurn) {
                      setSelectedPair(pair.id);
                    }
                  }}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                          {/* Hero Image */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                            {pair.hero.image ? <img src={pair.hero.image} alt={pair.hero.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white">
                                <span className="text-lg">⚔️</span>
                              </div>}
                          </div>
                          
                          {/* Dragon Image */}
                          {pair.dragon && <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                              {pair.dragon.image ? <img src={pair.dragon.image} alt={pair.dragon.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white">
                                  <span className="text-sm">🐲</span>
                                </div>}
                            </div>}
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center mb-1">
                            <span className="font-semibold text-xs bg-white/20 text-white px-1 py-0.5 rounded">
                              #{pair.attackOrder}
                            </span>
                          </div>
                          <span className="font-medium text-sm text-white">{pair.hero.name}</span>
                          {pair.dragon && <div className="text-xs text-white/70">
                              + {pair.dragon.name}
                            </div>}
                        </div>
                        
                        {/* Health Bar */}
                        <div className="w-full">
                          <Progress value={pair.health / pair.maxHealth * 100} className="h-2" />
                          <div className="text-xs text-center mt-1 text-white">
                            <Heart className="w-3 h-3 inline mr-1" />
                            {pair.health}/{pair.maxHealth}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-2 text-xs text-white">
                          <span className="flex items-center">
                            <Sword className="w-3 h-3 mr-1" />
                            {pair.power}
                          </span>
                          <span className="flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            {pair.defense}
                          </span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Combat Actions - Center */}
          <Card variant="menu" className="flex-shrink-0" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardContent className="p-2 relative">
              {/* Attack Animation Overlay */}
              <AttackAnimation 
                isActive={attackAnimation.isActive}
                type={attackAnimation.type}
                source={attackAnimation.source}
                attackerPosition={attackAnimation.source === 'player' ? getDicePosition(playerDiceRef) : getDicePosition(enemyDiceRef)}
                defenderPosition={attackAnimation.source === 'player' ? getDicePosition(enemyDiceRef) : getDicePosition(playerDiceRef)}
                damage={attackAnimation.damage}
              />
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-white">
                  {isPlayerTurn ? <span className="text-green-400">Ваш ход</span> : <span className="text-red-400">Ход противника</span>}
                </div>
                
                
                  <div className="space-y-1">
                  {/* Всегда показываем кубики */}
                  <div className="flex items-center justify-center gap-4">
                    {/* Left Dice (Игрок) */}
                    <div ref={playerDiceRef} className="w-20 flex justify-center">
                      <InlineDiceDisplay
                        key={`dice-left-${diceKey}`}
                        isRolling={isDiceRolling}
                        diceValue={lastRoll ? (lastRoll.source === 'player' ? lastRoll.attackerRoll : lastRoll.defenderRoll) : null}
                        isAttacker={lastRoll ? lastRoll.source === 'player' : true}
                        label="Игрок"
                        damage={lastRoll && lastRoll.source === 'enemy' ? lastRoll.damage : undefined}
                        isBlocked={lastRoll && lastRoll.source === 'enemy' ? lastRoll.isBlocked : undefined}
                        isCritical={lastRoll && lastRoll.source === 'enemy' ? lastRoll.isCritical : undefined}
                      />
                    </div>

                    {/* Attack Button - Center (только в ход игрока) */}
                    {isPlayerTurn && !autoBattle ? (
                      <Button 
                        onClick={handleAttack} 
                        disabled={!selectedPair || selectedTarget === null || typeof selectedTarget === 'string'} 
                        size="sm" 
                        variant="menu"
                        className="h-7 px-3"
                        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                      >
                        Атаковать
                      </Button>
                    ) : (
                      <div className="h-7 w-[88px]" />
                    )}

                    {/* Right Dice (Монстр) */}
                    <div ref={enemyDiceRef} className="w-20 flex justify-center">
                      <InlineDiceDisplay
                        key={`dice-right-${diceKey}`}
                        isRolling={isDiceRolling}
                        diceValue={lastRoll ? (lastRoll.source === 'player' ? lastRoll.defenderRoll : lastRoll.attackerRoll) : null}
                        isAttacker={lastRoll ? lastRoll.source === 'enemy' : false}
                        label="Монстр"
                        damage={lastRoll && lastRoll.source === 'player' ? lastRoll.damage : undefined}
                        isBlocked={lastRoll && lastRoll.source === 'player' ? lastRoll.isBlocked : undefined}
                        isCritical={lastRoll && lastRoll.source === 'player' ? lastRoll.isCritical : undefined}
                      />
                    </div>
                  </div>

                  {/* Подсказки только в ход игрока */}
                  {isPlayerTurn && !autoBattle && selectedPair && !selectedTarget && (
                    <div className="text-xs text-white/70">
                      Выберите цель для атаки
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button 
                    variant={autoBattle ? "destructive" : "menu"} 
                    size="sm" 
                    onClick={handleAutoBattle}
                    className={autoBattle ? "" : ""}
                    style={!autoBattle ? { boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' } : undefined}
                  >
                    {autoBattle ? "Стоп авто-бой" : "Авто-бой"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enemy Team - Lower Part */}
          <Card variant="menu" className="flex-1 min-h-0" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center gap-2 text-red-400 justify-center text-sm">
                <Sword className="w-4 h-4" />
                Враги
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {opponents.map((opponent, index) => <div key={opponent.id} className={`relative rounded-3xl border-2 transition-all overflow-hidden h-28 ${opponent.health <= 0 ? 'border-white/30' : attackedTarget === opponent.id ? 'border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50 cursor-pointer' : selectedTarget === opponent.id ? 'border-red-400 bg-red-400/10 cursor-pointer' : 'border-white/50 hover:border-red-400/50 cursor-pointer'}`} onClick={() => {
                if (opponent.health > 0 && isPlayerTurn) {
                  setSelectedTarget(opponent.id);
                }
              }}>
                    {/* Vertical Health Bar - Left Side */}
                    <div className="absolute left-1 top-2 bottom-2 w-3 bg-black/60 rounded-full flex flex-col justify-end z-20">
                      <div 
                        className="bg-red-500 rounded-full transition-all duration-300"
                        style={{ 
                          height: `${(opponent.health / opponent.maxHealth) * 100}%`,
                          minHeight: '2px'
                        }}
                      />
                    </div>

                    {/* Background Image */}
                    {opponent.image && <div className={`absolute inset-0 bg-cover bg-center bg-no-repeat image-rendering-crisp-edges transition-all ${opponent.health <= 0 ? 'grayscale' : ''}`} style={{
                  backgroundImage: `url(${opponent.image})`,
                  imageRendering: 'crisp-edges'
                }} />}
                    
                    {/* Killed overlay */}
                    {opponent.health <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                        <div className="text-4xl font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                          УБИТ
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay for stats */}
                    <div className="relative z-10 p-2 bg-black/20 h-full flex flex-col justify-between">
                      {/* Health and Stats Overlay */}
                      <div className="text-right ml-4">
                        <div className="text-red-500 font-bold text-sm drop-shadow-lg">
                          ❤️ {opponent.health}/{opponent.maxHealth}
                        </div>
                        <div className="text-red-500 font-bold text-sm drop-shadow-lg">
                          ⚔️ {opponent.power}
                        </div>
                        <div className="text-red-500 font-bold text-sm drop-shadow-lg">
                          🛡️ {opponent.armor ?? 0}
                        </div>
                      </div>
                      
                      {/* Name */}
                      <div className="text-center">
                        <div className="text-red-500 font-bold text-sm drop-shadow-lg">
                          {opponent.name}
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};