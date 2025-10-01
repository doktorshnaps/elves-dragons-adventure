import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const SeaSerpentLairGeneratorBalanced = createBalancedGenerator({
  internalName: 'sea_serpent',
  monsterNames: {
    monster: (level) => `Морской змей (Lv${level})`,
    miniboss: (level) => `Гигантский морской змей (Lv${level})`,
    boss50: (level) => `Повелитель морских змеев (Lv${level})`,
    boss100: (level) => `Древний левиафан (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ?
      (monsterImagesByType.sea_serpent || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.sea_serpent_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.giant_serpent || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.leviathan || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
