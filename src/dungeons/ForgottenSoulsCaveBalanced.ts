import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const ForgottenSoulsCaveBalanced = createBalancedGenerator({
  internalName: 'forgotten_souls',
  monsterNames: {
    monster: (level) => `Забытая душа (Lv${level})`,
    miniboss: (level) => `Мучительная душа (Lv${level})`,
    boss50: (level) => `Хранитель забытых душ (Lv${level})`,
    boss100: (level) => `Повелитель забытых душ (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ?
      (monsterImagesByType.forgotten_soul || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.forgotten_soul_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.tormented_soul || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.soul_keeper || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
