import { PlayerCards } from "@/components/battle/PlayerCards";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { Inventory } from "@/components/battle/Inventory";
import { LevelUpDialog } from "@/components/battle/LevelUpDialog";
import { useBattleState } from "@/hooks/useBattleState";
import { ExitDungeonButton } from "@/components/battle/ExitDungeonButton";

const Battle = () => {
  const {
    level,
    coins,
    isPlayerTurn,
    playerStats,
    opponents,
    inventory,
    showLevelUp,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    handleUpgrade
  } = useBattleState();

  return (
    <div className="min-h-screen bg-game-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-game-accent">Уровень {level}</h1>
          <div className="flex items-center gap-4">
            <p className="text-xl text-game-accent">Монеты: {coins}</p>
            <ExitDungeonButton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <PlayerCards stats={playerStats} isPlayerTurn={isPlayerTurn} onAttack={attackEnemy} />
            <Inventory items={inventory} onUseItem={useItem} />
          </div>
          
          <div className="space-y-4">
            {opponents.map((opponent) => (
              <OpponentCard
                key={opponent.id}
                opponent={opponent}
                onAttack={() => attackEnemy(opponent.id)}
                isPlayerTurn={isPlayerTurn}
              />
            ))}
          </div>
        </div>

        <LevelUpDialog 
          isOpen={showLevelUp} 
          onUpgradeSelect={handleUpgrade} 
        />
      </div>
    </div>
  );
};

export default Battle;