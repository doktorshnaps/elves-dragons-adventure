import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";

interface CardHealthBarProps {
  currentHealth: number;
  maxHealth: number;
  size?: 'small' | 'medium' | 'large';
}

export const CardHealthBar = ({ currentHealth, maxHealth, size = 'medium' }: CardHealthBarProps) => {
  // Ensure we have valid health values
  const validCurrentHealth = Math.max(0, Math.min(currentHealth || 0, maxHealth));
  const validMaxHealth = Math.max(1, maxHealth); // Prevent division by zero
  
  const healthPercentage = (validCurrentHealth / validMaxHealth) * 100;
  const isLowHealth = healthPercentage <= 25;
  const isCritical = healthPercentage <= 10;
  
  const sizeClasses = {
    small: {
      container: 'h-1',
      icon: 'w-2 h-2',
      text: 'text-[8px]'
    },
    medium: {
      container: 'h-1.5',
      icon: 'w-3 h-3', 
      text: 'text-[10px]'
    },
    large: {
      container: 'h-2',
      icon: 'w-4 h-4',
      text: 'text-xs'
    }
  };

  const classes = sizeClasses[size];
  
  return (
    <div className="w-full space-y-0.5">
      <div className="flex items-center justify-between">
        <Heart 
          className={`${classes.icon} ${
            isCritical ? 'text-red-600' : 
            isLowHealth ? 'text-red-500' : 
            'text-game-accent'
          }`} 
        />
        <span className={`${classes.text} text-game-accent font-medium`}>
          {Math.floor(validCurrentHealth)}/{validMaxHealth}
        </span>
      </div>
      <Progress 
        value={healthPercentage} 
        className={classes.container}
        indicatorClassName={`transition-all duration-300 ${
          isCritical ? 'bg-red-600' :
          isLowHealth ? 'bg-red-500' :
          healthPercentage <= 50 ? 'bg-yellow-500' :
          'bg-green-500'
        }`}
      />
    </div>
  );
};