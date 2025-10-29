import { createBalancedGenerator } from './createBalancedGenerator';
import { monsterImagesByType } from '@/constants/monsterImages';

export const SpiderNestGeneratorBalanced = createBalancedGenerator({
  internalName: 'spider_nest',
  monsterNames: {
    monster: (level) => {
      if (level <= 10) return `Паучок-скелет (Lv${level})`;
      if (level <= 20) return `Паук-охотник (Lv${level})`;
      if (level <= 30) return `Паук-берсерк (Lv${level})`;
      if (level <= 40) return `Теневой паук (Lv${level})`;
      if (level <= 50) return `Древний паук (Lv${level})`;
      if (level <= 60) return `Паук-титан (Lv${level})`;
      if (level <= 70) return `Ядовитый паук (Lv${level})`;
      if (level <= 80) return `Паук-некромант (Lv${level})`;
      if (level <= 90) return `Паук-архимаг (Lv${level})`;
      return `Легендарный паук (Lv${level})`;
    },
    miniboss: (level) => `Гигантский Паук-Страж (Lv${level})`,
    boss50: (level) => `Королева Пауков (Lv${level})`,
    boss100: (level) => `Арахна Прародительница (Lv${level})`,
  },
  monsterImages: {
    monster: (level) => {
      if (level <= 10) return monsterImagesByType.skeleton_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 20) return monsterImagesByType.hunter_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 30) return monsterImagesByType.berserker_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 40) return monsterImagesByType.shadow_catcher || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 50) return monsterImagesByType.ancient_hermit || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 60) return monsterImagesByType.titan_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 70) return monsterImagesByType.corpse_eater || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 80) return monsterImagesByType.guardian_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      if (level <= 90) return monsterImagesByType.arachnid_archmage || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
      return monsterImagesByType.arachnid_archmage || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
    },
    miniboss: () => monsterImagesByType.mother_guardian || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
    boss: () => monsterImagesByType.arachne_mother || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
  },
});
