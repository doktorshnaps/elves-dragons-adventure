import { useMemo } from 'react';
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

export interface CraftingRecipe {
  id: string;
  recipe_name: string;
  result_item_id: number;
  result_quantity: number;
  required_materials: Array<{
    item_id: string;
    quantity: number;
  }>;
  category: string;
  description?: string;
  is_active: boolean;
  crafting_time_hours?: number;
  required_building_id?: string;
  required_building_level?: number;
}

export const useCraftingRecipes = (autoLoad = true) => {
  const { data: staticData, isLoading } = useStaticGameDataContext();

  const recipes = useMemo(() => {
    if (!autoLoad || !staticData?.crafting_recipes) {
      return [];
    }
    return staticData.crafting_recipes as unknown as CraftingRecipe[];
  }, [staticData?.crafting_recipes, autoLoad]);

  const loading = autoLoad ? isLoading : false;

  const reload = async () => {
    // Реализация reload больше не нужна, так как данные берутся из кеша
    console.log('Crafting recipes reload is no longer needed with static data cache');
  };

  return {
    recipes,
    loading,
    reload
  };
};
