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

// Получить предметы от монстра (дропы настраиваются вручную через админ панель)
export const getMonsterLoot = (monsterName: string): Item[] => {
  console.log('🎲 Getting loot for monster:', monsterName);
  
  // Убираем уровень из имени монстра (например, "Паучок-скелет (Lv1)" -> "Паучок-скелет")
  const cleanName = monsterName.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
  console.log('🧹 Cleaned monster name:', cleanName);
  
  // Дропы настраиваются вручную через dungeon_item_drops таблицу
  console.log('ℹ️ Item drops are configured manually via admin panel');
  return [];
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