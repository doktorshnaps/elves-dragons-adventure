import { Item } from "@/types/inventory";
import { v4 as uuidv4 } from 'uuid';
import { newItems } from "@/data/newItems";

// Все предметы из гримуара (кроме рабочих) для дропа
const ALL_GRIMOIRE_ITEMS = [
  "woodChunks", "magicalRoots", "rockStones", "blackCrystals",
  "illusionManuscript", "darkMonocle", "etherVine", "dwarvenTongs",
  "healingOil", "shimmeringCrystal", "lifeCrystal"
];

// Маппинг монстров к предметам (все монстры из подземелья Гнездо Гигантских Пауков)
// 100% шанс дропа для тестирования - каждый монстр дропает все предметы
export const monsterLootMapping: Record<string, string[]> = {
  // Уровни 1-3
  "Паучок-скелет": ALL_GRIMOIRE_ITEMS,
  "Паук-скакун": ALL_GRIMOIRE_ITEMS, 
  "Паук-прядильщик": ALL_GRIMOIRE_ITEMS,
  
  // Уровни 4-7
  "Паук-охотник": ALL_GRIMOIRE_ITEMS,
  "Паук-королева-личинка": ALL_GRIMOIRE_ITEMS,
  "Паук-трупоед": ALL_GRIMOIRE_ITEMS,
  "Паук-стража": ALL_GRIMOIRE_ITEMS,
  
  // Уровни 8-10
  "Паук-виверна": ALL_GRIMOIRE_ITEMS,
  "Теневой паук-ловец": ALL_GRIMOIRE_ITEMS,
  "Древний паук-отшельник": ALL_GRIMOIRE_ITEMS,
  "Паук-берсерк": ALL_GRIMOIRE_ITEMS,
  "Паук-иллюзионист": ALL_GRIMOIRE_ITEMS,
  "Паук-мать-стража": ALL_GRIMOIRE_ITEMS,
  "Паук-паразит": ALL_GRIMOIRE_ITEMS,
  "Паук-титан": ALL_GRIMOIRE_ITEMS,
  "Арахнидный Архимаг": ALL_GRIMOIRE_ITEMS,
  "Арахна, Мать-Прародительница": ALL_GRIMOIRE_ITEMS
};

// Получить ВСЕ предметы от монстра (100% шанс для тестирования)
export const getMonsterLoot = (monsterName: string): Item[] => {
  console.log('🎲 Getting ALL loot for monster:', monsterName);
  const possibleLoot = monsterLootMapping[monsterName];
  console.log('🎁 Possible loot types for', monsterName, ':', possibleLoot);
  
  if (!possibleLoot || possibleLoot.length === 0) {
    console.log('❌ No loot mapping found for monster:', monsterName);
    return [];
  }

  // 100% шанс дропа всех предметов для тестирования
  const allItems: Item[] = [];
  
  for (const lootType of possibleLoot) {
    const itemTemplate = newItems.find(item => item.type === lootType);
    console.log(`📋 Processing loot type "${lootType}":`, itemTemplate);
    
    if (!itemTemplate) {
      console.log('❌ No item template found for type:', lootType);
      continue;
    }

    const finalItem = {
      id: uuidv4(),
      name: itemTemplate.name!,
      type: itemTemplate.type!,
      value: itemTemplate.value!,
      description: itemTemplate.description || `Выпадает с: ${monsterName}`,
      image: itemTemplate.image
    };
    
    allItems.push(finalItem);
    console.log('✅ Added item:', finalItem.name);
  }
  
  console.log(`🎉 Total items generated: ${allItems.length}`);
  return allItems;
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