import { useMemo } from "react";
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';
import { FactionElement } from './useStaticGameData';

export type { FactionElement };

export const useFactionElements = () => {
  const contextData = useStaticGameDataContext();
  const staticData = contextData?.data;
  const loading = contextData?.isLoading ?? true;

  const factionElements = useMemo(() => {
    if (!staticData?.faction_elements) {
      return { byFaction: new Map<string, FactionElement>(), byElement: new Map<string, FactionElement>(), all: [] };
    }

    const byFaction = new Map<string, FactionElement>();
    const byElement = new Map<string, FactionElement>();
    const all = staticData.faction_elements as FactionElement[];

    all.forEach((fe: FactionElement) => {
      if (fe.faction_name) byFaction.set(fe.faction_name, fe);
      if (fe.element_type) byElement.set(fe.element_type, fe);
    });

    console.log('✅ [useFactionElements] Elements loaded:', {
      byFactionSize: byFaction.size,
      byElementSize: byElement.size,
      totalCount: all.length
    });

    return { byFaction, byElement, all };
  }, [staticData?.faction_elements]);

  const getFactionElement = (factionName: string): FactionElement | undefined => {
    return factionElements.byFaction.get(factionName);
  };

  const getElementByType = (elementType: string): FactionElement | undefined => {
    return factionElements.byElement.get(elementType);
  };

  return { 
    factionElements: factionElements.all, 
    byFaction: factionElements.byFaction,
    byElement: factionElements.byElement,
    loading, 
    getFactionElement, 
    getElementByType 
  };
};

export interface ElementalModifierResult {
  modifier: number;
  type: 'bonus' | 'penalty' | 'neutral';
  attackerEmoji: string;
  defenderEmoji: string;
  message: string;
}

export const calculateElementalDamageModifier = (
  factionElements: FactionElement[],
  attackerFaction: string | undefined,
  defenderElement: string
): ElementalModifierResult => {
  const neutral: ElementalModifierResult = { 
    modifier: 1.0, 
    type: 'neutral', 
    attackerEmoji: '', 
    defenderEmoji: getElementEmoji(defenderElement),
    message: '' 
  };

  if (!attackerFaction || defenderElement === 'neutral' || !factionElements.length) {
    return neutral;
  }

  const factionElement = factionElements.find(fe => fe.faction_name === attackerFaction);
  
  if (!factionElement) {
    return neutral;
  }

  // Strong against - bonus damage
  if (factionElement.strong_against === defenderElement) {
    return { 
      modifier: 1.0 + Number(factionElement.damage_bonus), 
      type: 'bonus',
      attackerEmoji: factionElement.element_emoji,
      defenderEmoji: getElementEmoji(defenderElement),
      message: `${factionElement.element_emoji} ${getElementName(factionElement.element_type)} силен против ${getElementEmoji(defenderElement)} ${getElementName(defenderElement)}! +${Math.round(Number(factionElement.damage_bonus) * 100)}% урона`
    };
  }
  
  // Weak against - penalty damage
  if (factionElement.weak_against === defenderElement) {
    return { 
      modifier: 1.0 - Number(factionElement.damage_penalty), 
      type: 'penalty',
      attackerEmoji: factionElement.element_emoji,
      defenderEmoji: getElementEmoji(defenderElement),
      message: `${factionElement.element_emoji} ${getElementName(factionElement.element_type)} слаб против ${getElementEmoji(defenderElement)} ${getElementName(defenderElement)}! -${Math.round(Number(factionElement.damage_penalty) * 100)}% урона`
    };
  }

  return { 
    modifier: 1.0, 
    type: 'neutral', 
    attackerEmoji: factionElement.element_emoji,
    defenderEmoji: getElementEmoji(defenderElement),
    message: ''
  };
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

// Get team's elemental composition for display
export const getTeamElementInfo = (
  factionElements: FactionElement[],
  teamFactions: string[]
): { elements: string[]; emojis: string[] } => {
  const elements: string[] = [];
  const emojis: string[] = [];
  
  const uniqueFactions = [...new Set(teamFactions)];
  
  uniqueFactions.forEach(faction => {
    const fe = factionElements.find(f => f.faction_name === faction);
    if (fe) {
      elements.push(fe.element_type);
      emojis.push(fe.element_emoji);
    }
  });
  
  return { elements, emojis };
};
