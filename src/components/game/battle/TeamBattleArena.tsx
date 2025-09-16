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
  return (
    <div className="min-h-screen p-4">
      {/* Removed old ability menu */}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Индикатор выбранной способности */}
        {selectedAbility && (
          <Card className="bg-blue-500/20 border-blue-400">
            <CardContent className="p-4">
              <div className="text-blue-400 font-medium">
                Выбрана способность: {selectedAbility.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedAbility.description}. Выберите цель для применения.
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedAbility(null);
                  setSelectedPair(null);
                }}
                className="mt-2"
              >
                Отмена
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="relative">
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={handleMenuReturn}>
                <ArrowLeft className="w-4 h-4 mr-2" />
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
            
            <CardTitle className="text-center text-2xl text-primary">
              Командный бой - Уровень {level}
            </CardTitle>
            
            {/* Account Level and XP Progress */}
            <div className="flex flex-col items-center gap-2 mt-4">
              <div className="text-sm text-muted-foreground">
                Уровень аккаунта: {accountLevel}
              </div>
              <div className="w-full max-w-md">
                <Progress value={xpProgress.progress * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{xpProgress.currentLevelXP} XP</span>
                  <span>{xpProgress.nextLevelXP} XP</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Player Team */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                Ваша команда
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {playerPairs.map((pair, index) => {
                 // Получаем способности для героя
                 const heroAbilities = HERO_ABILITIES[pair.hero.name] || [];
                 const hasAbilities = heroAbilities.length > 0;
                 const currentMana = pair.mana || 0;
                 const maxMana = pair.maxMana || pair.hero.magic || 0;
                 
                 return (
                   <div 
                     key={pair.id} 
                     className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                       pair.health <= 0 
                         ? 'bg-muted/50 border-muted opacity-50' 
                         : attackingPair === pair.id 
                           ? 'bg-red-500/30 border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50' 
                           : counterAttackingPair === pair.id 
                             ? 'bg-yellow-500/40 border-yellow-500 animate-bounce scale-110 shadow-lg shadow-yellow-500/60' 
                             : defendingPair === pair.id 
                               ? 'bg-blue-500/30 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50' 
                               : selectedPair === pair.id 
                                 ? 'bg-primary/20 border-primary' 
                                  : selectedAbility?.targetType === 'ally' && selectedTarget === pair.id
                                    ? 'bg-green-500/20 border-green-400'
                                    : selectedAbility?.targetType === 'ally'
                                      ? 'bg-card border-green-400 hover:border-green-500/50'
                                      : 'bg-card border-border hover:border-primary/50'
                     }`} 
                       onClick={() => {
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
                       }}
                   >
                     <div className="flex items-center gap-3 mb-2">
                       <div className="flex gap-2">
                         {/* Hero Image */}
                         <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary/30 bg-primary/10 flex-shrink-0">
                           {pair.hero.image ? (
                             <img src={pair.hero.image} alt={pair.hero.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-primary">
                               <span className="text-lg">⚔️</span>
                             </div>
                           )}
                         </div>
                         
                         {/* Dragon Image */}
                         {pair.dragon && (
                           <div className="w-10 h-10 rounded-lg overflow-hidden border border-secondary/30 bg-secondary/10 flex-shrink-0">
                             {pair.dragon.image ? (
                               <img src={pair.dragon.image} alt={pair.dragon.name} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-secondary">
                                 <span className="text-sm">🐲</span>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                       
                       <div className="flex-1">
                         <div className="flex items-center gap-2">
                           <span className="font-semibold text-sm bg-primary/20 px-2 py-1 rounded">
                             #{pair.attackOrder}
                           </span>
                           <span className="font-medium">{pair.hero.name}</span>
                           {pair.dragon && (
                             <span className="text-sm text-muted-foreground">
                               + {pair.dragon.name}
                             </span>
                           )}
                         </div>
                         
                           {/* Индикатор способностей */}
                           {hasAbilities && (
                             <div className="flex items-center justify-between text-xs text-blue-400 mt-1">
                               <span>🔮 Способности: {heroAbilities.length}</span>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="h-5 px-2 text-xs border-blue-400/50 text-blue-400 hover:bg-blue-500/20"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (heroAbilities.length === 1) {
                                     // Если способность одна, сразу выбираем её
                                     const ability = heroAbilities[0];
                                     if (currentMana >= ability.manaCost) {
                                       setSelectedAbility(ability);
                                       setSelectedPair(pair.id);
                                     }
                                   } else {
                                     // Если способностей несколько, открываем панель
                                     setSelectedPair(pair.id);
                                   }
                                 }}
                                 disabled={!heroAbilities.some(ability => currentMana >= ability.manaCost)}
                               >
                                 ⚡
                               </Button>
                             </div>
                           )}
                          
                          {/* Индикатор цели для исцеления */}
                          {selectedAbility?.targetType === 'ally' && selectedTarget === pair.id && (
                            <div className="text-xs text-green-400 mt-1">
                              💚 ЦЕЛЬ ДЛЯ ИСЦЕЛЕНИЯ
                            </div>
                          )}
                       </div>
                       
                       {currentAttacker?.id === pair.id && isPlayerTurn && (
                         <div className="text-xs bg-accent px-2 py-1 rounded">
                           Ходит
                         </div>
                       )}
                     </div>
                      
                     <div className="space-y-2">
                       <TeamHealthBars pair={pair} />
                       
                       {/* Мана-бар для героев со способностями */}
                       {hasAbilities && maxMana > 0 && (
                         <div className="space-y-1">
                           <div className="flex items-center gap-2 text-xs">
                             <Zap className="w-3 h-3 text-blue-400" />
                             <Progress 
                               value={(currentMana / maxMana) * 100} 
                               className="flex-1 h-1.5"
                             />
                             <span className="text-blue-400">{currentMana}/{maxMana}</span>
                           </div>
                         </div>
                       )}
                      
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <div className="flex items-center gap-1">
                           <Sword className="w-3 h-3" />
                           {pair.power}
                         </div>
                         <div className="flex items-center gap-1">
                           <Shield className="w-3 h-3" />
                           {pair.defense}
                         </div>
                         {hasAbilities && (
                           <div className="flex items-center gap-1 text-blue-400">
                             <Zap className="w-3 h-3" />
                             {pair.hero.magic}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 );
               })}
            </CardContent>
          </Card>

          {/* Combat Controls - Center */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 h-fit">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col items-center justify-center gap-3">
                {/* Auto Battle Button */}
                <Button 
                  onClick={handleAutoBattle}
                  variant={autoBattle ? "default" : "destructive"}
                  className={`${autoBattle ? 'bg-green-600 hover:bg-green-700 border-green-600' : 'bg-red-600 hover:bg-red-700 border-red-600'} transition-colors text-sm`}
                  size="sm"
                >
                  {autoBattle ? 'Авто ВКЛ' : 'Авто ВЫКЛ'}
                </Button>
                
                 {!autoBattle && (
                   <div className="flex flex-col items-center gap-2">
                     {isPlayerTurn ? (
                       <>
                          <Button 
                            onClick={() => {
                              console.log('Button clicked!');
                              console.log('selectedAbility:', selectedAbility);
                              console.log('selectedPair:', selectedPair);
                              console.log('selectedTarget:', selectedTarget);
                              console.log('onAbilityUse:', typeof onAbilityUse);
                              
                              if (selectedAbility && selectedPair && selectedTarget !== null && onAbilityUse) {
                                console.log('Using ability:', selectedAbility.name, 'from:', selectedPair, 'on target:', selectedTarget);
                                onAbilityUse(selectedPair, selectedAbility.id, selectedTarget);
                                setSelectedAbility(null);
                                setSelectedPair(null);
                                setSelectedTarget(null);
                              } else if (selectedPair && typeof selectedTarget === 'number') {
                                console.log('Regular attack');
                                handleAttack();
                              } else {
                                console.log('Conditions not met for ability or attack');
                                console.log('Missing:', {
                                  ability: !selectedAbility,
                                  pair: !selectedPair,
                                  target: selectedTarget === null,
                                  onAbilityUse: !onAbilityUse
                                });
                              }
                            }}
                           disabled={!selectedPair || selectedTarget === null}
                           size="sm"
                         >
                           {selectedAbility ? 'Способность' : 'Атаковать'}
                         </Button>
                         <div className="text-xs text-muted-foreground text-center max-w-[120px]">
                           {!selectedPair ? 'Выберите атакующего' : selectedTarget === null ? 'Выберите цель' : selectedAbility ? 'Готов!' : 'Готов к атаке!'}
                         </div>
                       </>
                     ) : (
                       <div className="text-center">
                         <div className="text-xs text-muted-foreground mb-2">
                           Противник атакует...
                         </div>
                         <div className="animate-spin w-4 h-4 border-2 border-destructive border-t-transparent rounded-full mx-auto"></div>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>

          {/* Enemies - Right */}
          <Card className="bg-card/50 backdrop-blur-sm border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Sword className="w-5 h-5" />
                Враги
              </CardTitle>
            </CardHeader>
             <CardContent className="space-y-3">
               {opponents.map(opponent => (
                 <div 
                   key={opponent.id} 
                   className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                     opponent.health <= 0 
                       ? 'bg-muted/50 border-muted opacity-50' 
                       : attackedTarget === opponent.id 
                         ? 'bg-red-500/40 border-red-500 animate-bounce shadow-lg shadow-red-500/50 scale-110' 
                         : counterAttackedTarget === opponent.id 
                           ? 'bg-yellow-500/40 border-yellow-500 animate-pulse scale-105 shadow-lg shadow-yellow-500/60' 
                           : selectedTarget === opponent.id 
                             ? 'bg-destructive/20 border-destructive' 
                             : selectedAbility?.targetType === 'enemy' 
                               ? 'bg-card border-red-400 hover:border-destructive/50' 
                               : 'bg-card border-border hover:border-destructive/50'
                   }`} 
                    onClick={() => {
                      if (opponent.health > 0) {
                        // Способности исцеления не могут быть использованы на врагах
                        if (selectedAbility && selectedAbility.targetType === 'ally') {
                          return;
                        }
                        
                        // Если повторно нажимаем на ту же цель, отменяем выбор
                        if (selectedTarget === opponent.id) {
                          setSelectedTarget(null);
                        } else {
                          setSelectedTarget(opponent.id);
                        }
                      }
                     }}
                  >
                    {opponent.image && (
                      <div className="w-16 h-16 mb-3 mx-auto rounded-lg overflow-hidden border border-game-accent/30">
                        <img 
                          src={opponent.image} 
                          alt={opponent.name}
                          className="w-full h-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{opponent.name}</span>
                      <div className="flex items-center gap-1">
                        {opponent.isBoss && (
                          <span className="text-xs bg-destructive px-1.5 py-0.5 rounded text-white">
                            БОСС
                          </span>
                        )}
                        {selectedAbility?.targetType === 'enemy' && selectedTarget === opponent.id && (
                          <span className="text-xs bg-red-500 px-1.5 py-0.5 rounded text-white">
                            🎯
                          </span>
                        )}
                        {selectedAbility?.targetType === 'ally' && (
                          <span className="text-xs bg-gray-500 px-1.5 py-0.5 rounded text-white opacity-50">
                            ❌
                          </span>
                        )}
                      </div>
                    </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-3 h-3 text-red-500" />
                      <Progress value={opponent.health / opponent.maxHealth * 100} className="flex-1 h-1.5" />
                      <span className="text-xs">{opponent.health}/{opponent.maxHealth}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Sword className="w-3 h-3" />
                      <span>{opponent.power}</span>
                    </div>
                  </div>
                 </div>
               ))}
             </CardContent>
           </Card>
         </div>

       </div>
     </div>
   );
 };