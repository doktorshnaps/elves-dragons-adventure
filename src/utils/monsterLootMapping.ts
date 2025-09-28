import { Item } from "@/types/inventory";
import { v4 as uuidv4 } from 'uuid';
import { newItems } from "@/data/newItems";

// Маппинг монстров к предметам (все монстры из подземелья Гнездо Гигантских Пауков)
export const monsterLootMapping: Record<string, string[]> = {
  // Уровни 1-3
  "Паучок-скелет": ["woodChunks", "rockStones"],
  "Паук-скакун": ["magicalRoots", "woodChunks"], 
  "Паук-прядильщик": ["etherVine", "shimmeringCrystal"],
  
  // Уровни 4-7
  "Паук-охотник": ["blackCrystals", "dwarvenTongs"],
  "Паук-королева-личинка": ["healingOil", "illusionManuscript"],
  "Паук-трупоед": ["rockStones", "blackCrystals"],
  "Паук-стража": ["dwarvenTongs", "darkMonocle"],
  
  // Уровни 8-10
  "Паук-виверна": ["shimmeringCrystal", "illusionManuscript"],
  "Теневой паук-ловец": ["darkMonocle", "etherVine"],
  "Древний паук-отшельник": ["healingOil", "shimmeringCrystal"],
  "Паук-берсерк": ["blackCrystals", "dwarvenTongs"],
  "Паук-иллюзионист": ["illusionManuscript", "darkMonocle"],
  "Паук-мать-стража": ["healingOil", "shimmeringCrystal"],
  "Паук-паразит": ["magicalRoots", "etherVine"],
  "Паук-титан": ["dwarvenTongs", "blackCrystals"],
  "Арахнидный Архимаг": ["illusionManuscript", "shimmeringCrystal"],
  "Арахна, Мать-Прародительница": ["shimmeringCrystal", "healingOil", "darkMonocle"] // босс - может дропать больше предметов
};

// Получить случайный предмет от монстра
export const getMonsterLoot = (monsterName: string): Item | null => {
  console.log('🎲 Getting loot for monster:', monsterName);
  const possibleLoot = monsterLootMapping[monsterName];
  console.log('🎁 Possible loot for', monsterName, ':', possibleLoot);
  
  if (!possibleLoot || possibleLoot.length === 0) {
    console.log('❌ No loot mapping found for monster:', monsterName);
    return null;
  }

  // 100% шанс дропа в тестовом режиме
  const randomLootType = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
  console.log('🎯 Selected loot type:', randomLootType);
  
  const itemTemplate = newItems.find(item => item.type === randomLootType);
  console.log('📋 Found item template:', itemTemplate);
  
  if (!itemTemplate) {
    console.log('❌ No item template found for type:', randomLootType);
    return null;
  }

  const finalItem = {
    id: uuidv4(),
    name: itemTemplate.name!,
    type: itemTemplate.type!,
    value: itemTemplate.value!,
    description: `${itemTemplate.description} Выпадает с: ${monsterName}`,
    image: itemTemplate.image
  };
  
  console.log('✅ Final generated item:', finalItem);
  return finalItem;
};

// Получить список монстров, с которых выпадает предмет (для описания)
export const getMonstersForItem = (itemType: string): string[] => {
  const monsters: string[] = [];
  
  for (const [monsterName, lootTypes] of Object.entries(monsterLootMapping)) {
    if (lootTypes.includes(itemType)) {
      monsters.push(monsterName);
    }
  }
  
  return monsters;
};