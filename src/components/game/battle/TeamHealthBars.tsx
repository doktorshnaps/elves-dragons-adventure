import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Heart } from 'lucide-react';
import { TeamPair } from '@/types/teamBattle';

interface TeamHealthBarsProps {
  pair: TeamPair;
}

export const TeamHealthBars: React.FC<TeamHealthBarsProps> = ({ pair }) => {
  const heroMaxHealth = pair.hero?.health ?? 0;
  const dragonMaxHealth = pair.dragon?.health ?? 0;

  // Base current values from cards if present
  let heroCurrent = pair.hero?.currentHealth ?? heroMaxHealth;
  let dragonCurrent = pair.dragon?.currentHealth ?? dragonMaxHealth;

  // If pair aggregate health doesn't match sum of parts or parts are missing, derive using "dragon first" rule
  const totalCurrentFromPair = typeof pair.health === 'number' ? pair.health : heroCurrent + dragonCurrent;
  const sumParts = heroCurrent + (pair.dragon ? dragonCurrent : 0);
  const needDerive = (pair.dragon ? sumParts !== totalCurrentFromPair : heroCurrent !== totalCurrentFromPair);

  if (needDerive) {
    if (pair.dragon) {
      const remaining = Math.max(0, Math.min(totalCurrentFromPair, heroMaxHealth + dragonMaxHealth));
      dragonCurrent = Math.min(dragonMaxHealth, remaining);
      heroCurrent = Math.min(heroMaxHealth, Math.max(0, remaining - dragonCurrent));
    } else {
      heroCurrent = Math.max(0, Math.min(totalCurrentFromPair, heroMaxHealth));
    }
  }

  return (
    <div className="space-y-2">
      {/* Hero Health Bar */}
      <div className="flex items-center gap-2 text-sm">
        <Heart className="w-4 h-4 text-red-500" />
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span>{pair.hero.name}</span>
            <span>{heroCurrent}/{heroMaxHealth}</span>
          </div>
          <Progress 
            value={heroMaxHealth > 0 ? (heroCurrent / heroMaxHealth) * 100 : 0} 
            className="h-2" 
          />
        </div>
      </div>

      {/* Dragon Health Bar */}
      {pair.dragon && (
        <div className="flex items-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-orange-500" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span>{pair.dragon.name}</span>
              <span>{dragonCurrent}/{dragonMaxHealth}</span>
            </div>
            <Progress 
              value={dragonMaxHealth > 0 ? (dragonCurrent / dragonMaxHealth) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </div>
      )}
    </div>
  );
};