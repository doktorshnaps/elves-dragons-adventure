import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

export const useCardUpgradeRequirements = () => {
  const [requirements, setRequirements] = useState<CardUpgradeRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequirements();

    // Подписка на изменения
    const channel = supabase
      .channel('card_upgrade_requirements_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_upgrade_requirements'
        },
        () => {
          loadRequirements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('card_upgrade_requirements')
        .select('*')
        .eq('is_active', true)
        .order('card_type', { ascending: true })
        .order('from_rarity', { ascending: true });

      if (error) throw error;
      setRequirements((data || []) as unknown as CardUpgradeRequirement[]);
    } catch (error) {
      console.error('Error loading card upgrade requirements:', error);
    } finally {
      setLoading(false);
    }
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
    reload: loadRequirements
  };
};
