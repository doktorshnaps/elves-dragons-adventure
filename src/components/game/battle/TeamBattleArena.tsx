import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sword, Shield, Heart, ArrowLeft } from 'lucide-react';
import { TeamPair } from '@/types/teamBattle';
import { Opponent } from '@/types/battle';
import { useGameStore } from '@/stores/gameStore';
import { getXPProgress } from '@/utils/accountLeveling';
import { useNavigate } from 'react-router-dom';
import { TeamHealthBars } from './TeamHealthBars';
interface TeamBattleArenaProps {
  playerPairs: TeamPair[];
  opponents: Opponent[];
  attackOrder: string[];
  isPlayerTurn: boolean;
  onAttack: (pairId: string, targetId: number) => void;
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
  const [selectedTarget, setSelectedTarget] = React.useState<number | null>(null);
  const [attackingPair, setAttackingPair] = React.useState<string | null>(null);
  const [attackedTarget, setAttackedTarget] = React.useState<number | null>(null);
  const [defendingPair, setDefendingPair] = React.useState<string | null>(null);
  const [counterAttackingPair, setCounterAttackingPair] = React.useState<string | null>(null);
  const [counterAttackedTarget, setCounterAttackedTarget] = React.useState<number | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const alivePairs = playerPairs.filter(pair => pair.health > 0);
  const aliveOpponents = opponents.filter(opp => opp.health > 0);
  const handleAttack = () => {
    if (selectedPair && selectedTarget !== null) {
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
    if (!isPlayerTurn && aliveOpponents.length > 0 && alivePairs.length > 0) {
      const timer = setTimeout(() => {
        handleEnemyAttack();
      }, 1500); // Задержка 1.5 секунды перед ходом противника

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
      <div className="max-w-6xl mx-auto space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Player Team */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                Ваша команда
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {playerPairs.map((pair, index) => <div key={pair.id} className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${pair.health <= 0 ? 'bg-muted/50 border-muted opacity-50' : attackingPair === pair.id ? 'bg-red-500/30 border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50' : counterAttackingPair === pair.id ? 'bg-yellow-500/40 border-yellow-500 animate-bounce scale-110 shadow-lg shadow-yellow-500/60' : defendingPair === pair.id ? 'bg-blue-500/30 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50' : selectedPair === pair.id ? 'bg-primary/20 border-primary' : currentAttacker?.id === pair.id && isPlayerTurn ? 'bg-accent/20 border-accent' : 'bg-card border-border hover:border-primary/50'}`} onClick={() => pair.health > 0 && isPlayerTurn && setSelectedPair(pair.id)}>
                   <div className="flex items-center gap-3 mb-2">
                     <div className="flex gap-2">
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
                     
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <span className="font-semibold text-sm bg-primary/20 px-2 py-1 rounded">
                           #{pair.attackOrder}
                         </span>
                         <span className="font-medium">{pair.hero.name}</span>
                         {pair.dragon && <span className="text-sm text-muted-foreground">
                             + {pair.dragon.name}
                           </span>}
                       </div>
                     </div>
                    {currentAttacker?.id === pair.id && isPlayerTurn && <div className="text-xs bg-accent px-2 py-1 rounded">
                        Ходит
                      </div>}
                  </div>
                   
                   <div className="space-y-2">
                     <TeamHealthBars pair={pair} />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Sword className="w-3 h-3" />
                        {pair.power}
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {pair.defense}
                      </div>
                    </div>
                  </div>
                </div>)}
            </CardContent>
          </Card>

          {/* Combat Controls - Between player and enemies */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 lg:col-span-1 py-0 my-[240px] mx-[71px]">
            <CardContent className="pt-6 mx-[108px] px-0 my-[25px] py-0">
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Auto Battle Button */}
                <Button 
                  onClick={handleAutoBattle}
                  variant={autoBattle ? "default" : "destructive"}
                  className={`${autoBattle ? 'bg-green-600 hover:bg-green-700 border-green-600' : 'bg-red-600 hover:bg-red-700 border-red-600'} transition-colors`}
                >
                  {autoBattle ? 'Авто-бой ВКЛ' : 'Авто-бой ВЫКЛ'}
                </Button>
                
                {!autoBattle && (
                  <div className="flex items-center justify-center gap-4">
                    {isPlayerTurn ? <>
                        <Button onClick={handleAttack} disabled={!selectedPair || selectedTarget === null}>
                          Атаковать
                        </Button>
                        <div className="text-sm text-muted-foreground mx-0 px-0 py-0 my-0">
                          {!selectedPair ? 'Выберите атакующего' : selectedTarget === null ? 'Выберите цель' : 'Готов к атаке!'}
                        </div>
                      </> : <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                          Противник атакует...
                        </div>
                        <div className="animate-spin w-6 h-6 border-2 border-destructive border-t-transparent rounded-full mx-auto"></div>
                      </div>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enemies */}
          <Card className="bg-card/50 backdrop-blur-sm border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Sword className="w-5 h-5" />
                Враги
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {opponents.map(opponent => <div key={opponent.id} className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${opponent.health <= 0 ? 'bg-muted/50 border-muted opacity-50' : attackedTarget === opponent.id ? 'bg-red-500/40 border-red-500 animate-bounce shadow-lg shadow-red-500/50 scale-110' : counterAttackedTarget === opponent.id ? 'bg-yellow-500/40 border-yellow-500 animate-pulse scale-105 shadow-lg shadow-yellow-500/60' : selectedTarget === opponent.id ? 'bg-destructive/20 border-destructive' : 'bg-card border-border hover:border-destructive/50'}`} onClick={() => opponent.health > 0 && setSelectedTarget(opponent.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{opponent.name}</span>
                    {opponent.isBoss && <span className="text-xs bg-destructive px-2 py-1 rounded text-white">
                        БОСС
                      </span>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-red-500" />
                      <Progress value={opponent.health / opponent.maxHealth * 100} className="flex-1 h-2" />
                      <span>{opponent.health}/{opponent.maxHealth}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Sword className="w-3 h-3" />
                        {opponent.power}
                      </div>
                    </div>
                  </div>
                </div>)}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>;
};