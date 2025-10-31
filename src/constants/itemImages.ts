// Centralized item images mapping
import spiderSilk from "@/assets/items/spider_silk.png";
import spiderPoison from "@/assets/items/spider_poison.jpg";
import spiderFang from "@/assets/items/spider_fang.png";
import spiderEye from "@/assets/items/spider_eye.png";
import chelicerae from "@/assets/items/chelicerae.png";
import chitinFragment from "@/assets/items/chitin_fragment.png";
import spiderLimbs from "@/assets/items/spider_limbs.png";
import spiderTendons from "@/assets/items/spider_tendons.png";
import poisonGland from "@/assets/items/poison_gland.png";
import spiderEggs from "@/assets/items/spider_eggs.png";
import skeletonSpiderBone from "@/assets/items/skeleton_spider_bone.png";
import illusionPollen from "@/assets/items/illusion_pollen.png";
import wyvernWing from "@/assets/items/wyvern_wing.png";
import hunterClaw from "@/assets/items/hunter_claw.png";
import silkCore from "@/assets/items/silk_core.png";
import enhancedGuardianChitin from "@/assets/items/enhanced_guardian_chitin.png";
import queenLarvaStinger from "@/assets/items/queen_larva_stinger.png";
import concentratedPoisonGland from "@/assets/items/concentrated_poison_gland.png";
import ancientHermitEye from "@/assets/items/ancient_hermit_eye.png";
import shadowWebGland from "@/assets/items/shadow_web_gland.png";
import berserkerFang from "@/assets/items/berserker-fang.png";
import wyvernHeart from "@/assets/items/wyvern-heart.png";
import titanShell from "@/assets/items/titan-shell.png";
import carrionClaw from "@/assets/items/carrion-claw.png";
import parasiteGland from "@/assets/items/parasite-gland.png";
import guardianEgg from "@/assets/items/guardian-egg.png";
import webSymbol from "@/assets/items/web-symbol.png";
import archmageStaff from "@/assets/items/archmage-staff.png";
import livingShadowMantle from "@/assets/items/living-shadow-mantle.png";
import arachnidGrimoire from "@/assets/items/arachnid-grimoire.png";
import archmageSoulShard from "@/assets/items/archmage_soul_shard.png";
import progenitorHeart from "@/assets/items/progenitor_heart.png";
import arachneSilkGland from "@/assets/items/arachne_silk_gland.png";
import progenitorEgg from "@/assets/items/progenitor_egg.png";
import primasEye from "@/assets/items/primas_eye.png";
import arachneClaw from "@/assets/items/arachne_claw.png";
import arachneCrown from "@/assets/items/arachne_crown.png";
import ashenThreadsCloak from "@/assets/items/ashen_threads_cloak.png";
import woodChunksImg from "@/assets/items/wood-chunks.jpeg";
import magicalRootsImg from "@/assets/items/magical-roots.jpeg";
import rockStonesImg from "@/assets/items/rock-stones.jpeg";
import blackCrystalsImg from "@/assets/items/black-crystals.jpeg";
import illusionManuscriptImg from "@/assets/items/illusion-manuscript.png";
import darkMonocleImg from "@/assets/items/dark-monocle.png";
import etherVineImg from "@/assets/items/ether-vine.png";
import dwarvenTongsImg from "@/assets/items/dwarven-tongs.png";
import healingOilImg from "@/assets/items/healing-oil.png";
import shimmeringCrystalImg from "@/assets/items/shimmering-crystal.png";
import lifeCrystalImg from "@/assets/items/life-crystal.png";

// Map by item_id (for ItemsInfo component)
export const itemImagesByItemId: Record<string, string> = {
  spider_silk: spiderSilk,
  spider_poison_small: spiderPoison,
  spider_fang: spiderFang,
  spider_eye: spiderEye,
  chelicerae: chelicerae,
  chitin_fragment: chitinFragment,
  spider_limbs: spiderLimbs,
  spider_tendons: spiderTendons,
  poison_gland: poisonGland,
  spider_eggs: spiderEggs,
  skeleton_spider_bone: skeletonSpiderBone,
  illusion_pollen: illusionPollen,
  wyvern_wing: wyvernWing,
  hunter_claw: hunterClaw,
  silk_core: silkCore,
  enhanced_guardian_chitin: enhancedGuardianChitin,
  queen_larva_stinger: queenLarvaStinger,
  concentrated_poison_gland: concentratedPoisonGland,
  ancient_hermit_eye: ancientHermitEye,
  shadow_web_gland: shadowWebGland,
  berserker_fang: berserkerFang,
  wyvern_heart: wyvernHeart,
  titan_shell: titanShell,
  carrion_claw: carrionClaw,
  parasite_gland: parasiteGland,
  guardian_egg: guardianEgg,
  web_symbol: webSymbol,
  archmage_staff: archmageStaff,
  living_shadow_mantle: livingShadowMantle,
  arachnid_grimoire: arachnidGrimoire,
  archmage_soul_shard: archmageSoulShard,
  progenitor_heart: progenitorHeart,
  arachne_silk_gland: arachneSilkGland,
  progenitor_egg: progenitorEgg,
  primas_eye: primasEye,
  arachne_claw: arachneClaw,
  arachne_crown: arachneCrown,
  ashen_threads_cloak: ashenThreadsCloak,
  wood_chunks: woodChunksImg,
  magical_roots: magicalRootsImg,
  rock_stones: rockStonesImg,
  black_crystals: blackCrystalsImg,
  illusion_manuscript: illusionManuscriptImg,
  dark_monocle: darkMonocleImg,
  ether_vine: etherVineImg,
  dwarven_tongs: dwarvenTongsImg,
  healing_oil: healingOilImg,
  shimmering_crystal: shimmeringCrystalImg,
  life_crystal: lifeCrystalImg,
};

// Map by item name (Russian) for inventory component
export const itemImagesByName: Record<string, string> = {
  'Паутина паука': spiderSilk,
  'Яд паука': spiderPoison,
  'Клык паука': spiderFang,
  'Глаз паука': spiderEye,
  'Хелицеры': chelicerae,
  'Фрагмент хитина': chitinFragment,
  'Конечности паука': spiderLimbs,
  'Сухожилие паука': spiderTendons,
  'Железа яда': poisonGland,
  'Паучьи яйца': spiderEggs,
  'Кость паука-скелета': skeletonSpiderBone,
  'Пыльца иллюзии': illusionPollen,
  'Крыло виверны': wyvernWing,
  'Коготь охотника': hunterClaw,
  'Сердцевина шелка': silkCore,
  'Усиленный хитин стражи': enhancedGuardianChitin,
  'Жало королевы-личинки': queenLarvaStinger,
  'Железа концентрированного яда': concentratedPoisonGland,
  'Око древнего отшельника': ancientHermitEye,
  'Тенетная железа': shadowWebGland,
  'Клык берсерка': berserkerFang,
  'Сердце виверны': wyvernHeart,
  'Панцирь титана': titanShell,
  'Коготь падальщика': carrionClaw,
  'Железа паразита': parasiteGland,
  'Яйцо стража': guardianEgg,
  'Символ паутины': webSymbol,
  'Посох Архимага': archmageStaff,
  'Мантия живой тени': livingShadowMantle,
  'Гримуар арахнида': arachnidGrimoire,
  'Осколок души Архимага': archmageSoulShard,
  'Сердце прародителя': progenitorHeart,
  'Шелковая железа Арахны': arachneSilkGland,
  'Яйцо прародителя': progenitorEgg,
  'Око первобытности': primasEye,
  'Коготь Арахны': arachneClaw,
  'Корона Арахны': arachneCrown,
  'Плащ пепельных нитей': ashenThreadsCloak,
  'Древесные чурки': woodChunksImg,
  'Остатки магических корней': magicalRootsImg,
  'Камни горной породы': rockStonesImg,
  'Черные кристаллы земляных духов': blackCrystalsImg,
  'Манускрипт иллюзорных откровений': illusionManuscriptImg,
  'Магический монокль тьмы': darkMonocleImg,
  'Плетёная жила эфирной лозы': etherVineImg,
  'Клещи из серебра древних гномов': dwarvenTongsImg,
  'Масло Целительного Прощения': healingOilImg,
  'Мерцающий мерный кристалл': shimmeringCrystalImg,
  'Кристалл жизни': lifeCrystalImg,
  // Доп. синонимы и вариации названий
  'Кристал Жизни': lifeCrystalImg,
  'Кристалл Жизни': lifeCrystalImg,
  'Брюшная Железа Арахны': arachneSilkGland,
  'Брюшная железа Арахны': arachneSilkGland,
};

// Export all images for preloading
export const allItemImages = [
  spiderSilk,
  spiderPoison,
  spiderFang,
  spiderEye,
  chelicerae,
  chitinFragment,
  spiderLimbs,
  spiderTendons,
  poisonGland,
  spiderEggs,
  skeletonSpiderBone,
  illusionPollen,
  wyvernWing,
  hunterClaw,
  silkCore,
  enhancedGuardianChitin,
  queenLarvaStinger,
  concentratedPoisonGland,
  ancientHermitEye,
  shadowWebGland,
  berserkerFang,
  wyvernHeart,
  titanShell,
  carrionClaw,
  parasiteGland,
  guardianEgg,
  webSymbol,
  archmageStaff,
  livingShadowMantle,
  arachnidGrimoire,
  archmageSoulShard,
  progenitorHeart,
  arachneSilkGland,
  progenitorEgg,
  primasEye,
  arachneClaw,
  arachneCrown,
  ashenThreadsCloak,
  woodChunksImg,
  magicalRootsImg,
  rockStonesImg,
  blackCrystalsImg,
  illusionManuscriptImg,
  darkMonocleImg,
  etherVineImg,
  dwarvenTongsImg,
  healingOilImg,
  shimmeringCrystalImg,
  lifeCrystalImg,
];
