import { Button } from "@/components/ui/button";
import { AdventureGame } from "../game/AdventureGame";
import { Monster } from "../types";

interface GameContentProps {
  currentMonster: Monster | null;
  onMonsterDefeat: (monster: Monster) => void;
  playerStats: {
    health: number;
    power: number;
    level: number;
    experience: number;
    requiredExperience: number;
    maxHealth: number;
  };
  onStartAdventure: () => void;
}

export const GameContent = ({ 
  currentMonster, 
  onMonsterDefeat, 
  playerStats,
  onStartAdventure 
}: GameContentProps) => {
  return (
    <div className="space-y-4">
      {!currentMonster ? (
        <Button 
          className="w-full bg-game-accent hover:bg-game-accent/90"
          onClick={onStartAdventure}
          disabled={playerStats.health <= 0}
        >
          {playerStats.health <= 0 ? "Герой мертв" : "Начать приключение"}
        </Button>
      ) : (
        <AdventureGame
          onMonsterDefeat={onMonsterDefeat}
          playerHealth={playerStats.health}
          playerPower={playerStats.power}
          currentMonster={currentMonster}
          playerLevel={playerStats.level}
          playerExperience={playerStats.experience}
          requiredExperience={playerStats.requiredExperience}
          maxHealth={playerStats.maxHealth}
        />
      )}
    </div>
  );
};