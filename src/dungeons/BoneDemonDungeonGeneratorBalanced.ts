import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const BoneDemonDungeonGeneratorBalanced = createBalancedGenerator({
  internalName: 'bone_dungeon',
  monsterNames: {
    monster: (level) => `Костяной демон (Lv${level})`,
    miniboss: (level) => `Костяной лорд (Lv${level})`,
    boss50: (level) => `Костяной король (Lv${level})`,
    boss100: (level) => `Повелитель костей (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => level <= 50 ? 
      (monsterImagesByType.bone_demon || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png") :
      (monsterImagesByType.bone_demon_elite || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"),
    miniboss: () => monsterImagesByType.bone_lord || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.bone_king || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
