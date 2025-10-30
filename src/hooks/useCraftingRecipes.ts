import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

export const useCraftingRecipes = () => {
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();

    // Подписка на изменения
    const channel = supabase
      .channel('crafting_recipes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crafting_recipes'
        },
        () => {
          loadRecipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('crafting_recipes')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('recipe_name', { ascending: true });

      if (error) throw error;
      setRecipes((data || []) as unknown as CraftingRecipe[]);
    } catch (error) {
      console.error('Error loading crafting recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recipes,
    loading,
    reload: loadRecipes
  };
};
