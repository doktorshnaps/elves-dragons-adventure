import React, { useEffect, useState } from 'react';
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
import { AbilitiesPanel } from './AbilitiesPanel';
import { HERO_ABILITIES } from '@/types/abilities';
import type { Ability } from '@/types/abilities';
interface TeamBattleArenaProps {
  playerPairs: TeamPair[];
  opponents: Opponent[];
  attackOrder: string[];
  isPlayerTurn: boolean;
  onAttack: (pairId: string, targetId: number) => void;
  onAbilityUse?: (pairId: string, abilityId: string, targetId: number | string) => void;
  onEnemyAttack: () => void;
  onCounterAttack: (attackerId: string | number, targetId: string | number, isEnemyAttacker: boolean) => void;
  level: number;
}
export const TeamBattleArena: React.FC<TeamBattleArenaProps> = ({
  playerPairs,
  opponents,
  attackOrder,
  isPlayerTurn,
  onAttack,
  onAbilityUse,
  onEnemyAttack,
  onCounterAttack,
  level
}) => {
  const navigate = useNavigate();
  const {
    accountLevel,
    accountExperience
  } = useGameStore();
  const [selectedPair, setSelectedPair] = React.useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = React.useState<number | string | null>(null);
  const [attackingPair, setAttackingPair] = React.useState<string | null>(null);
  const [attackedTarget, setAttackedTarget] = React.useState<number | null>(null);
  const [defendingPair, setDefendingPair] = React.useState<string | null>(null);
  const [counterAttackingPair, setCounterAttackingPair] = React.useState<string | null>(null);
  const [counterAttackedTarget, setCounterAttackedTarget] = React.useState<number | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const alivePairs = playerPairs.filter(pair => pair.health > 0);
  const aliveOpponents = opponents.filter(opp => opp.health > 0);
  const handleAttack = () => {
    if (selectedPair && selectedTarget !== null && typeof selectedTarget === 'number') {
      const pairId = selectedPair;
      const targetId = selectedTarget;
      // Запускаем анимацию атаки
      setAttackingPair(pairId);
      setAttackedTarget(targetId);

      // Выполняем атаку через небольшую задержку для анимации
      setTimeout(() => {
        onAttack(pairId, targetId);
        setSelectedPair(null);
        setSelectedTarget(null);

        // Убираем эффекты атаки
        setTimeout(() => {
          setAttackingPair(null);
          setAttackedTarget(null);
        }, 300);

        // Визуальный эффект ответного удара врага по атакующей паре
        setTimeout(() => {
          setDefendingPair(pairId);
          // Подсветим также врага как участвующего в ответном ударе
          setCounterAttackedTarget(targetId);
          setTimeout(() => {
            setDefendingPair(null);
            setCounterAttackedTarget(null);
          }, 400);
        }, 600);
      }, 200);
    }
  };
  const handleEnemyAttack = () => {
    // Случайно выбираем живую пару для защиты
    const randomPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
    if (randomPair) {
      setDefendingPair(randomPair.id);
      setTimeout(() => {
        onEnemyAttack();

        // Визуальный эффект ответной атаки пары после защиты
        setTimeout(() => {
          setCounterAttackingPair(randomPair.id);
          setTimeout(() => {
            setCounterAttackingPair(null);
          }, 400);
        }, 600);
        setTimeout(() => {
          setDefendingPair(null);
        }, 300);
      }, 200);
    } else {
      onEnemyAttack();
    }
  };
  const getCurrentAttacker = () => {
    const orderedPairs = [...alivePairs].sort((a, b) => a.attackOrder - b.attackOrder);
    return orderedPairs[0];
  };
  const currentAttacker = getCurrentAttacker();

  // Получаем прогресс опыта для отображения
  const xpProgress = getXPProgress(accountExperience);

  // Автоматический ход противника
  useEffect(() => {
    const isActive = localStorage.getItem('activeBattleInProgress') === 'true';
    if (!isActive) return;
    if (!isPlayerTurn && aliveOpponents.length > 0 && alivePairs.length > 0) {
      const timer = setTimeout(() => {
        handleEnemyAttack();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, aliveOpponents.length, alivePairs.length]);
  const handleMenuReturn = () => {
    // Mark that we're in an active battle for auto-resume
    localStorage.setItem('activeBattleInProgress', 'true');
    navigate('/menu');
  };
  const handleSurrender = () => {
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
    } else {
      // Включаем автобой
      setAutoBattle(true);
    }
  };

  // Автобой логика
  useEffect(() => {
    if (autoBattle && alivePairs.length > 0 && aliveOpponents.length > 0) {
      const timer = setTimeout(() => {
        if (isPlayerTurn) {
          // Ход игрока - выбираем случайную пару и цель
          const randomPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
          const randomTarget = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
          if (randomPair && randomTarget) {
            setAttackingPair(randomPair.id);
            setAttackedTarget(randomTarget.id);
            setTimeout(() => {
              onAttack(randomPair.id, randomTarget.id);
              setTimeout(() => {
                setAttackingPair(null);
                setAttackedTarget(null);
              }, 300);
              setTimeout(() => {
                setDefendingPair(randomPair.id);
                setCounterAttackedTarget(randomTarget.id);
                setTimeout(() => {
                  setDefendingPair(null);
                  setCounterAttackedTarget(null);
                }, 400);
              }, 600);
            }, 200);
          }
        }
      }, 1000); // Задержка 1 секунда для автобоя

      return () => clearTimeout(timer);
    }
  }, [autoBattle, isPlayerTurn, alivePairs.length, aliveOpponents.length]);
  return <div className="min-h-screen p-4">
      {/* Removed old ability menu */}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Индикатор выбранной способности */}
        {selectedAbility && <Card className="bg-blue-500/20 border-blue-400">
            <CardContent className="p-4">
              <div className="text-blue-400 font-medium">
                Выбрана способность: {selectedAbility.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedAbility.description}. Выберите цель для применения.
              </div>
              <Button variant="outline" size="sm" onClick={() => {
            setSelectedAbility(null);
            setSelectedPair(null);
          }} className="mt-2">
                Отмена
              </Button>
            </CardContent>
          </Card>}

        {/* Header */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="relative py-3">
            <div className="absolute left-4 top-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleMenuReturn}>
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
            
            <CardTitle className="text-center text-lg text-primary">
              Командный бой - Уровень {level}
            </CardTitle>
            
            {/* Account Level and XP Progress */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="text-xs text-muted-foreground">
                Уровень: {accountLevel}
              </div>
              <div className="w-40">
                <Progress value={xpProgress.progress * 100} className="h-1" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{xpProgress.currentLevelXP}</span>
                  <span>{xpProgress.nextLevelXP}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {/* Player Team - Upper Part */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary justify-center">
                <Shield className="w-5 h-5" />
                Ваша команда
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {playerPairs.map((pair, index) => {
                // Получаем способности для героя
                const heroAbilities = HERO_ABILITIES[pair.hero.name] || [];
                const hasAbilities = heroAbilities.length > 0;
                const currentMana = pair.mana || 0;
                const maxMana = pair.maxMana || pair.hero.magic || 0;
                return <div key={pair.id} className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${pair.health <= 0 ? 'bg-muted/50 border-muted opacity-50' : attackingPair === pair.id ? 'bg-red-500/30 border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50' : counterAttackingPair === pair.id ? 'bg-yellow-500/40 border-yellow-500 animate-bounce scale-110 shadow-lg shadow-yellow-500/60' : defendingPair === pair.id ? 'bg-blue-500/30 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50' : selectedPair === pair.id ? 'bg-primary/20 border-primary' : selectedAbility?.targetType === 'ally' && selectedTarget === pair.id ? 'bg-green-500/20 border-green-400' : selectedAbility?.targetType === 'ally' ? 'bg-card border-green-400 hover:border-green-500/50' : 'bg-card border-border hover:border-primary/50'}`} onClick={() => {
                  if (pair.health > 0 && isPlayerTurn) {
                    // Если выбираем нового персонажа, отменяем способность
                    if (selectedPair !== pair.id && selectedAbility) {
                      setSelectedAbility(null);
                      setSelectedTarget(null);
                    }

                    // Если способность выбрана и это способность исцеления
                    if (selectedAbility && selectedAbility.targetType === 'ally') {
                      // Если повторно нажимаем на ту же цель, отменяем выбор
                      if (selectedTarget === pair.id) {
                        setSelectedTarget(null);
                      } else {
                        setSelectedTarget(pair.id);
                      }
                    } else {
                      // Просто выбираем персонажа
                      setSelectedPair(pair.id);
                    }
                  }
                }}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                          {/* Hero Image */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary/30 bg-primary/10 flex-shrink-0">
                            {pair.hero.image ? <img src={pair.hero.image} alt={pair.hero.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary">
                                <span className="text-lg">⚔️</span>
                              </div>}
                          </div>
                          
                          {/* Dragon Image */}
                          {pair.dragon && <div className="w-10 h-10 rounded-lg overflow-hidden border border-secondary/30 bg-secondary/10 flex-shrink-0">
                              {pair.dragon.image ? <img src={pair.dragon.image} alt={pair.dragon.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-secondary">
                                  <span className="text-sm">🐲</span>
                                </div>}
                            </div>}
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center mb-1">
                            <span className="font-semibold text-xs bg-primary/20 px-1 py-0.5 rounded">
                              #{pair.attackOrder}
                            </span>
                          </div>
                          <span className="font-medium text-sm">{pair.hero.name}</span>
                          {pair.dragon && <div className="text-xs text-muted-foreground">
                              + {pair.dragon.name}
                            </div>}
                        </div>
                        
                        {/* Health Bar */}
                        <div className="w-full">
                          <Progress value={pair.health / pair.maxHealth * 100} className="h-2" />
                          <div className="text-xs text-center mt-1">
                            <Heart className="w-3 h-3 inline mr-1" />
                            {pair.health}/{pair.maxHealth}
                          </div>
                        </div>

                        {/* Mana Bar */}
                        {hasAbilities && maxMana > 0 && <div className="w-full">
                            <Progress value={currentMana / maxMana * 100} className="h-1" />
                            <div className="text-xs text-center text-blue-400 mt-1">
                              <Zap className="w-3 h-3 inline mr-1" />
                              {currentMana}/{maxMana}
                            </div>
                          </div>}

                        {/* Stats */}
                        <div className="flex gap-2 text-xs">
                          <span className="flex items-center">
                            <Sword className="w-3 h-3 mr-1" />
                            {pair.power}
                          </span>
                          <span className="flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            {pair.defense}
                          </span>
                        </div>

                        {/* Abilities Button */}
                        {hasAbilities && <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-blue-400/50 text-blue-400 hover:bg-blue-500/20 w-full" onClick={e => {
                      e.stopPropagation();
                      if (heroAbilities.length === 1) {
                        // Если способность одна, сразу выбираем её
                        const ability = heroAbilities[0];
                        if (currentMana >= ability.manaCost) {
                          setSelectedAbility(ability);
                          setSelectedPair(pair.id);
                          setSelectedTarget(null);
                        }
                      }
                    }} disabled={!isPlayerTurn || pair.health <= 0}>
                            🔮 Способности
                          </Button>}
                      </div>
                    </div>;
              })}
              </div>
            </CardContent>
          </Card>

          {/* Combat Actions - Center */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-3">
              <div className="text-center space-y-2">
                <div className="text-sm font-medium">
                  {isPlayerTurn ? <span className="text-primary">Ваш ход</span> : <span className="text-destructive">Ход противника</span>}
                </div>
                
                {selectedAbility && selectedPair && <AbilitiesPanel selectedPair={playerPairs.find(p => p.id === selectedPair) || null} selectedAbility={selectedAbility} onSelectAbility={ability => {
                setSelectedAbility(ability);
                setSelectedTarget(null);
              }} onCancelAbility={() => {
                setSelectedAbility(null);
                setSelectedPair(null);
                setSelectedTarget(null);
              }} />}
                
                {isPlayerTurn && !autoBattle && <div className="space-y-1">
                    {selectedAbility ? <div className="text-xs text-muted-foreground">
                        Выберите цель для способности "{selectedAbility.name}"
                      </div> : <>
                        <Button onClick={handleAttack} disabled={!selectedPair || selectedTarget === null || typeof selectedTarget === 'string'} size="sm" className="w-40">
                          Атаковать
                        </Button>
                        {selectedPair && !selectedTarget && <div className="text-xs text-muted-foreground">
                            Выберите цель для атаки
                          </div>}
                      </>}
                  </div>}

                <div className="flex gap-2 justify-center">
                  <Button variant={autoBattle ? "destructive" : "outline"} size="sm" onClick={handleAutoBattle}>
                    {autoBattle ? "Стоп авто-бой" : "Авто-бой"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enemy Team - Lower Part */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive justify-center">
                <Sword className="w-5 h-5" />
                Враги
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {opponents.map((opponent, index) => <div key={opponent.id} className={`relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden min-h-[200px] ${opponent.health <= 0 ? 'opacity-50 border-muted' : attackedTarget === opponent.id ? 'border-yellow-500 animate-bounce scale-110 shadow-lg shadow-yellow-500/60' : counterAttackedTarget === opponent.id ? 'border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50' : selectedTarget === opponent.id ? 'border-destructive bg-destructive/10' : selectedAbility?.targetType === 'enemy' ? 'border-red-400 hover:border-red-500/70' : 'border-border hover:border-destructive/50'}`} onClick={() => {
                if (opponent.health > 0 && isPlayerTurn) {
                  if (selectedAbility && selectedAbility.targetType === 'enemy') {
                    // Если повторно нажимаем на ту же цель, отменяем выбор
                    if (selectedTarget === opponent.id) {
                      setSelectedTarget(null);
                    } else {
                      setSelectedTarget(opponent.id);
                    }
                  } else if (!selectedAbility) {
                    // Обычный выбор цели для атаки
                    setSelectedTarget(opponent.id);
                  }
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
                    {opponent.image && <div className="absolute inset-0 bg-cover bg-center bg-no-repeat image-rendering-crisp-edges" style={{
                  backgroundImage: `url(${opponent.image})`,
                  imageRendering: 'crisp-edges'
                }} />}
                    
                    {/* Overlay for stats */}
                    <div className="relative z-10 p-2 bg-black/20 backdrop-blur-sm h-full flex flex-col justify-between">
                      {/* Health and Stats Overlay */}
                      <div className="text-right ml-4">
                        <div className="text-red-500 font-bold text-sm drop-shadow-lg">
                          ❤️ {opponent.health}/{opponent.maxHealth}
                        </div>
                        <div className="text-red-500 font-bold text-sm drop-shadow-lg">
                          ⚔️ {opponent.power}
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