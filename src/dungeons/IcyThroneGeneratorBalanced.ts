import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const IcyThroneGeneratorBalanced = createBalancedGenerator({
  internalName: 'ice_throne',
  monsterNames: {
    monster: (level) => `Ледяной страж (Lv${level})`,
    miniboss: (level) => `Ледяной лорд (Lv${level})`,
    boss50: (level) => `Повелитель льда (Lv${level})`,
    boss100: (level) => `Ледяной император (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ?
      (monsterImagesByType.ice_guardian || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.ice_guardian_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.ice_lord || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.ice_emperor || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
