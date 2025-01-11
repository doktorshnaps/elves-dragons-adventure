import { Item } from "@/components/battle/Inventory";

export const generateLoot = (level: number): Item[] => {
  const loot: Item[] = [];
  const chance = Math.random();

  if (chance < 0.3) {
    if (Math.random() < 0.5) {
      loot.push({
        id: Date.now(),
        name: "Малое зелье здоровья",
        type: "healthPotion",
        value: 30,
        image: "/lovable-uploads/6693dd2b-2511-4c63-ae03-a1b208a8e7da.png"
      });
    } else {
      loot.push({
        id: Date.now(),
        name: "Большое зелье здоровья",
        type: "healthPotion",
        value: 70,
        image: "/lovable-uploads/194bfe08-75f6-4415-8fda-5538a83251c3.png"
      });
    }
  }

  if (level > 2 && Math.random() < 0.2) {
    loot.push({
      id: Date.now(),
      name: "Зелье защиты",
      type: "defensePotion",
      value: 20
    });
  }

  return loot;
};