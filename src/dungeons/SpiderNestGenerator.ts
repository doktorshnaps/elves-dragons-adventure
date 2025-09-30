import { Opponent } from "@/types/battle";
import { monsterImagesByType } from "@/constants/monsterImages";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

interface LevelData {
  name: string;
  monsters: Array<{
    name: string;
    count: number;
    type: string;
    isBoss?: boolean;
  }>;
}

const SPIDER_NEST_DATA: Record<number, LevelData> = {
  1: {
    name: "Паучий Вход",
    monsters: [
      { name: "Паучок-скелет", count: 10, type: "skeleton_spider" }
    ]
  },
  2: {
    name: "Шелковые Туннели", 
    monsters: [
      { name: "Паук-скакун", count: 7, type: "jumper_spider" },
      { name: "Паук-прядильщик", count: 2, type: "spinner_spider" }
    ]
  },
  3: {
    name: "Коконный Зал",
    monsters: [
      { name: "Паук-охотник", count: 5, type: "hunter_spider" },
      { name: "Паук-прядильщик", count: 2, type: "spinner_spider" },
      { name: "Паук-королева-личинка", count: 1, type: "queen_larva", isBoss: true }
    ]
  },
  4: {
    name: "Пищевые Кладовые",
    monsters: [
      { name: "Паук-охотник", count: 4, type: "hunter_spider" },
      { name: "Паук-трупоед", count: 2, type: "corpse_eater" },
      { name: "Паук-стража", count: 1, type: "guardian_spider" }
    ]
  },
  5: {
    name: "Часовня Теней",
    monsters: [
      { name: "Паук-стража", count: 2, type: "guardian_spider" },
      { name: "Паук-виверна", count: 2, type: "wyvern_spider" },
      { name: "Теневой паук-ловец", count: 2, type: "shadow_catcher" }
    ]
  },
  6: {
    name: "Зараженные Гроты",
    monsters: [
      { name: "Теневой паук-ловец", count: 2, type: "shadow_catcher" },
      { name: "Паук-виверна", count: 1, type: "wyvern_spider" },
      { name: "Древний паук-отшельник", count: 1, type: "ancient_hermit" },
      { name: "Паук-берсерк", count: 1, type: "berserker_spider" }
    ]
  },
  7: {
    name: "Зеркальное Логово",
    monsters: [
      { name: "Паук-иллюзионист", count: 2, type: "illusionist_spider" },
      { name: "Паук-берсерк", count: 1, type: "berserker_spider" },
      { name: "Паук-мать-стража", count: 1, type: "mother_guardian", isBoss: true }
    ]
  },
  8: {
    name: "Скорбный Путь",
    monsters: [
      { name: "Паук-мать-стража", count: 1, type: "mother_guardian", isBoss: true },
      { name: "Паук-паразит", count: 1, type: "parasite_spider" },
      { name: "Паук-титан", count: 1, type: "titan_spider" }
    ]
  },
  9: {
    name: "Колыбель Ужаса",
    monsters: [
      { name: "Паук-титан", count: 1, type: "titan_spider" },
      { name: "Арахнидный Архимаг", count: 1, type: "arachnid_archmage", isBoss: true }
    ]
  },
  10: {
    name: "Трон Арахны",
    monsters: [
      { name: "Арахна, Мать-Прародительница", count: 1, type: "arachne_mother", isBoss: true }
    ]
  }
};

const createMonsterByType = (type: string, id: number, level: number): Opponent => {
  const { stats, enemyType } = getFinalEnemyStats("spider_nest", level);

  switch (type) {
    case "skeleton_spider":
      return {
        id,
        name: "Паучок-скелет",
        health: Math.floor(stats.health * 0.6),
        maxHealth: Math.floor(stats.health * 0.6),
        power: Math.floor(stats.power * 0.7),
        isBoss: false,
        image: monsterImagesByType.skeleton_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "jumper_spider":
      return {
        id,
        name: "Паук-скакун",
        health: Math.floor(stats.health * 0.8),
        maxHealth: Math.floor(stats.health * 0.8),
        power: Math.floor(stats.power * 0.9),
        isBoss: false,
        image: monsterImagesByType.jumper_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "spinner_spider":
      return {
        id,
        name: "Паук-прядильщик",
        health: Math.floor(stats.health * 0.7),
        maxHealth: Math.floor(stats.health * 0.7),
        power: Math.floor(stats.power * 0.8),
        isBoss: false,
        image: monsterImagesByType.spinner_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'slow_attack',
            cooldown: 4,
            currentCooldown: 0,
            value: 2
          }
        ]
      };

    case "hunter_spider":
      return {
        id,
        name: "Паук-охотник",
        health: stats.health,
        maxHealth: stats.health,
        power: stats.power,
        isBoss: false,
        image: monsterImagesByType.hunter_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "queen_larva":
      return {
        id,
        name: "Паук-королева-личинка",
        health: Math.floor(stats.health * 1.5),
        maxHealth: Math.floor(stats.health * 1.5),
        power: Math.floor(stats.power * 1.2),
        isBoss: true,
        image: monsterImagesByType.queen_larva || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "corpse_eater":
      return {
        id,
        name: "Паук-трупоед",
        health: Math.floor(stats.health * 0.9),
        maxHealth: Math.floor(stats.health * 0.9),
        power: Math.floor(stats.power * 0.8),
        isBoss: false,
        image: monsterImagesByType.corpse_eater || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'corpse_feed',
            cooldown: 5,
            currentCooldown: 0,
            value: Math.floor(stats.health * 0.2)
          }
        ]
      };

    case "guardian_spider":
      return {
        id,
        name: "Паук-стража",
        health: Math.floor(stats.health * 1.3),
        maxHealth: Math.floor(stats.health * 1.3),
        power: Math.floor(stats.power * 1.1),
        isBoss: false,
        image: monsterImagesByType.guardian_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "wyvern_spider":
      return {
        id,
        name: "Паук-виверна",
        health: Math.floor(stats.health * 1.2),
        maxHealth: Math.floor(stats.health * 1.2),
        power: Math.floor(stats.power * 1.3),
        isBoss: false,
        image: monsterImagesByType.wyvern_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "shadow_catcher":
      return {
        id,
        name: "Теневой паук-ловец",
        health: Math.floor(stats.health * 1.1),
        maxHealth: Math.floor(stats.health * 1.1),
        power: Math.floor(stats.power * 1.2),
        isBoss: false,
        image: monsterImagesByType.shadow_catcher || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'invisibility',
            cooldown: 6,
            currentCooldown: 0,
            value: 3
          }
        ]
      };

    case "ancient_hermit":
      return {
        id,
        name: "Древний паук-отшельник",
        health: Math.floor(stats.health * 1.4),
        maxHealth: Math.floor(stats.health * 1.4),
        power: Math.floor(stats.power * 1.1),
        isBoss: false,
        image: monsterImagesByType.ancient_hermit || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "berserker_spider":
      return {
        id,
        name: "Паук-берсерк",
        health: Math.floor(stats.health * 1.2),
        maxHealth: Math.floor(stats.health * 1.2),
        power: Math.floor(stats.power * 1.4),
        isBoss: false,
        image: monsterImagesByType.berserker_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "illusionist_spider":
      return {
        id,
        name: "Паук-иллюзионист",
        health: Math.floor(stats.health * 1.1),
        maxHealth: Math.floor(stats.health * 1.1),
        power: Math.floor(stats.power * 1.2),
        isBoss: false,
        image: monsterImagesByType.illusionist_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'illusion',
            cooldown: 7,
            currentCooldown: 0,
            value: 1
          }
        ]
      };

    case "mother_guardian":
      return {
        id,
        name: "Паук-мать-стража",
        health: Math.floor(stats.health * 1.8),
        maxHealth: Math.floor(stats.health * 1.8),
        power: Math.floor(stats.power * 1.3),
        isBoss: true,
        image: monsterImagesByType.mother_guardian || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'summon',
            cooldown: 8,
            currentCooldown: 0,
            value: 1
          }
        ]
      };

    case "parasite_spider":
      return {
        id,
        name: "Паук-паразит",
        health: Math.floor(stats.health * 1.3),
        maxHealth: Math.floor(stats.health * 1.3),
        power: Math.floor(stats.power * 1.1),
        isBoss: false,
        image: monsterImagesByType.parasite_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'lifesteal',
            cooldown: 0,
            currentCooldown: 0,
            value: 0.3
          }
        ]
      };

    case "titan_spider":
      return {
        id,
        name: "Паук-титан",
        health: Math.floor(stats.health * 2.2),
        maxHealth: Math.floor(stats.health * 2.2),
        power: Math.floor(stats.power * 1.5),
        isBoss: false,
        image: monsterImagesByType.titan_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };

    case "arachnid_archmage":
      return {
        id,
        name: "Арахнидный Архимаг",
        health: Math.floor(stats.health * 2.5),
        maxHealth: Math.floor(stats.health * 2.5),
        power: Math.floor(stats.power * 1.6),
        isBoss: true,
        image: monsterImagesByType.arachnid_archmage || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'dark_magic',
            cooldown: 5,
            currentCooldown: 0,
            value: Math.floor(stats.power * 0.8)
          }
        ]
      };

    case "arachne_mother":
      return {
        id,
        name: "Арахна, Мать-Прародительница",
        health: Math.floor(stats.health * 4.0),
        maxHealth: Math.floor(stats.health * 4.0),
        power: Math.floor(stats.power * 2.0),
        isBoss: true,
        image: monsterImagesByType.arachne_mother || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png",
        specialAbilities: [
          {
            type: 'summon',
            cooldown: 6,
            currentCooldown: 0,
            value: 2
          },
          {
            type: 'curse',
            cooldown: 8,
            currentCooldown: 0,
            value: 4
          }
        ]
      };

    default:
      return {
        id,
        name: "Неизвестный монстр",
        health: stats.health,
        maxHealth: stats.health,
        power: stats.power,
        isBoss: false,
        image: "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
      };
  }
};

export const SpiderNestGenerator = (level: number): Opponent[] => {
  // Простая логика для уровней 1-10
  const levelData = SPIDER_NEST_DATA[Math.min(level, 10)];
  
  if (!levelData) {
    // Если уровень больше 10, генерируем базового врага
    const { stats, enemyType } = getFinalEnemyStats("spider_nest", level);
    return [{
      id: 1,
      name: enemyType === 'boss' ? "Гигантский Паук-Босс" : "Гигантский Паук",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: enemyType === 'boss',
      image: "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
    }];
  }

  const opponents: Opponent[] = [];
  let currentId = 1;

  // Генерируем монстров согласно данным уровня
  for (const monsterData of levelData.monsters) {
    for (let i = 0; i < monsterData.count; i++) {
      const monster = createMonsterByType(monsterData.type, currentId++, level);
      opponents.push(monster);
    }
  }

  return opponents;
};