import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const BlackDragonLairBalanced = createBalancedGenerator({
  internalName: 'dragon_lair',
  monsterNames: {
    monster: (level) => `Черный дракон (Lv${level})`,
    miniboss: (level) => `Темный дракон-лорд (Lv${level})`,
    boss50: (level) => `Повелитель черных драконов (Lv${level})`,
    boss100: (level) => `Древний черный дракон (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ?
      (monsterImagesByType.black_dragon || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.black_dragon_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.dark_dragon_lord || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.ancient_black_dragon || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
