import { Opponent } from "@/types/battle";

// Import monster images
import spiderSkeleton from "@/assets/monsters/spider-skeleton.png";
import spiderJumper from "@/assets/monsters/spider-jumper.png";
import spiderWeaver from "@/assets/monsters/spider-weaver.png";
import spiderHunter from "@/assets/monsters/spider-hunter.png";
import spiderQueenLarva from "@/assets/monsters/spider-queen-larva.png";
import spiderCorpseEater from "@/assets/monsters/spider-corpse-eater.png";
import spiderGuardian from "@/assets/monsters/spider-guardian.png";
import spiderWyvern from "@/assets/monsters/spider-wyvern.png";
import shadowSpiderCatcher from "@/assets/monsters/shadow-spider-catcher.png";
import ancientSpiderHermit from "@/assets/monsters/ancient-spider-hermit.png";
import spiderBerserker from "@/assets/monsters/spider-berserker.png";
import spiderIllusionist from "@/assets/monsters/spider-illusionist.png";
import spiderMotherGuardian from "@/assets/monsters/spider-mother-guardian.png";
import spiderParasite from "@/assets/monsters/spider-parasite.png";
import spiderTitan from "@/assets/monsters/spider-titan.png";
import arachnidArchmage from "@/assets/monsters/arachnid-archmage.png";
import arachnaProgenitor from "@/assets/monsters/arachna-progenitor.png";

// Monster images mapping
const monsterImages: Record<string, string> = {
  "skeleton_spider": spiderSkeleton,
  "jumper_spider": spiderJumper,
  "spinner_spider": spiderWeaver,
  "hunter_spider": spiderHunter,
  "queen_larva": spiderQueenLarva,
  "corpse_eater": spiderCorpseEater,
  "guardian_spider": spiderGuardian,
  "wyvern_spider": spiderWyvern,
  "shadow_catcher": shadowSpiderCatcher,
  "ancient_hermit": ancientSpiderHermit,
  "berserker_spider": spiderBerserker,
  "illusionist_spider": spiderIllusionist,
  "mother_guardian": spiderMotherGuardian,
  "parasite_spider": spiderParasite,
  "titan_spider": spiderTitan,
  "arachnid_archmage": arachnidArchmage,
  "arachne_mother": arachnaProgenitor
};

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
        image: monsterImages["skeleton_spider"],
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
        image: monsterImages["jumper_spider"]
      };

    case "spinner_spider":
      return {
        id,
        name: "Паук-прядильщик",
        health: Math.floor(baseHealth * 0.7),
        maxHealth: Math.floor(baseHealth * 0.7),
        power: Math.floor(basePower * 0.8),
        isBoss: false,
        image: monsterImages["spinner_spider"],
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
        image: monsterImages["hunter_spider"],
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
        image: monsterImages["queen_larva"],
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
        image: monsterImages["corpse_eater"],
        specialAbilities: [{ type: 'poison_bite', value: 1 }]
      };

    case "guardian_spider":
      return {
        id,
        name: "Паук-стража",
        health: Math.floor(baseHealth * 1.3),
        maxHealth: Math.floor(baseHealth * 1.3),
        power: Math.floor(basePower * 1.1),
        isBoss: false,
        image: monsterImages["guardian_spider"],
        specialAbilities: [{ type: 'corpse_feed', value: 2 }]
      };

    case "wyvern_spider":
      return {
        id,
        name: "Паук-виверна",
        health: Math.floor(baseHealth * 1.2),
        maxHealth: Math.floor(baseHealth * 1.2),
        power: Math.floor(basePower * 1.3),
        isBoss: false,
        image: monsterImages["wyvern_spider"],
        specialAbilities: [{ type: 'poison_bite', value: 15 }]
      };

    case "shadow_catcher":
      return {
        id,
        name: "Теневой паук-ловец",
        health: Math.floor(baseHealth * 1.1),
        maxHealth: Math.floor(baseHealth * 1.1),
        power: Math.floor(basePower * 1.2),
        isBoss: false,
        image: monsterImages["shadow_catcher"],
        specialAbilities: [{ type: 'invisibility', cooldown: 3, currentCooldown: 0 }]
      };

    case "ancient_hermit":
      return {
        id,
        name: "Древний паук-отшельник",
        health: Math.floor(baseHealth * 1.4),
        maxHealth: Math.floor(baseHealth * 1.4),
        power: Math.floor(basePower * 1.1),
        isBoss: false,
        image: monsterImages["ancient_hermit"],
        specialAbilities: [{ type: 'dark_magic', cooldown: 5, currentCooldown: 0 }]
      };

    case "berserker_spider":
      return {
        id,
        name: "Паук-берсерк",
        health: Math.floor(baseHealth * 1.2),
        maxHealth: Math.floor(baseHealth * 1.2),
        power: Math.floor(basePower * 1.4),
        isBoss: false,
        image: monsterImages["berserker_spider"],
        specialAbilities: [{ type: 'curse', cooldown: 6, currentCooldown: 0 }]
      };

    case "illusionist_spider":
      return {
        id,
        name: "Паук-иллюзионист",
        health: Math.floor(baseHealth * 1.1),
        maxHealth: Math.floor(baseHealth * 1.1),
        power: Math.floor(basePower * 1.2),
        isBoss: false,
        image: monsterImages["illusionist_spider"],
        specialAbilities: [{ type: 'illusion', cooldown: 4, currentCooldown: 0 }]
      };

    case "mother_guardian":
      return {
        id,
        name: "Паук-мать-стража",
        health: Math.floor(baseHealth * 1.8),
        maxHealth: Math.floor(baseHealth * 1.8),
        power: Math.floor(basePower * 1.3),
        isBoss: true,
        image: monsterImages["mother_guardian"],
        specialAbilities: [{ type: 'corpse_feed', cooldown: 3, currentCooldown: 0 }]
      };

    case "parasite_spider":
      return {
        id,
        name: "Паук-паразит",
        health: Math.floor(baseHealth * 1.3),
        maxHealth: Math.floor(baseHealth * 1.3),
        power: Math.floor(basePower * 1.1),
        isBoss: false,
        image: monsterImages["parasite_spider"],
        specialAbilities: [{ type: 'lifesteal', cooldown: 3, currentCooldown: 0 }]
      };

    case "titan_spider":
      return {
        id,
        name: "Паук-титан",
        health: Math.floor(baseHealth * 2.2),
        maxHealth: Math.floor(baseHealth * 2.2),
        power: Math.floor(basePower * 1.5),
        isBoss: false,
        image: monsterImages["titan_spider"],
        specialAbilities: [{ type: 'dark_magic', cooldown: 5, currentCooldown: 0 }]
      };

    case "arachnid_archmage":
      return {
        id,
        name: "Арахнидный Архимаг",
        health: Math.floor(baseHealth * 2.5),
        maxHealth: Math.floor(baseHealth * 2.5),
        power: Math.floor(basePower * 1.6),
        isBoss: true,
        image: monsterImages["arachnid_archmage"],
        specialAbilities: [
          { type: 'dark_magic', cooldown: 3, currentCooldown: 0 },
          { type: 'curse', cooldown: 4, currentCooldown: 0 }
        ]
      };

    case "arachne_mother":
      return {
        id,
        name: "Арахна, Мать-Прародительница",
        health: Math.floor(baseHealth * 4.0),
        maxHealth: Math.floor(baseHealth * 4.0),
        power: Math.floor(basePower * 2.0),
        isBoss: true,
        image: monsterImages["arachne_mother"],
        specialAbilities: [
          { type: 'curse', cooldown: 4, currentCooldown: 0 },
          { type: 'summon', cooldown: 6, currentCooldown: 0 },
          { type: 'dark_magic', cooldown: 8, currentCooldown: 0 }
        ]
      };

    default:
      return {
        id,
        name: "Неизвестный монстр",
        health: baseHealth,
        maxHealth: baseHealth,
        power: basePower,
        isBoss: false,
        image: monsterImages["skeleton_spider"],
        specialAbilities: []
      };
  }
};

export const SpiderNestGenerator = (level: number): Opponent[] => {
  const levelData = SPIDER_NEST_DATA[level];
  if (!levelData) {
    console.warn(`No data found for level ${level}`);
    return [];
  }

  const opponents: Opponent[] = [];
  let currentId = 1;

  levelData.monsters.forEach(monsterConfig => {
    for (let i = 0; i < monsterConfig.count; i++) {
      const monster = createMonsterByType(monsterConfig.type, currentId++, level);
      if (monsterConfig.isBoss) {
        monster.isBoss = true;
      }
      opponents.push(monster);
    }
  });

  return opponents;
};