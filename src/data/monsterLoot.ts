import { LootTable, LootItem } from "@/types/loot";

export const monsterLootTable: { [key: string]: LootTable } = {
  normal: {
    common: [
      {
        id: "monster_bone",
        name: "Кость монстра",
        type: "material",
        rarity: "common",
        value: 5,
        image: "/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png",
        dropChance: 0.7
      },
      {
        id: "monster_hide",
        name: "Шкура монстра",
        type: "material",
        rarity: "common",
        value: 3,
        image: "/lovable-uploads/1c898dd5-a044-49f9-be5b-782331a277db.png",
        dropChance: 0.8
      }
    ],
    rare: [
      {
        id: "monster_core",
        name: "Ядро монстра",
        type: "material",
        rarity: "rare",
        value: 15,
        image: "/lovable-uploads/09258293-d0bc-46b5-a0aa-d606cc9d860a.png",
        dropChance: 0.3
      }
    ],
    epic: []
  },
  elite: {
    common: [
      {
        id: "elite_bone",
        name: "Кость элитного монстра",
        type: "material",
        rarity: "common",
        value: 10,
        image: "/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png",
        dropChance: 0.8
      }
    ],
    rare: [
      {
        id: "elite_core",
        name: "Элитное ядро",
        type: "material",
        rarity: "rare",
        value: 25,
        image: "/lovable-uploads/09258293-d0bc-46b5-a0aa-d606cc9d860a.png",
        dropChance: 0.4
      }
    ],
    epic: [
      {
        id: "elite_crystal",
        name: "Кристалл силы",
        type: "material",
        rarity: "epic",
        value: 50,
        image: "/lovable-uploads/ce3292f0-e4aa-4a42-a73a-753b3887a621.png",
        dropChance: 0.1
      }
    ]
  },
  boss: {
    common: [
      {
        id: "boss_bone",
        name: "Кость босса",
        type: "material",
        rarity: "common",
        value: 20,
        image: "/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png",
        dropChance: 1.0
      }
    ],
    rare: [
      {
        id: "boss_core",
        name: "Ядро босса",
        type: "material",
        rarity: "rare",
        value: 40,
        image: "/lovable-uploads/09258293-d0bc-46b5-a0aa-d606cc9d860a.png",
        dropChance: 0.6
      }
    ],
    epic: [
      {
        id: "boss_crystal",
        name: "Кристалл босса",
        type: "material",
        rarity: "epic",
        value: 100,
        image: "/lovable-uploads/ce3292f0-e4aa-4a42-a73a-753b3887a621.png",
        dropChance: 0.3
      }
    ]
  }
};

export const generateLoot = (monsterType: "normal" | "elite" | "boss"): LootItem[] => {
  const lootTable = monsterLootTable[monsterType];
  const drops: LootItem[] = [];

  const checkDrop = (items: LootItem[]) => {
    items.forEach(item => {
      if (Math.random() <= item.dropChance) {
        drops.push({ ...item });
      }
    });
  };

  if (lootTable) {
    checkDrop(lootTable.common);
    checkDrop(lootTable.rare);
    checkDrop(lootTable.epic);
  }

  return drops;
};
