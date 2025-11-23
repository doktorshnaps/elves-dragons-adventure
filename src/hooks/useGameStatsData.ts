import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroBaseStats {
  id: string;
  health: number;
  defense: number;
  power: number;
  magic: number;
}

interface DragonBaseStats {
  id: string;
  health: number;
  defense: number;
  power: number;
  magic: number;
}

interface RarityMultiplier {
  id: string;
  rarity: number;
  multiplier: number;
}

interface ClassMultiplier {
  id: string;
  class_name: string;
  health_multiplier: number;
  defense_multiplier: number;
  power_multiplier: number;
  magic_multiplier: number;
}

export const useHeroBaseStats = () => {
  return useQuery<HeroBaseStats | null>({
    queryKey: ['heroBaseStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_base_stats')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading hero base stats:', error);
        return null;
      }
      
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
};

export const useDragonBaseStats = () => {
  return useQuery<DragonBaseStats | null>({
    queryKey: ['dragonBaseStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dragon_base_stats')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading dragon base stats:', error);
        return null;
      }
      
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
};

export const useRarityMultipliers = () => {
  return useQuery<RarityMultiplier[]>({
    queryKey: ['rarityMultipliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rarity_multipliers')
        .select('*')
        .order('rarity', { ascending: true });

      if (error) {
        console.error('Error loading rarity multipliers:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
};

export const useClassMultipliers = () => {
  return useQuery<ClassMultiplier[]>({
    queryKey: ['classMultipliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_multipliers')
        .select('*')
        .order('class_name', { ascending: true });

      if (error) {
        console.error('Error loading class multipliers:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
};

export const useDragonClassMultipliers = () => {
  return useQuery<ClassMultiplier[]>({
    queryKey: ['dragonClassMultipliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dragon_class_multipliers')
        .select('*')
        .order('class_name', { ascending: true });

      if (error) {
        console.error('Error loading dragon class multipliers:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
};
