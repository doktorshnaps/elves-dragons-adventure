import { Item } from "@/types/inventory";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

// Все предметы из базы данных (кроме рабочих и колод карт) для дропа
// Будут загружены динамически из item_templates
let ALL_ITEM_TEMPLATES: any[] = [];

// Функция для предзагрузки всех предметов из базы данных
export const preloadItemTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('item_templates')
      .select('*')
      .not('type', 'in', '("worker","cardPack")');
    
    if (error) {
      console.error('❌ Error loading item templates:', error);
      return;
    }
    
    ALL_ITEM_TEMPLATES = data || [];
    console.log(`✅ Loaded ${ALL_ITEM_TEMPLATES.length} item templates for loot`);
  } catch (error) {
    console.error('❌ Error in preloadItemTemplates:', error);
  }
};

// Все item_id предметов, которые могут дропать (заполняется динамически)
const ALL_GRIMOIRE_ITEMS: string[] = [];

// Маппинг монстров к предметам (все монстры из подземелья Гнездо Гигантских Пауков)
// 100% шанс дропа для тестирования - каждый монстр дропает все предметы
export const monsterLootMapping: Record<string, string[]> = {
  // Старые имена монстров (из SpiderNestGenerator)
  "Паучок-скелет": ALL_GRIMOIRE_ITEMS,
  "Паук-скакун": ALL_GRIMOIRE_ITEMS, 
  "Паук-прядильщик": ALL_GRIMOIRE_ITEMS,
  "Паук-охотник": ALL_GRIMOIRE_ITEMS,
  "Паук-королева-личинка": ALL_GRIMOIRE_ITEMS,
  "Паук-трупоед": ALL_GRIMOIRE_ITEMS,
  "Паук-стража": ALL_GRIMOIRE_ITEMS,
  "Паук-виверна": ALL_GRIMOIRE_ITEMS,
  "Теневой паук-ловец": ALL_GRIMOIRE_ITEMS,
  "Древний паук-отшельник": ALL_GRIMOIRE_ITEMS,
  "Паук-берсерк": ALL_GRIMOIRE_ITEMS,
  "Паук-иллюзионист": ALL_GRIMOIRE_ITEMS,
  "Паук-мать-стража": ALL_GRIMOIRE_ITEMS,
  "Паук-паразит": ALL_GRIMOIRE_ITEMS,
  "Паук-титан": ALL_GRIMOIRE_ITEMS,
  "Арахнидный Архимаг": ALL_GRIMOIRE_ITEMS,
  "Арахна, Мать-Прародительница": ALL_GRIMOIRE_ITEMS,
  
  // Новые имена монстров (из SpiderNestGeneratorBalanced)
  "Теневой паук": ALL_GRIMOIRE_ITEMS,
  "Древний паук": ALL_GRIMOIRE_ITEMS,
  "Ядовитый паук": ALL_GRIMOIRE_ITEMS,
  "Паук-некромант": ALL_GRIMOIRE_ITEMS,
  "Паук-архимаг": ALL_GRIMOIRE_ITEMS,
  "Легендарный паук": ALL_GRIMOIRE_ITEMS,
  "Гигантский Паук-Страж": ALL_GRIMOIRE_ITEMS,
  "Королева Пауков": ALL_GRIMOIRE_ITEMS,
  "Арахна Прародительница": ALL_GRIMOIRE_ITEMS
};

// Получить предметы от монстра из базы данных dungeon_item_drops
export const getMonsterLoot = async (
  monsterName: string,
  dungeonNumber: number,
  dungeonLevel: number
): Promise<Item[]> => {
  console.log('🎲 Getting loot for monster:', { monsterName, dungeonNumber, dungeonLevel });
  
  try {
    // Получаем настройки дропов из базы данных
    const { data: drops, error } = await supabase.rpc('get_dungeon_item_drops', {
      p_dungeon_number: dungeonNumber,
      p_dungeon_level: dungeonLevel
    });

    if (error) {
      console.error('❌ Error fetching dungeon item drops:', error);
      return [];
    }

    if (!drops || drops.length === 0) {
      console.log('ℹ️ No item drops configured for this dungeon level');
      return [];
    }

    console.log(`📦 Found ${drops.length} possible drops:`, drops);

    const lootedItems: Item[] = [];

    // Проходим по каждому возможному дропу и проверяем шанс выпадения
    for (const drop of drops) {
      const roll = Math.random() * 100; // Генерируем случайное число от 0 до 100
      const dropChance = Number(drop.drop_chance);
      const itemName = (drop as any).name ?? (drop as any).item_name; // поддержка обоих вариантов
      const itemType = (drop as any).type ?? (drop as any).item_type; // поддержка обоих вариантов
      
      console.log(`🎯 Rolling for ${itemName}: rolled ${roll.toFixed(2)}, need <= ${dropChance}`);
      
      if (roll <= dropChance) {
        // Предмет выпал!
        const item: Item = {
          id: uuidv4(),
          name: itemName,
          type: itemType as any,
          value: 1,
          description: `Получено с ${monsterName}`,
        };
        
        lootedItems.push(item);
        console.log(`✅ Item dropped: ${item.name}`);
      } else {
        console.log(`❌ Item didn't drop: ${itemName} (${roll.toFixed(2)} > ${dropChance})`);
      }
    }

    console.log(`💰 Total items looted: ${lootedItems.length}`, lootedItems);
    return lootedItems;
  } catch (error) {
    console.error('❌ Error in getMonsterLoot:', error);
    return [];
  }
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
