import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingConfig {
  id: string;
  building_id: string;
  building_name: string;
  level: number;
  production_per_hour: number;
  cost_wood: number;
  cost_stone: number;
  cost_iron: number;
  cost_gold: number;
  cost_ell: number;
  cost_gt: number;
  required_items: any;
  required_main_hall_level: number;
  upgrade_time_hours: number;
  storage_capacity: number;
  working_hours: number;
  is_active: boolean;
  background_image_url?: string;
}

export const useBuildingConfigs = () => {
  const [configs, setConfigs] = useState<Map<string, BuildingConfig[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();

    // Subscribe to changes
    const channel = supabase
      .channel('building_configs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'building_configs',
        },
        () => {
          loadConfigs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('building_configs')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) throw error;

      // Group by building_id
      const grouped = new Map<string, BuildingConfig[]>();
      data?.forEach(config => {
        const existing = grouped.get(config.building_id) || [];
        grouped.set(config.building_id, [...existing, config as BuildingConfig]);
      });

      setConfigs(grouped);
    } catch (error) {
      console.error('Error loading building configs:', error);
    } finally {
      setLoading(false);
    }
  };

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
      iron: config.cost_iron,
      gold: config.cost_gold,
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
