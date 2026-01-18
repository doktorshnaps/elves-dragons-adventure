import { useMemo } from 'react';
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

export interface CardUpgradeRequirement {
  id: string;
  card_type: 'hero' | 'dragon';
  card_class?: string;
  faction?: string;
  from_rarity: number;
  to_rarity: number;
  success_chance: number;
  cost_ell: number;
  cost_wood?: number;
  cost_stone?: number;
  cost_iron?: number;
  cost_gold?: number;
  required_defeated_monsters?: number;
  required_items: Array<{
    item_id: string;
    name: string;
    quantity: number;
  }>;
  is_active: boolean;
  required_building_id?: string;
  required_building_level?: number;
  upgrade_time_hours?: number;
}

export const useCardUpgradeRequirements = () => {
  const { data: staticData, isLoading } = useStaticGameDataContext();

  const requirements = useMemo(() => {
    if (!staticData?.card_upgrade_requirements) {
      return [];
    }
    return staticData.card_upgrade_requirements as unknown as CardUpgradeRequirement[];
  }, [staticData?.card_upgrade_requirements]);

  const loading = isLoading;

  const reload = async () => {
    // Реализация reload больше не нужна, так как данные берутся из кеша
    console.log('Card upgrade requirements reload is no longer needed with static data cache');
  };

  const getRequirement = (
    cardType: 'hero' | 'dragon', 
    fromRarity: number, 
    toRarity: number,
    cardClass?: string,
    faction?: string
  ): CardUpgradeRequirement | undefined => {
    return requirements.find(
      req => req.card_type === cardType && 
             req.from_rarity === fromRarity && 
             req.to_rarity === toRarity &&
             (!cardClass || req.card_class === cardClass || !req.card_class) &&
             (!faction || req.faction === faction || !req.faction)
    );
  };

  return {
    requirements,
    loading,
    getRequirement,
    reload
  };
};
