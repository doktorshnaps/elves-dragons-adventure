import { useMemo } from 'react';
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

interface BuildingConfig {
  id: string;
  building_id: string;
  building_name: string;
  level: number;
  production_per_hour: number;
  cost_wood: number;
  cost_stone: number;
  cost_ell: number;
  cost_gt: number;
  required_items: any;
  required_buildings: any;
  required_main_hall_level: number;
  upgrade_time_hours: number;
  storage_capacity: number;
  working_hours: number;
  is_active: boolean;
  background_image_url?: string;
}

export const useBuildingConfigs = (autoLoad = true) => {
  const { data: staticData, isLoading } = useStaticGameDataContext();

  const configs = useMemo(() => {
    if (!autoLoad || !staticData?.building_configs) {
      return new Map<string, BuildingConfig[]>();
    }

    // Group by building_id
    const grouped = new Map<string, BuildingConfig[]>();
    staticData.building_configs.forEach((config: any) => {
      const existing = grouped.get(config.building_id) || [];
      grouped.set(config.building_id, [...existing, config as BuildingConfig]);
    });

    return grouped;
  }, [staticData?.building_configs, autoLoad]);

  const loading = autoLoad ? isLoading : false;

  const getBuildingConfig = (buildingId: string, level: number): BuildingConfig | null => {
    const buildingConfigs = configs.get(buildingId);
    if (!buildingConfigs) return null;
    return buildingConfigs.find(c => c.level === level) || null;
  };

  const getProductionRate = (buildingId: string, level: number): number => {
    const config = getBuildingConfig(buildingId, level);
    return config?.production_per_hour || 0;
  };

  const getUpgradeCost = (buildingId: string, currentLevel: number) => {
    const config = getBuildingConfig(buildingId, currentLevel + 1);
    if (!config) return null;

    return {
      wood: config.cost_wood,
      stone: config.cost_stone,
      ell: config.cost_ell,
      gt: config.cost_gt,
    };
  };

  const getWorkingHours = (level: number): number => {
    const config = getBuildingConfig('storage', level);
    return config?.working_hours || 1;
  };

  return {
    configs,
    loading,
    getBuildingConfig,
    getProductionRate,
    getUpgradeCost,
    getWorkingHours,
  };
};
