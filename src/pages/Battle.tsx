import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBattleState } from '@/hooks/useBattleState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import { TeamCardDisplay } from '@/components/game/battle/TeamCardDisplay';
import { AbilityMenu } from '@/components/game/battle/AbilityMenu';

export const Battle = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  const {
    playerStats,
    opponents,
    isPlayerTurn,
    attackEnemy,
    handleNextLevel,
    // Система способностей
    enhancedTeamCards,
    selectedCard,
    selectedAbility,
    showAbilityMenu,
    selectCardForAbility,
    selectAbility,
    useAbilityOnTarget,
    cancelAbility
  } = useBattleState(level);

  if (!playerStats || !opponents) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 relative">
      {/* Меню способностей */}
      {showAbilityMenu && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <AbilityMenu
            card={selectedCard}
            abilities={selectedCard.abilities}
            onSelectAbility={selectAbility}
            onCancel={cancelAbility}
          />
        </div>
      )}

      {/* Информация о выбранной способности */}
      {selectedAbility && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400 rounded-lg">
          <p className="text-blue-400 font-medium">
            Выбрана способность: {selectedAbility.name}
          </p>
          <p className="text-sm text-game-text">
            {selectedAbility.description}. Выберите цель для применения.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={cancelAbility}
            className="mt-2"
          >
            Отмена
          </Button>
        </div>
      )}

      {/* Статистики игрока */}
      <div className="mb-8">
        <Card 
          className={`p-4 bg-game-surface border-game-accent ${
            selectedAbility?.targetType === 'ally' ? 'cursor-pointer ring-2 ring-green-400 hover:border-game-primary' : ''
          }`}
          onClick={() => {
            if (selectedAbility?.targetType === 'ally') {
              useAbilityOnTarget(0); // 0 - специальный ID для игрока
            }
          }}
        >
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
            {selectedAbility?.targetType === 'ally' && (
              <p className="text-green-400 text-sm">🎯 Цель лечения</p>
            )}
          </div>
        </Card>
      </div>

      {/* Команда игрока */}
      {enhancedTeamCards.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-game-accent mb-4">Команда</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {enhancedTeamCards.map((card) => (
              <TeamCardDisplay
                key={card.id}
                card={card}
                onClick={() => selectCardForAbility(card)}
                isSelected={selectedCard?.id === card.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Противники */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {opponents.map((opponent) => {
          const handleClick = () => {
            if (selectedAbility) {
              // Используем способность на противника
              if (selectedAbility.targetType === 'enemy') {
                useAbilityOnTarget(opponent.id);
              }
            } else if (isPlayerTurn) {
              // Обычная атака
              attackEnemy(opponent.id);
            }
          };

          return (
            <Card 
              key={opponent.id}
              className={`p-4 bg-game-surface border-game-accent ${
                (isPlayerTurn || selectedAbility?.targetType === 'enemy') 
                  ? 'cursor-pointer hover:border-game-primary' 
                  : ''
              } ${
                selectedAbility?.targetType === 'enemy' 
                  ? 'ring-2 ring-red-400' 
                  : ''
              }`}
              onClick={handleClick}
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
                {selectedAbility?.targetType === 'enemy' && (
                  <p className="text-red-400 text-sm">🎯 Цель способности</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        {opponents.length === 0 && playerStats.health > 0 && (
          <Button
            onClick={handleNextLevel}
            className="bg-game-accent hover:bg-game-accent/80 flex items-center"
          >
            Следующий уровень
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Battle;