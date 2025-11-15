import { Item } from "@/types/inventory";

// Temporarily using placeholders until webp files are uploaded
const woodChunksImg = "/placeholder.svg";
const magicalRootsImg = "/placeholder.svg";
const rockStonesImg = "/placeholder.svg";
const blackCrystalsImg = "/placeholder.svg";
const illusionManuscriptImg = "/placeholder.svg";
const darkMonocleImg = "/placeholder.svg";
const etherVineImg = "/placeholder.svg";
const dwarvenTongsImg = "/placeholder.svg";
const healingOilImg = "/placeholder.svg";
const shimmeringCrystalImg = "/placeholder.svg";
const lifeCrystalImg = "/placeholder.svg";

export const newItems: Partial<Item>[] = [
  {
    name: "Древесные чурки",
    type: "woodChunks",
    value: 15,
    description: "Крепкие куски древесины, пропитанные магической энергией. Выпадает с: Паучок-скелет, Паук-скакун",
    image: woodChunksImg
  },
  {
    name: "Остатки магических корней",
    type: "magicalRoots", 
    value: 25,
    description: "Корни древних магических растений, хранящие в себе силу земли. Выпадает с: Паук-скакун, Паук-паразит",
    image: magicalRootsImg
  },
  {
    name: "Камни горной породы",
    type: "rockStones",
    value: 10,
    description: "Твердые обломки горных пород с вкраплениями минералов. Выпадает с: Паучок-скелет, Паук-трупоед",
    image: rockStonesImg
  },
  {
    name: "Черные кристаллы земляных духов",
    type: "blackCrystals",
    value: 50,
    description: "Темные кристаллы, наполненные энергией земляных духов. Выпадает с: Паук-охотник, Паук-трупоед, Паук-берсерк, Паук-титан",
    image: blackCrystalsImg
  },
  {
    name: "Манускрипт иллюзорных откровений",
    type: "illusionManuscript",
    value: 100,
    description: "Древний свиток с заклинаниями иллюзий и откровений. Выпадает с: Паук-королева-личинка, Паук-виверна, Паук-иллюзионист, Арахнидный Архимаг",
    image: illusionManuscriptImg
  },
  {
    name: "Магический монокль тьмы",
    type: "darkMonocle",
    value: 75,
    description: "Волшебный монокль, позволяющий видеть сквозь тьму. Выпадает с: Паук-стража, Теневой паук-ловец, Паук-иллюзионист, Арахна Мать-Прародительница",
    image: darkMonocleImg
  },
  {
    name: "Плетёная жила эфирной лозы",
    type: "etherVine",
    value: 40,
    description: "Гибкие волокна эфирной лозы, светящиеся магическим светом. Выпадает с: Паук-прядильщик, Теневой паук-ловец, Паук-паразит",
    image: etherVineImg
  },
  {
    name: "Клещи из серебра древних гномов",
    type: "dwarvenTongs",
    value: 80,
    description: "Инструмент мастеров-гномов из чистого серебра. Выпадает с: Паук-охотник, Паук-стража, Паук-берсерк, Паук-титан",
    image: dwarvenTongsImg
  },
  {
    name: "Масло Целительного Прощения",
    type: "healingOil",
    value: 60,
    description: "Волшебное масло с мощными целебными свойствами. Выпадает с: Паук-королева-личинка, Древний паук-отшельник, Паук-мать-стража, Арахна Мать-Прародительница",
    image: healingOilImg
  },
  {
    name: "Мерцающий мерный кристалл",
    type: "shimmeringCrystal",
    value: 90,
    description: "Кристалл, мерцающий внутренним светом и хранящий древние знания. Выпадает с: Паук-прядильщик, Паук-виверна, Древний паук-отшельник, Паук-мать-стража, Арахнидный Архимаг, Арахна Мать-Прародительница",
    image: shimmeringCrystalImg
  },
  {
    name: "Кристалл Жизни",
    type: "lifeCrystal",
    value: 150,
    description: "Редчайший кристалл, пульсирующий жизненной энергией. Можно добыть из монстров в Гнездо Гигантских Пауков",
    image: lifeCrystalImg
  }
];