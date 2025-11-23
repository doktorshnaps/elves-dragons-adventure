import { useMemo } from "react";
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

export interface Monster {
  id: string;
  monster_id: string;
  monster_name: string;
  monster_type: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_wallet_address: string;
}

export const useMonsters = () => {
  const contextData = useStaticGameDataContext();
  const staticData = contextData?.data;
  const loading = contextData?.isLoading ?? true;

  console.log('🐉 [useMonsters] Context data:', {
    hasContext: !!contextData,
    isLoading: contextData?.isLoading,
    hasData: !!contextData?.data,
    hasMonsters: !!staticData?.monsters,
    monstersCount: staticData?.monsters?.length,
    firstMonster: staticData?.monsters?.[0]
  });

  const monsters = useMemo(() => {
    if (!staticData?.monsters) {
      console.warn('⚠️ [useMonsters] No monsters in static data');
      return { byId: new Map<string, Monster>(), byName: new Map<string, Monster>(), all: [] };
    }

    const byId = new Map<string, Monster>();
    const byName = new Map<string, Monster>();
    const all = staticData.monsters as Monster[];

    all.forEach((monster: Monster) => {
      if (monster.monster_id) byId.set(monster.monster_id, monster);
      if (monster.monster_name) byName.set(monster.monster_name, monster);
    });

    console.log('✅ [useMonsters] Monsters loaded:', {
      byIdSize: byId.size,
      byNameSize: byName.size,
      totalCount: all.length
    });

    return { byId, byName, all };
  }, [staticData?.monsters]);

  const getMonsterById = (monsterId: string): Monster | undefined => {
    return monsters.byId.get(monsterId);
  };

  const getMonsterByName = (name: string): Monster | undefined => {
    return monsters.byName.get(name);
  };

  return { 
    monsters: monsters.all, 
    byId: monsters.byId,
    byName: monsters.byName,
    loading, 
    getMonsterById, 
    getMonsterByName 
  };
};
