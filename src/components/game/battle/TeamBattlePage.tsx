import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useTeamBattle } from '@/hooks/team/useTeamBattle';
import { AttackOrderSelector } from './AttackOrderSelector';
import { TeamBattleArena } from './TeamBattleArena';
import { DungeonType } from '@/constants/dungeons';

interface TeamBattlePageProps {
  dungeonType: DungeonType;
}

export const TeamBattlePage: React.FC<TeamBattlePageProps> = ({ dungeonType }) => {
  const navigate = useNavigate();
  const [battleStarted, setBattleStarted] = useState(false);
  
  const {
    battleState,
    attackOrder,
    updateAttackOrder,
    executePlayerAttack,
    executeEnemyAttack,
    executeCounterAttack,
    resetBattle,
    isPlayerTurn,
    alivePairs,
    aliveOpponents
  } = useTeamBattle(dungeonType);

  const handleStartBattle = () => {
    setBattleStarted(true);
  };

  const handleBackToMenu = () => {
    resetBattle();
    navigate('/dungeons');
  };

  // Check if battle is over
  const isBattleOver = alivePairs.length === 0 || aliveOpponents.length === 0;

  if (isBattleOver && battleStarted) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {alivePairs.length === 0 ? 'Поражение!' : 'Победа!'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {alivePairs.length === 0 
                  ? 'Ваша команда пала в бою...' 
                  : `Уровень ${battleState.level} завершен!`}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleBackToMenu} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к подземельям
                </Button>
                {alivePairs.length > 0 && (
                  <Button onClick={() => window.location.reload()}>
                    Следующий уровень
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!battleStarted) {
    return (
      <>
        <div className="fixed top-4 left-4 z-10">
          <Button 
            onClick={handleBackToMenu}
            variant="ghost" 
            size="sm"
            className="bg-card/50 backdrop-blur-sm border border-border/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
        
        <AttackOrderSelector
          playerPairs={battleState.playerPairs}
          attackOrder={attackOrder}
          onOrderChange={updateAttackOrder}
          onStartBattle={handleStartBattle}
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed top-4 left-4 z-10">
        <Button 
          onClick={handleBackToMenu}
          variant="ghost" 
          size="sm"
          className="bg-card/50 backdrop-blur-sm border border-border/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Сдаться
        </Button>
      </div>
      
      <TeamBattleArena
        playerPairs={battleState.playerPairs}
        opponents={battleState.opponents}
        attackOrder={attackOrder}
        isPlayerTurn={isPlayerTurn}
        onAttack={executePlayerAttack}
        onEnemyAttack={executeEnemyAttack}
        onCounterAttack={executeCounterAttack}
        level={battleState.level}
      />
    </>
  );
};