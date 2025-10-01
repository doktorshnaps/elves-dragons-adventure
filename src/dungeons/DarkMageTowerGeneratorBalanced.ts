import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const DarkMageTowerGeneratorBalanced = createBalancedGenerator({
  internalName: 'dark_mage',
  monsterNames: {
    monster: (level) => `Темный маг (Lv${level})`,
    miniboss: (level) => `Темный архимаг (Lv${level})`,
    boss50: (level) => `Мастер темных искусств (Lv${level})`,
    boss100: (level) => `Верховный темный маг (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ?
      (monsterImagesByType.dark_mage || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.dark_mage_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.dark_archmage || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.dark_master || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
