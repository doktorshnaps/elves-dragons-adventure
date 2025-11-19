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

// Маппинг монстров к предметам (все монстры могут дропать любые предметы с шансом из базы данных)
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

// Получить лут от монстра с учётом шансов дропа и настроек подземелий
export const getMonsterLoot = async (monsterName: string, dungeonNumber?: number, currentLevel?: number, walletAddress?: string): Promise<Item[]> => {
  console.log('🎲 Rolling for loot from monster:', monsterName, 'Dungeon:', dungeonNumber, 'Level:', currentLevel);
  
  // Убираем уровень из имени монстра (например, "Паучок-скелет (Lv1)" -> "Паучок-скелет")
  const cleanName = monsterName.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
  console.log('🧹 Cleaned monster name:', cleanName);

  // Проверяем активное treasure hunt событие
  if (dungeonNumber !== undefined && walletAddress) {
    try {
      const { data: activeEvent, error: eventError } = await supabase
        .from('treasure_hunt_events')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!eventError && activeEvent) {
        console.log('🎯 Active treasure hunt event found:', activeEvent);
        
        // Проверяем, подходит ли монстр и подземелье
        const matchesDungeon = !activeEvent.dungeon_number || activeEvent.dungeon_number === dungeonNumber;
        
        // Преобразуем monster_id к строчным буквам и ищем совпадение
        const monsterIdLower = activeEvent.monster_id?.toLowerCase() || '';
        const cleanNameLower = cleanName.toLowerCase();
        
        // Проверяем различные варианты имени монстра
        const matchesMonster = !activeEvent.monster_id || 
                              cleanNameLower.includes(monsterIdLower) ||
                              monsterIdLower.includes(cleanNameLower) ||
                              cleanNameLower.replace(/\s+/g, '-').includes(monsterIdLower) ||
                              monsterIdLower.replace(/\s+/g, '-').includes(cleanNameLower.replace(/\s+/g, '-'));
        
        console.log('🔍 Monster matching:', {
          activeEventMonsterId: activeEvent.monster_id,
          cleanName,
          matchesDungeon,
          matchesMonster
        });
        
        if (matchesDungeon && matchesMonster && activeEvent.found_quantity < activeEvent.total_quantity) {
          console.log('✨ Treasure hunt conditions met! Rolling for special drop...');
          
          const roll = Math.random() * 100;
          if (roll <= (activeEvent.drop_chance || 0)) {
            console.log(`🎊 TREASURE HUNT ITEM DROPPED! ${activeEvent.item_name} (${roll.toFixed(2)}% <= ${activeEvent.drop_chance}%)`);
            
            // Увеличиваем счётчик найденных предметов в событии
            await supabase
              .from('treasure_hunt_events')
              .update({ found_quantity: activeEvent.found_quantity + 1 })
              .eq('id', activeEvent.id);
            
            // Вызываем серверную функцию для регистрации находки
            // Используем claim_key на основе события и кошелька для идемпотентности
            const claimKey = `treasure_hunt_${activeEvent.id}_${walletAddress}_${Date.now()}`;
            
            try {
              const { data: claimResult, error: claimError } = await supabase.functions.invoke('claim-item-reward', {
                body: {
                  wallet_address: walletAddress,
                  claim_key: claimKey,
                  treasure_hunt_event_id: activeEvent.id,
                  treasure_hunt_quantity: 1,
                  items: [{
                    name: activeEvent.item_name,
                    type: 'material',
                    template_id: activeEvent.item_template_id,
                    item_id: null
                  }]
                }
              });
              
              if (claimError) {
                console.error('❌ Failed to claim treasure hunt reward:', claimError);
              } else {
                console.log('✅ Treasure hunt finding registered via edge function:', claimResult);
              }
            } catch (err) {
              console.error('❌ Exception calling claim-item-reward:', err);
            }
            
            // Edge function уже добавил предмет в БД через claim-item-reward
            // Возвращаем пустой массив чтобы избежать дублирования в claimRewardAndExit
            console.log('🎁 Treasure hunt item already added to DB via edge function, returning empty array to prevent duplication');
            return [];
          } else {
            console.log(`❌ Treasure hunt roll failed: ${roll.toFixed(2)}% > ${activeEvent.drop_chance}%`);
          }
        } else {
          console.log('⚠️ Treasure hunt event exists but conditions not met:', {
            matchesDungeon,
            matchesMonster,
            foundQuantity: activeEvent.found_quantity,
            totalQuantity: activeEvent.total_quantity
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking treasure hunt event:', error);
    }
  }
  
  // Используем ВСЕ загруженные шаблоны предметов из базы данных
  if (ALL_ITEM_TEMPLATES.length === 0) {
    console.warn('⚠️ Item templates not loaded yet, using empty array');
    return [];
  }

  console.log(`🎁 Rolling loot from ${ALL_ITEM_TEMPLATES.length} available item templates`);

  // Собираем предметы с учётом шанса дропа
  const droppedItems: Item[] = [];
  
  for (const template of ALL_ITEM_TEMPLATES) {
    // Проверяем настройки дропа для подземелий
    let canDrop = false;
    let effectiveDropChance = template.drop_chance || 0;
    
    if (dungeonNumber !== undefined && currentLevel !== undefined && template.dungeon_drop_settings && Array.isArray(template.dungeon_drop_settings)) {
      // Ищем подходящую настройку дропа для текущего подземелья и уровня
      const dungeonSettings = template.dungeon_drop_settings.find((setting: any) => {
        const matchesDungeon = setting.dungeon_number === dungeonNumber;
        const matchesLevel = currentLevel >= setting.min_level && (setting.max_level === null || currentLevel <= setting.max_level);
        const isActive = setting.is_active !== false;
        
        // Проверяем, разрешен ли дроп с этого монстра
        const matchesMonster = !setting.allowed_monsters || 
                               setting.allowed_monsters.length === 0 || 
                               setting.allowed_monsters.includes(cleanName);
        
        return matchesDungeon && matchesLevel && isActive && matchesMonster;
      });
      
      if (dungeonSettings) {
        canDrop = true;
        effectiveDropChance = dungeonSettings.drop_chance || effectiveDropChance;
        console.log(`✅ Item ${template.name} can drop from ${cleanName} in dungeon ${dungeonNumber}, level ${currentLevel} (chance: ${effectiveDropChance}%)`);
      } else {
        console.log(`❌ Item ${template.name} cannot drop from ${cleanName} in dungeon ${dungeonNumber}, level ${currentLevel} (no matching settings or wrong monster)`);
      }
    } else {
      // Если настройки подземелья не указаны, используем базовый шанс дропа
      canDrop = true;
      console.log(`⚠️ No dungeon settings for item ${template.name}, using base drop chance: ${effectiveDropChance}%`);
    }
    
    if (!canDrop) {
      continue;
    }
    
    // Генерируем случайное число от 0 до 100
    const roll = Math.random() * 100;
    
    // Проверяем, выпал ли предмет
    if (roll <= effectiveDropChance) {
      console.log(`✅ Item dropped: ${template.name} (chance: ${effectiveDropChance}%, roll: ${roll.toFixed(2)}%)`);
      
      // Маппинг типов из базы данных в типы Item
      const typeMapping: Record<string, Item['type']> = {
        'material': 'material',
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
      
      droppedItems.push(finalItem);
    } else {
      console.log(`❌ Item NOT dropped: ${template.name} (chance: ${effectiveDropChance}%, roll: ${roll.toFixed(2)}%)`);
    }
  }
  
  console.log(`🎉 Total items dropped: ${droppedItems.length}/${ALL_ITEM_TEMPLATES.length} for monster: ${cleanName}`);
  return droppedItems;
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