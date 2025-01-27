import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBattleState } from "@/hooks/useBattleState";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { EffectsDisplay } from "@/components/battle/EffectsDisplay";
import { Inventory } from "@/components/battle/Inventory";
import { DamageNumber, AttackSwing } from "@/components/battle/CombatAnimations";
import { backgrounds } from "@/assets/dungeons";

const Battle = () => {
  const navigate = useNavigate();
  const {
    level,
    playerStats,
    opponents,
    inventory,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    handleUseItem
  } = useBattleState();

  useEffect(() => {
    if (!playerStats) {
      navigate("/");
    }
  }, [playerStats, navigate]);

  return (
    <div 
      className="min-h-screen bg-game-background relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgrounds.game})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative z-10 container mx-auto p-4">
        <PlayerCard playerStats={playerStats} />
        {opponents.map(opponent => (
          <OpponentCard 
            key={opponent.id} 
            opponent={opponent}
            onAttack={attackEnemy}
            isPlayerTurn={isPlayerTurn}
            currentLevel={level}
            playerHealth={playerStats?.health || 0}
          />
        ))}
        <EffectsDisplay effects={[]} />
        <Inventory 
          items={inventory} 
          onUseItem={handleUseItem}
        />
        <DamageNumber value={0} />
        <AttackSwing active={false} />
      </div>
    </div>
  );
};

export default Battle;