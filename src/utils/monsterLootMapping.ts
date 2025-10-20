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

// Получить ВСЕ предметы от монстра (100% шанс для тестирования)
export const getMonsterLoot = (monsterName: string): Item[] => {
  console.log('🎲 Getting ALL loot for monster:', monsterName);
  
  // Убираем уровень из имени монстра (например, "Паучок-скелет (Lv1)" -> "Паучок-скелет")
  const cleanName = monsterName.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
  console.log('🧹 Cleaned monster name:', cleanName);
  
  // Используем ВСЕ загруженные шаблоны предметов из базы данных
  if (ALL_ITEM_TEMPLATES.length === 0) {
    console.warn('⚠️ Item templates not loaded yet, using empty array');
    return [];
  }

  console.log(`🎁 Generating loot from ${ALL_ITEM_TEMPLATES.length} available item templates`);

  // 100% шанс дропа ВСЕХ предметов для тестирования
  const allItems: Item[] = [];
  
  for (const template of ALL_ITEM_TEMPLATES) {
    // Маппинг типов из базы данных в типы Item
    const typeMapping: Record<string, Item['type']> = {
      'material': 'material',  // ✅ Материалы остаются как material
      'consumable': 'healthPotion',
      'scroll': 'illusionManuscript',
      'accessory': 'accessory',
      'tool': 'dwarvenTongs',
      'weapon': 'weapon',
      'armor': 'armor',
      'dragon_egg': 'dragon_egg'
    };
    
    // Используем тип из базы данных
    let itemType: Item['type'] = typeMapping[template.type] || 'material';
    
    const finalItem: Item = {
      id: uuidv4(),
      name: template.name,
      type: itemType,
      value: template.value || 0,
      sell_price: template.sell_price,
      description: template.description || `Выпадает с: ${cleanName}`,
      image: template.image_url || undefined,
      stats: template.stats || undefined,
      slot: template.slot || undefined
    };
    
    allItems.push(finalItem);
  }
  
  console.log(`🎉 Total items generated: ${allItems.length} for monster: ${cleanName}`);
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