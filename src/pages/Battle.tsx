import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { Inventory } from "@/components/battle/Inventory";
import { useBattleState } from "@/hooks/useBattleState";
import { useCombat } from "@/hooks/useCombat";
import { useInventoryState } from "@/hooks/useInventoryState";

const Battle = () => {
  const navigate = useNavigate();
  const { inventory } = useInventoryState();
  const {
    level,
    playerStats,
    setPlayerStats,
    opponents,
    handleUseItem,
    handleNextLevel
  } = useBattleState();

  const { isPlayerTurn, attackEnemy, handleOpponentAttack } = useCombat({
    playerStats,
    setPlayerStats,
    opponents,
    level
  });

  useEffect(() => {
    const battleState = localStorage.getItem('battleState');
    if (!battleState) {
      navigate('/game');
    }
  }, [navigate]);

  if (!playerStats) return null;

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative p-4"
      style={{
        backgroundImage: 'url("/lovable-uploads/86b5334c-bb41-4222-9077-09521913b631.png")',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlayerCard stats={playerStats} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {opponents.map((opponent, index) => (
              <OpponentCard
                key={index}
                opponent={opponent}
                onAttack={() => attackEnemy(index)}
                isPlayerTurn={isPlayerTurn}
                currentLevel={level}
                playerHealth={playerStats.health}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Inventory 
            items={inventory}
            onUseItem={handleUseItem}
          />
        </div>
      </div>
    </div>
  );
};

export default Battle;