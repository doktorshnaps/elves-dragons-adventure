import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Heart } from 'lucide-react';
import { TeamPair } from '@/types/teamBattle';

interface TeamHealthBarsProps {
  pair: TeamPair;
}

export const TeamHealthBars: React.FC<TeamHealthBarsProps> = ({ pair }) => {
  const heroCurrentHealth = pair.hero?.currentHealth ?? pair.hero?.health ?? 0;
  const heroMaxHealth = pair.hero?.health ?? 0;
  const dragonCurrentHealth = pair.dragon?.currentHealth ?? pair.dragon?.health ?? 0;
  const dragonMaxHealth = pair.dragon?.health ?? 0;

  return (
    <div className="space-y-2">
      {/* Hero Health Bar */}
      <div className="flex items-center gap-2 text-sm">
        <Heart className="w-4 h-4 text-red-500" />
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span>{pair.hero.name}</span>
            <span>{heroCurrentHealth}/{heroMaxHealth}</span>
          </div>
          <Progress 
            value={heroMaxHealth > 0 ? (heroCurrentHealth / heroMaxHealth) * 100 : 0} 
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
              <span>{dragonCurrentHealth}/{dragonMaxHealth}</span>
            </div>
            <Progress 
              value={dragonMaxHealth > 0 ? (dragonCurrentHealth / dragonMaxHealth) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </div>
      )}
    </div>
  );
};