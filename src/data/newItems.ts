import { Item } from "@/types/inventory";
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

export const newItems: Partial<Item>[] = [
  {
    name: "Древесные чурки",
    type: "woodChunks",
    value: 15,
    description: "Крепкие куски древесины, пропитанные магической энергией.",
    image: woodChunksImg
  },
  {
    name: "Остатки магических корней",
    type: "magicalRoots", 
    value: 25,
    description: "Корни древних магических растений, хранящие в себе силу земли.",
    image: magicalRootsImg
  },
  {
    name: "Камни горной породы",
    type: "rockStones",
    value: 10,
    description: "Твердые обломки горных пород с вкраплениями минералов.",
    image: rockStonesImg
  },
  {
    name: "Черные кристаллы земляных духов",
    type: "blackCrystals",
    value: 50,
    description: "Темные кристаллы, наполненные энергией земляных духов.",
    image: blackCrystalsImg
  },
  {
    name: "Манускрипт иллюзорных откровений",
    type: "illusionManuscript",
    value: 100,
    description: "Древний свиток с заклинаниями иллюзий и откровений.",
    image: illusionManuscriptImg
  },
  {
    name: "Магический монокль тьмы",
    type: "darkMonocle",
    value: 75,
    description: "Волшебный монокль, позволяющий видеть сквозь тьму.",
    image: darkMonocleImg
  },
  {
    name: "Плетёная жила эфирной лозы",
    type: "etherVine",
    value: 40,
    description: "Гибкие волокна эфирной лозы, светящиеся магическим светом.",
    image: etherVineImg
  },
  {
    name: "Клещи из серебра древних гномов",
    type: "dwarvenTongs",
    value: 80,
    description: "Инструмент мастеров-гномов из чистого серебра.",
    image: dwarvenTongsImg
  },
  {
    name: "Масло Целительного Прощения",
    type: "healingOil",
    value: 60,
    description: "Волшебное масло с мощными целебными свойствами.",
    image: healingOilImg
  },
  {
    name: "Мерцающий мерный кристалл",
    type: "shimmeringCrystal",
    value: 90,
    description: "Кристалл, мерцающий внутренним светом и хранящий древние знания.",
    image: shimmeringCrystalImg
  }
];