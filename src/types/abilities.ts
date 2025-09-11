export type AbilityType = 'damage' | 'heal' | 'buff' | 'debuff';
export type TargetType = 'enemy' | 'ally' | 'self';

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  targetType: TargetType;
  manaCost: number;
  power: number; // Урон для атак или количество исцеления
  cooldown?: number;
  currentCooldown?: number;
}

export interface HeroAbilities {
  heroName: string;
  abilities: Ability[];
}

// Предопределенные способности для героев
export const HERO_ABILITIES: Record<string, Ability[]> = {
  "Маг": [
    {
      id: "fireball",
      name: "Огненный шар",
      description: "Наносит 10 единиц урона огнем",
      type: "damage",
      targetType: "enemy",
      manaCost: 8,
      power: 10
    }
  ],
  "Мастер Целитель": [
    {
      id: "holy_heal",
      name: "Святое исцеление",
      description: "Восстанавливает 7 очков здоровья",
      type: "heal",
      targetType: "ally",
      manaCost: 8,
      power: 7
    }
  ]
};