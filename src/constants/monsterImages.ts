// Temporarily using placeholders until webp files are uploaded
const spiderSkeleton = "/placeholder.svg";
const spiderJumper = "/placeholder.svg";
const spiderWeaver = "/placeholder.svg";
const spiderHunter = "/placeholder.svg";
const spiderQueenLarva = "/placeholder.svg";
const spiderCorpseEater = "/placeholder.svg";
const spiderGuardian = "/placeholder.svg";
const spiderWyvern = "/placeholder.svg";
const shadowSpiderCatcher = "/placeholder.svg";
const ancientSpiderHermit = "/placeholder.svg";
const spiderBerserker = "/placeholder.svg";
const spiderIllusionist = "/placeholder.svg";
const spiderMotherGuardian = "/placeholder.svg";
const spiderParasite = "/placeholder.svg";
const spiderTitan = "/placeholder.svg";
const arachnidArchmage = "/placeholder.svg";
const arachnaProgenitor = "/placeholder.svg";

// Monster images mapping by monster name (Russian)
export const monsterImagesByName: Record<string, string> = {
  "Паучок-скелет": spiderSkeleton,
  "Паук-скакун": spiderJumper,
  "Паук-прядильщик": spiderWeaver,
  "Паук-охотник": spiderHunter,
  "Паук-королева-личинка": spiderQueenLarva,
  "Паук-трупоед": spiderCorpseEater,
  "Паук-стража": spiderGuardian,
  "Паук-виверна": spiderWyvern,
  "Теневой паук-ловец": shadowSpiderCatcher,
  "Древний паук-отшельник": ancientSpiderHermit,
  "Паук-берсерк": spiderBerserker,
  "Паук-иллюзионист": spiderIllusionist,
  "Паук-мать-стража": spiderMotherGuardian,
  "Паук-паразит": spiderParasite,
  "Паук-титан": spiderTitan,
  "Арахнидный Архимаг": arachnidArchmage,
  "Арахна Прародительница": arachnaProgenitor
};

// Monster images mapping by monster type (English)
export const monsterImagesByType: Record<string, string> = {
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

// Monster images mapping by monster_id (from database)
export const monsterImagesById: Record<string, string> = {
  "spider_skeleton": spiderSkeleton,
  "spider_jumper": spiderJumper,
  "spider_weaver": spiderWeaver,
  "spider_hunter": spiderHunter,
  "spider_queen_larva": spiderQueenLarva,
  "spider_corpse_eater": spiderCorpseEater,
  "spider_guardian": spiderGuardian,
  "spider_wyvern": spiderWyvern,
  "shadow_spider_catcher": shadowSpiderCatcher,
  "ancient_spider": ancientSpiderHermit,
  "spider_berserker": spiderBerserker,
  "spider_illusionist": spiderIllusionist,
  "spider_mother": spiderMotherGuardian,
  "spider_parasite": spiderParasite,
  "spider_titan": spiderTitan,
  "spider_archmage": arachnidArchmage,
  "arachna_progenitor": arachnaProgenitor,
  "shadow_spider": shadowSpiderCatcher,
};

// Array of all images for preloading
export const allMonsterImages = [
  spiderSkeleton,
  spiderJumper,
  spiderWeaver,
  spiderHunter,
  spiderQueenLarva,
  spiderCorpseEater,
  spiderGuardian,
  spiderWyvern,
  shadowSpiderCatcher,
  ancientSpiderHermit,
  spiderBerserker,
  spiderIllusionist,
  spiderMotherGuardian,
  spiderParasite,
  spiderTitan,
  arachnidArchmage,
  arachnaProgenitor
];
