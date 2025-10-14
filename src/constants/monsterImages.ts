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
  "Арахна, Мать-Прародительница": arachnaProgenitor
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
