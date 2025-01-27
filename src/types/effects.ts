export type EffectType = 'poison' | 'burn' | 'heal' | 'strength' | 'defense';
export type EffectTarget = 'player' | 'opponent';

export interface Effect {
  id: string;
  type: EffectType;
  value: number;
  duration: number;
  remaining: number;
  target: EffectTarget;
  icon: string;
}