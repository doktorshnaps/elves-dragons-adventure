import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { LevelUpDialog } from "@/components/battle/LevelUpDialog";
import { generateOpponents } from "@/utils/opponentGenerator";
import { updateQuestProgress } from "@/utils/questUtils";
import { ArrowLeft } from "lucide-react";
import { useInventoryState } from "@/hooks/useInventoryState";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { inventory } = useInventoryState();
  
  const savedState = localStorage.getItem('battleState');
  const savedLevel = savedState ? JSON.parse(savedState).currentDungeonLevel : 1;
  
  const [currentDungeonLevel, setCurrentDungeonLevel] = useState(savedLevel);
  const [opponents, setOpponents] = useState(() => generateOpponents(currentDungeonLevel));
  const [playerStats, setPlayerStats] = useState(() => {
    if (savedState) {
      return JSON.parse(savedState).playerStats;
    }
    return null;
  });
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (playerStats) {
      const battleState = {
        playerStats,
        currentDungeonLevel,
      };
      localStorage.setItem('battleState', JSON.stringify(battleState));
    }
  }, [playerStats, currentDungeonLevel]);

  const attackEnemy = (opponentId: number) => {
    if (!isPlayerTurn || !playerStats || playerStats.health <= 0) return;

    const updatedOpponents = opponents.map(opponent => {
      if (opponent.id === opponentId) {
        const newHealth = Math.max(0, opponent.health - playerStats.attack);
        if (newHealth === 0) {
          // Update quest progress for defeating enemies
          const defeatedEnemiesQuest = "daily-1";
          const currentProgress = Number(localStorage.getItem(defeatedEnemiesQuest) || "0");
          const newProgress = currentProgress + 1;
          localStorage.setItem(defeatedEnemiesQuest, String(newProgress));
          updateQuestProgress(defeatedEnemiesQuest, newProgress);
        }
        return { ...opponent, health: newHealth };
      }
      return opponent;
    });

    setOpponents(updatedOpponents);
    setIsPlayerTurn(false);

    // Check if level completed
    if (updatedOpponents.every(opponent => opponent.health === 0)) {
      const newLevel = currentDungeonLevel + 1;
      setCurrentDungeonLevel(newLevel);
      
      // Update quest progress for completing levels
      const completeLevelsQuest = "weekly-1";
      const currentProgress = Number(localStorage.getItem(completeLevelsQuest) || "0");
      const newProgress = currentProgress + 1;
      localStorage.setItem(completeLevelsQuest, String(newProgress));
      updateQuestProgress(completeLevelsQuest, newProgress);

      setOpponents(generateOpponents(newLevel));
      setShowLevelUp(true);
      setIsPlayerTurn(true);
      return;
    }

    // Enemy turn
    setTimeout(() => {
      if (playerStats) {
        const newHealth = Math.max(0, playerStats.health - 10);
        setPlayerStats({ ...playerStats, health: newHealth });
      }
      setIsPlayerTurn(true);
    }, 1000);
  };

  return (
    <div className={`flex flex-col items-center ${isMobile ? 'p-2' : 'p-6'}`}>
      <Button onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft /> Назад
      </Button>
      <div className="flex flex-col w-full max-w-2xl">
        {opponents.map(opponent => (
          <OpponentCard 
            key={opponent.id} 
            opponent={opponent} 
            onAttack={() => {}} 
            isPlayerTurn={isPlayerTurn}
            currentLevel={currentDungeonLevel}
            playerHealth={playerStats?.health ?? 0}
          />
        ))}
        {playerStats && <PlayerCard playerStats={playerStats} />}
        <InventoryDisplay inventory={inventory} />
        {showLevelUp && (
          <LevelUpDialog 
            isOpen={showLevelUp}
            onUpgradeSelect={(upgrade) => {
              // Handle upgrade selection
              setShowLevelUp(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Battle;
