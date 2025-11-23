import { useMemo } from "react";
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

export interface DungeonSettings {
  id: string;
  dungeon_number: number;
  dungeon_name: string;
  dungeon_type: string;
  base_hp: number;
  base_armor: number;
  base_atk: number;
  hp_growth: number;
  armor_growth: number;
  atk_growth: number;
  miniboss_hp_multiplier: number | null;
  miniboss_armor_multiplier: number | null;
  miniboss_atk_multiplier: number | null;
  boss_hp_multipliers: any | null;
  boss_armor_multipliers: any | null;
  boss_atk_multipliers: any | null;
  monster_spawn_config: any | null;
  created_at: string;
  updated_at: string;
}

export const useDungeonSettings = () => {
  const contextData = useStaticGameDataContext();
  const staticData = contextData?.data;
  const loading = contextData?.isLoading ?? true;

  console.log('⚔️ [useDungeonSettings] Context data:', {
    hasContext: !!contextData,
    isLoading: contextData?.isLoading,
    hasData: !!contextData?.data,
    hasDungeonSettings: !!staticData?.dungeon_settings,
    dungeonSettingsCount: staticData?.dungeon_settings?.length,
    firstDungeon: staticData?.dungeon_settings?.[0]
  });

  const dungeons = useMemo(() => {
    if (!staticData?.dungeon_settings) {
      console.warn('⚠️ [useDungeonSettings] No dungeon_settings in static data');
      return { byNumber: new Map<number, DungeonSettings>(), byType: new Map<string, DungeonSettings>(), all: [] };
    }

    const byNumber = new Map<number, DungeonSettings>();
    const byType = new Map<string, DungeonSettings>();
    const all = staticData.dungeon_settings as DungeonSettings[];

    all.forEach((dungeon: DungeonSettings) => {
      if (dungeon.dungeon_number) byNumber.set(dungeon.dungeon_number, dungeon);
      if (dungeon.dungeon_type) byType.set(dungeon.dungeon_type, dungeon);
    });

    console.log('✅ [useDungeonSettings] Dungeon settings loaded:', {
      byNumberSize: byNumber.size,
      byTypeSize: byType.size,
      totalCount: all.length
    });

    return { byNumber, byType, all };
  }, [staticData?.dungeon_settings]);

  const getDungeonByNumber = (dungeonNumber: number): DungeonSettings | undefined => {
    return dungeons.byNumber.get(dungeonNumber);
  };

  const getDungeonByType = (dungeonType: string): DungeonSettings | undefined => {
    return dungeons.byType.get(dungeonType);
  };

  return { 
    dungeons: dungeons.all, 
    byNumber: dungeons.byNumber,
    byType: dungeons.byType,
    loading, 
    getDungeonByNumber, 
    getDungeonByType 
  };
};
