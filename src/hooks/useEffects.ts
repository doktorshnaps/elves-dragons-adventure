import { useState } from 'react';
import { Effect, EffectType, EffectTarget } from '@/types/effects';
import { useToast } from '@/hooks/use-toast';
import { Shield, Flame, Heart, Swords, Skull, LucideIcon } from 'lucide-react';

const getEffectIcon = (type: EffectType): LucideIcon => {
  switch (type) {
    case 'defense':
      return Shield;
    case 'burn':
      return Flame;
    case 'heal':
      return Heart;
    case 'strength':
      return Swords;
    case 'poison':
      return Skull;
    default:
      return Shield;
  }
};

export const useEffects = (initial: Effect[] = []) => {
  const [effects, setEffects] = useState<Effect[]>(initial);
  const { toast } = useToast();

  const addEffect = (newEffect: Omit<Effect, 'id' | 'remaining' | 'icon'>) => {
    const effectIcon = getEffectIcon(newEffect.type);
    
    setEffects(prev => [
      ...prev,
      {
        ...newEffect,
        id: Math.random().toString(36).substr(2, 9),
        remaining: newEffect.duration,
        icon: effectIcon
      }
    ]);

    toast({
      title: "Новый эффект",
      description: `${newEffect.type} применён к ${newEffect.target === 'player' ? 'игроку' : 'противнику'}`,
      duration: 2000
    });
  };

  const tickEffects = () => {
    setEffects(prev => {
      const updatedEffects = prev
        .map(e => ({ ...e, remaining: e.remaining - 1 }))
        .filter(e => e.remaining > 0);
      
      // Уведомляем об истекших эффектах
      prev.forEach(effect => {
        if (effect.remaining === 1) {
          toast({
            title: "Эффект закончился",
            description: `${effect.type} больше не действует на ${effect.target === 'player' ? 'игрока' : 'противника'}`,
            duration: 2000
          });
        }
      });
      
      return updatedEffects;
    });
  };

  const getActiveEffects = (targetType: EffectTarget) => 
    effects.filter(e => e.target === targetType);

  const calculateEffectValue = (type: EffectType, targetType: EffectTarget): number => {
    return effects
      .filter(e => e.type === type && e.target === targetType)
      .reduce((total, effect) => total + effect.value, 0);
  };

  const clearEffects = () => {
    setEffects([]);
  };

  const removeEffect = (effectId: string) => {
    setEffects(prev => prev.filter(e => e.id !== effectId));
  };

  return {
    effects,
    addEffect,
    tickEffects,
    getActiveEffects,
    calculateEffectValue,
    clearEffects,
    removeEffect
  };
};