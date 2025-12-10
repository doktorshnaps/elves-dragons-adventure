import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FactionElement {
  id: string;
  faction_name: string;
  element_type: string;
  element_emoji: string;
  strong_against: string;
  weak_against: string;
  damage_bonus: number;
  damage_penalty: number;
}

export const useFactionElements = () => {
  return useQuery({
    queryKey: ['factionElements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faction_elements')
        .select('*');
      
      if (error) throw error;
      return data as FactionElement[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
};

export const calculateElementalDamageModifier = (
  factionElements: FactionElement[],
  attackerFaction: string | undefined,
  defenderElement: string
): { modifier: number; type: 'bonus' | 'penalty' | 'neutral'; emoji: string } => {
  if (!attackerFaction || defenderElement === 'neutral' || !factionElements.length) {
    return { modifier: 1.0, type: 'neutral', emoji: '' };
  }

  const factionElement = factionElements.find(fe => fe.faction_name === attackerFaction);
  
  if (!factionElement) {
    return { modifier: 1.0, type: 'neutral', emoji: '' };
  }

  // Strong against - bonus damage
  if (factionElement.strong_against === defenderElement) {
    return { 
      modifier: 1.0 + Number(factionElement.damage_bonus), 
      type: 'bonus',
      emoji: factionElement.element_emoji
    };
  }
  
  // Weak against - penalty damage
  if (factionElement.weak_against === defenderElement) {
    return { 
      modifier: 1.0 - Number(factionElement.damage_penalty), 
      type: 'penalty',
      emoji: factionElement.element_emoji
    };
  }

  return { modifier: 1.0, type: 'neutral', emoji: factionElement.element_emoji };
};

export const getElementEmoji = (element: string): string => {
  const elementEmojis: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    ice: '❄️',
    earth: '🪨',
    nature: '🌿',
    light: '✨',
    darkness: '🌑',
    neutral: '⚪'
  };
  return elementEmojis[element] || '⚪';
};

export const getElementName = (element: string): string => {
  const elementNames: Record<string, string> = {
    fire: 'Огонь',
    water: 'Вода',
    ice: 'Лёд',
    earth: 'Земля',
    nature: 'Природа',
    light: 'Свет',
    darkness: 'Тьма',
    neutral: 'Нейтральная'
  };
  return elementNames[element] || 'Неизвестная';
};
