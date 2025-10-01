import { useMemo } from 'react';
import { Card } from '@/types/cards';
import { 
  normalizeCards, 
  denormalizeCards, 
  getCardById,
  filterCards,
  groupCards,
  findMatchingCards,
  getCardGroupKey,
  type NormalizedCards 
} from '@/utils/cardNormalization';

/**
 * Hook for working with normalized card data
 * Provides O(1) lookups and efficient operations
 */
export const useNormalizedCards = (cards: Card[]) => {
  // Normalize cards into Map structure
  const normalized = useMemo(() => normalizeCards(cards), [cards]);

  // Get card by ID (O(1))
  const getCard = useMemo(
    () => (id: string) => getCardById(normalized, id),
    [normalized]
  );

  // Get multiple cards by IDs
  const getCards = useMemo(
    () => (ids: string[]) => {
      return ids.map(id => getCardById(normalized, id)).filter(Boolean) as Card[];
    },
    [normalized]
  );

  // Filter cards by type
  const getCardsByType = useMemo(
    () => (type: Card['type']) => {
      return denormalizeCards(filterCards(normalized, card => card.type === type));
    },
    [normalized]
  );

  // Filter cards by faction
  const getCardsByFaction = useMemo(
    () => (faction: Card['faction']) => {
      return denormalizeCards(filterCards(normalized, card => card.faction === faction));
    },
    [normalized]
  );

  // Get grouped cards (for stacking identical cards)
  const groupedCards = useMemo(() => {
    const groups = groupCards(normalized, getCardGroupKey);
    
    return Array.from(groups.entries()).map(([key, cards]) => ({
      key,
      cards,
      count: cards.length,
      sample: cards[0]
    }));
  }, [normalized]);

  // Find matching cards for upgrade/combination
  const getMatchingCards = useMemo(
    () => (card: Card) => findMatchingCards(normalized, card),
    [normalized]
  );

  // Check if card exists
  const hasCard = useMemo(
    () => (id: string) => normalized.byId.has(id),
    [normalized]
  );

  // Get total card count
  const totalCount = normalized.allIds.length;

  // Get cards by rarity
  const getCardsByRarity = useMemo(
    () => (rarity: Card['rarity']) => {
      return denormalizeCards(filterCards(normalized, card => card.rarity === rarity));
    },
    [normalized]
  );

  // Convert back to array when needed
  const toArray = useMemo(
    () => () => denormalizeCards(normalized),
    [normalized]
  );

  return {
    normalized,
    cards,
    getCard,
    getCards,
    getCardsByType,
    getCardsByFaction,
    getCardsByRarity,
    groupedCards,
    getMatchingCards,
    hasCard,
    totalCount,
    toArray
  };
};

/**
 * Hook for getting card statistics
 */
export const useCardStats = (cards: Card[]) => {
  const { normalized, getCardsByType, getCardsByRarity } = useNormalizedCards(cards);

  return useMemo(() => {
    const heroes = getCardsByType('character');
    const pets = getCardsByType('pet');
    const workers = getCardsByType('workers');

    const byRarity = {
      1: getCardsByRarity(1).length,
      2: getCardsByRarity(2).length,
      3: getCardsByRarity(3).length,
      4: getCardsByRarity(4).length,
      5: getCardsByRarity(5).length,
      6: getCardsByRarity(6).length,
      7: getCardsByRarity(7).length,
      8: getCardsByRarity(8).length,
    };

    return {
      total: normalized.allIds.length,
      heroes: heroes.length,
      pets: pets.length,
      workers: workers.length,
      byRarity
    };
  }, [normalized, getCardsByType, getCardsByRarity]);
};
