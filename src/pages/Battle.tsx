import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBattleState } from "@/hooks/useBattleState";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useOpponentsState } from "@/hooks/useOpponentsState";
import { useCombat } from "@/hooks/useCombat";
import { useEffects } from "@/hooks/useEffects";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { EffectsDisplay } from "@/components/battle/EffectsDisplay";
import { Inventory } from "@/components/battle/Inventory";
import { DamageNumber, AttackSwing } from "@/components/battle/CombatAnimations";
import { EffectIndicator } from "@/components/effects/EffectAnimation";
import { backgrounds } from "@/assets/dungeons";

const Battle = () => {
  const navigate = useNavigate();
  const { player } = usePlayerState();
  const { opponents } = useOpponentsState();
  const { battleState, setBattleState } = useBattleState();
  const { combat } = useCombat();
  const { effects } = useEffects();

  useEffect(() => {
    if (!player) {
      navigate("/");
    }
  }, [player, navigate]);

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
        <PlayerCard player={player} />
        {opponents.map(opponent => (
          <OpponentCard key={opponent.id} opponent={opponent} />
        ))}
        <EffectsDisplay effects={effects} />
        <Inventory />
        <DamageNumber />
        <AttackSwing />
      </div>
    </div>
  );
};

export default Battle;
