import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const PantheonOfGodsGeneratorBalanced = createBalancedGenerator({
  internalName: 'pantheon_gods',
  monsterNames: {
    monster: (level) => `Страж богов (Lv${level})`,
    miniboss: (level) => `Полубог (Lv${level})`,
    boss50: (level) => `Божественный страж (Lv${level})`,
    boss100: (level) => `Верховный бог (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ?
      (monsterImagesByType.god_guardian || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.god_guardian_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.demigod || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.supreme_god || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
