import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBattleState } from '@/hooks/useBattleState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const Battle = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  const {
    playerStats,
    opponents,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
  } = useBattleState(level);

  if (!playerStats || !opponents) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <Card className="p-4 bg-game-surface border-game-accent">
          <h2 className="text-xl font-bold text-game-accent mb-4">Ваш герой</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-game-accent">Здоровье</span>
                <span className="text-game-accent">{playerStats.health}/{playerStats.maxHealth}</span>
              </div>
              <Progress value={(playerStats.health / playerStats.maxHealth) * 100} className="h-2" />
            </div>
            <p className="text-game-accent">Сила: {playerStats.power}</p>
            <p className="text-game-accent">Защита: {playerStats.defense}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {opponents.map((opponent) => (
          <Card 
            key={opponent.id}
            className={`p-4 bg-game-surface border-game-accent ${isPlayerTurn ? 'cursor-pointer hover:border-game-primary' : ''}`}
            onClick={() => isPlayerTurn && attackEnemy(opponent.id)}
          >
            <h3 className="text-lg font-bold text-game-accent mb-2">{opponent.name}</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-game-accent">Здоровье</span>
                  <span className="text-game-accent">{opponent.health}/{opponent.maxHealth}</span>
                </div>
                <Progress value={(opponent.health / opponent.maxHealth) * 100} className="h-2" />
              </div>
              <p className="text-game-accent">Сила: {opponent.power}</p>
              {opponent.isBoss && (
                <p className="text-red-500 font-bold">БОСС</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {!isPlayerTurn && opponents.length > 0 && (
        <div className="mt-4 text-center">
          <Button 
            onClick={handleOpponentAttack}
            className="bg-game-primary hover:bg-game-primary/80"
          >
            Ход противника
          </Button>
        </div>
      )}
    </div>
  );
};

export default Battle;