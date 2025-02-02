import { PlayerStats } from "@/types/battle";
import { HealthBar } from "./HealthBar";
import { CombatStats } from "./CombatStats";
import { ExperienceBar } from "./ExperienceBar";
import { getRequiredExperience } from "@/data/experienceTable";

interface PlayerStatsSectionProps {
  playerStats: PlayerStats;
}

export const PlayerStatsSection = ({ playerStats }: PlayerStatsSectionProps) => {
  const requiredExp = getRequiredExperience(playerStats.level);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent">Характеристики игрока</h3>
      <div className="text-sm text-game-accent mb-2">
        Уровень: {playerStats.level}
      </div>
      <ExperienceBar 
        experience={playerStats.experience} 
        requiredExperience={requiredExp}
      />
      <HealthBar health={playerStats.health} maxHealth={playerStats.maxHealth} />
      <CombatStats power={playerStats.power} defense={playerStats.defense} />
    </div>
  );
};