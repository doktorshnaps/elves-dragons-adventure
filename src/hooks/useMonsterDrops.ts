import { useMemo } from "react";
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';
import { ItemTemplate } from './useItemTemplates';

export interface MonsterDrop {
  item: ItemTemplate;
  dropChance: number;
}

/**
 * Hook for getting possible item drops for a monster in a specific dungeon/level
 */
export const useMonsterDrops = (
  monsterName: string,
  dungeonNumber?: number,
  level?: number
) => {
  const contextData = useStaticGameDataContext();
  const staticData = contextData?.data;
  const loading = contextData?.isLoading ?? true;

  const drops = useMemo(() => {
    if (!staticData?.item_templates || dungeonNumber === undefined) {
      return [];
    }

    // Clean monster name (remove level suffix like "(Lv1)")
    const cleanName = monsterName.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
    
    const possibleDrops: MonsterDrop[] = [];

    staticData.item_templates.forEach((template: ItemTemplate) => {
      if (!template.dungeon_drop_settings || !Array.isArray(template.dungeon_drop_settings)) {
        return;
      }

      // Find matching drop settings for this dungeon/level
      const matchingSettings = template.dungeon_drop_settings.find((setting: any) => {
        const matchesDungeon = setting.dungeon_number === dungeonNumber;
        const matchesLevel = level === undefined || (
          level >= setting.min_level && 
          (setting.max_level === null || level <= setting.max_level)
        );
        const isActive = setting.is_active !== false;
        
        // Check if this monster is allowed for this drop
        const matchesMonster = !setting.allowed_monsters || 
                               setting.allowed_monsters.length === 0 || 
                               setting.allowed_monsters.includes(cleanName) ||
                               setting.allowed_monsters.some((m: string) => 
                                 m.toLowerCase().includes(cleanName.toLowerCase()) ||
                                 cleanName.toLowerCase().includes(m.toLowerCase())
                               );
        
        return matchesDungeon && matchesLevel && isActive && matchesMonster;
      });

      if (matchingSettings) {
        possibleDrops.push({
          item: template,
          dropChance: matchingSettings.drop_chance || 0
        });
      }
    });

    // Sort by drop chance descending
    return possibleDrops.sort((a, b) => b.dropChance - a.dropChance);
  }, [staticData?.item_templates, monsterName, dungeonNumber, level]);

  return { drops, loading };
};

/**
 * Get all possible drops for any monster in a dungeon (for grimoire overview)
 */
export const useDungeonDrops = (dungeonNumber?: number) => {
  const contextData = useStaticGameDataContext();
  const staticData = contextData?.data;
  const loading = contextData?.isLoading ?? true;

  const drops = useMemo(() => {
    if (!staticData?.item_templates || dungeonNumber === undefined) {
      return [];
    }

    const possibleDrops: MonsterDrop[] = [];

    staticData.item_templates.forEach((template: ItemTemplate) => {
      if (!template.dungeon_drop_settings || !Array.isArray(template.dungeon_drop_settings)) {
        return;
      }

      // Find any active settings for this dungeon
      const matchingSettings = template.dungeon_drop_settings.find((setting: any) => {
        return setting.dungeon_number === dungeonNumber && setting.is_active !== false;
      });

      if (matchingSettings) {
        possibleDrops.push({
          item: template,
          dropChance: matchingSettings.drop_chance || 0
        });
      }
    });

    // Sort by drop chance descending
    return possibleDrops.sort((a, b) => b.dropChance - a.dropChance);
  }, [staticData?.item_templates, dungeonNumber]);

  return { drops, loading };
};
