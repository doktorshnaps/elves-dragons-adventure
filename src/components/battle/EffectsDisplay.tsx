import React from 'react';
import { Effect } from '@/types/effects';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EffectsDisplayProps {
  effects: Effect[];
}

export const EffectsDisplay = ({ effects }: EffectsDisplayProps) => {
  if (effects.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {effects.map((effect) => (
        <TooltipProvider key={effect.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-2 bg-game-surface border-game-accent hover:border-game-primary transition-colors cursor-help">
                <div className="flex items-center gap-2">
                  {React.createElement(effect.icon, {
                    className: 'w-4 h-4 text-game-accent'
                  })}
                  <span className="text-xs text-game-accent">{effect.remaining}</span>
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-bold capitalize">{effect.type}</p>
                <p>Значение: {effect.value}</p>
                <p>Осталось ходов: {effect.remaining}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};