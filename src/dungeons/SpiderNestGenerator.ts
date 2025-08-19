import { Opponent } from "@/types/battle";

interface MonsterData {
  name: string;
  count: number;
  type: string;
  isBoss?: boolean;
}

interface LevelData {
  name: string;
  monsters: MonsterData[];
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
  const baseHealth = 60 + (level - 1) * 30;
  const basePower = 7 + (level - 1) * 3.5;

  switch (type) {
    case "skeleton_spider":
      return {
        id,
        name: "Паучок-скелет",
        health: Math.floor(baseHealth * 0.6),
        maxHealth: Math.floor(baseHealth * 0.6),
        power: Math.floor(basePower * 0.7),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'lifesteal', value: 10 }]
      };

    case "jumper_spider":
      return {
        id,
        name: "Паук-скакун",
        health: Math.floor(baseHealth * 0.8),
        maxHealth: Math.floor(baseHealth * 0.8),
        power: Math.floor(basePower * 0.9),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "spinner_spider":
      return {
        id,
        name: "Паук-прядильщик",
        health: Math.floor(baseHealth * 0.7),
        maxHealth: Math.floor(baseHealth * 0.7),
        power: Math.floor(basePower * 0.8),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'slow_attack', value: 2 }]
      };

    case "hunter_spider":
      return {
        id,
        name: "Паук-охотник",
        health: baseHealth,
        maxHealth: baseHealth,
        power: basePower,
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'poison_bite', value: 2 }]
      };

    case "queen_larva":
      return {
        id,
        name: "Паук-королева-личинка",
        health: Math.floor(baseHealth * 1.5),
        maxHealth: Math.floor(baseHealth * 1.5),
        power: Math.floor(basePower * 1.2),
        isBoss: true,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'summon', cooldown: 4, currentCooldown: 0 }]
      };

    case "corpse_eater":
      return {
        id,
        name: "Паук-трупоед",
        health: Math.floor(baseHealth * 0.9),
        maxHealth: Math.floor(baseHealth * 0.9),
        power: Math.floor(basePower * 0.8),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'corpse_feed', cooldown: 2, currentCooldown: 0, value: 20 }]
      };

    case "guardian_spider":
      return {
        id,
        name: "Паук-стража",
        health: Math.floor(baseHealth * 1.2),
        maxHealth: Math.floor(baseHealth * 1.2),
        power: Math.floor(basePower * 0.9),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "wyvern_spider":
      return {
        id,
        name: "Паук-виверна",
        health: Math.floor(baseHealth * 1.1),
        maxHealth: Math.floor(baseHealth * 1.1),
        power: Math.floor(basePower * 1.1),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "shadow_catcher":
      return {
        id,
        name: "Теневой паук-ловец",
        health: Math.floor(baseHealth * 0.9),
        maxHealth: Math.floor(baseHealth * 0.9),
        power: Math.floor(basePower * 1.1),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'invisibility', cooldown: 3, currentCooldown: 0, value: 2 }]
      };

    case "ancient_hermit":
      return {
        id,
        name: "Древний паук-отшельник",
        health: Math.floor(baseHealth * 1.3),
        maxHealth: Math.floor(baseHealth * 1.3),
        power: Math.floor(basePower * 1.3),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "berserker_spider":
      return {
        id,
        name: "Паук-берсерк",
        health: Math.floor(baseHealth * 0.8),
        maxHealth: Math.floor(baseHealth * 0.8),
        power: Math.floor(basePower * 1.6),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "illusionist_spider":
      return {
        id,
        name: "Паук-иллюзионист",
        health: Math.floor(baseHealth * 1.1),
        maxHealth: Math.floor(baseHealth * 1.1),
        power: Math.floor(basePower * 1.2),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'illusion', cooldown: 3, currentCooldown: 0 }]
      };

    case "mother_guardian":
      return {
        id,
        name: "Паук-мать-стража",
        health: Math.floor(baseHealth * 1.8),
        maxHealth: Math.floor(baseHealth * 1.8),
        power: Math.floor(basePower * 1.4),
        isBoss: true,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "parasite_spider":
      return {
        id,
        name: "Паук-паразит",
        health: Math.floor(baseHealth * 0.9),
        maxHealth: Math.floor(baseHealth * 0.9),
        power: Math.floor(basePower * 0.8),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [{ type: 'curse' }]
      };

    case "titan_spider":
      return {
        id,
        name: "Паук-титан",
        health: Math.floor(baseHealth * 2.2),
        maxHealth: Math.floor(baseHealth * 2.2),
        power: Math.floor(basePower * 1.8),
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };

    case "arachnid_archmage":
      return {
        id,
        name: "Арахнидный Архимаг",
        health: Math.floor(baseHealth * 2.5),
        maxHealth: Math.floor(baseHealth * 2.5),
        power: Math.floor(basePower * 2.0),
        isBoss: true,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [
          { type: 'dark_magic' },
          { type: 'summon', cooldown: 3, currentCooldown: 0 },
          { type: 'poison_bite', value: 4 }
        ]
      };

    case "arachne_mother":
      return {
        id,
        name: "Арахна, Мать-Прародительница",
        health: Math.floor(baseHealth * 4.0),
        maxHealth: Math.floor(baseHealth * 4.0),
        power: Math.floor(basePower * 2.5),
        isBoss: true,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
        specialAbilities: [
          { type: 'dark_magic' },
          { type: 'summon', cooldown: 2, currentCooldown: 0 },
          { type: 'poison_bite', value: 5 },
          { type: 'curse' }
        ]
      };

    default:
      return {
        id,
        name: "Неизвестный паук",
        health: baseHealth,
        maxHealth: baseHealth,
        power: basePower,
        isBoss: false,
        image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
      };
  }
};

export const SpiderNestGenerator = (level: number): Opponent[] => {
  if (level < 1 || level > 10) {
    level = Math.min(Math.max(level, 1), 10);
  }

  const levelData = SPIDER_NEST_DATA[level as keyof typeof SPIDER_NEST_DATA];
  const opponents: Opponent[] = [];
  let currentId = 1;

  levelData.monsters.forEach(monsterData => {
    for (let i = 0; i < monsterData.count; i++) {
      const opponent = createMonsterByType(monsterData.type, currentId, level);
      opponent.name = monsterData.name;
      if (monsterData.isBoss) {
        opponent.isBoss = true;
      }
      opponents.push(opponent);
      currentId++;
    }
  });

  return opponents;
};