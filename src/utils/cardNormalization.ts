import { Card } from "@/types/cards";

/**
 * Normalized card storage using Map for O(1) access
 */
export interface NormalizedCards {
  byId: Map<string, Card>;
  allIds: string[];
}

/**
 * Convert array of cards to normalized structure
 */
export function normalizeCards(cards: Card[]): NormalizedCards {
  const byId = new Map<string, Card>();
  const allIds: string[] = [];

  cards.forEach(card => {
    byId.set(card.id, card);
    allIds.push(card.id);
  });

  return { byId, allIds };
}

/**
 * Convert normalized structure back to array
 */
export function denormalizeCards(normalized: NormalizedCards): Card[] {
  return normalized.allIds.map(id => normalized.byId.get(id)!).filter(Boolean);
}

/**
 * Get card by ID (O(1) operation)
 */
export function getCardById(normalized: NormalizedCards, id: string): Card | undefined {
  return normalized.byId.get(id);
}

/**
 * Update card in normalized structure
 */
export function updateCard(normalized: NormalizedCards, card: Card): NormalizedCards {
  const newById = new Map(normalized.byId);
  newById.set(card.id, card);
  
  return {
    byId: newById,
    allIds: normalized.allIds.includes(card.id) 
      ? normalized.allIds 
      : [...normalized.allIds, card.id]
  };
}

/**
 * Add card to normalized structure
 */
export function addCard(normalized: NormalizedCards, card: Card): NormalizedCards {
  if (normalized.byId.has(card.id)) {
    return updateCard(normalized, card);
  }

  const newById = new Map(normalized.byId);
  newById.set(card.id, card);

  return {
    byId: newById,
    allIds: [...normalized.allIds, card.id]
  };
}

/**
 * Remove card from normalized structure
 */
export function removeCard(normalized: NormalizedCards, cardId: string): NormalizedCards {
  const newById = new Map(normalized.byId);
  newById.delete(cardId);

  return {
    byId: newById,
    allIds: normalized.allIds.filter(id => id !== cardId)
  };
}

/**
 * Filter cards by predicate
 */
export function filterCards(
  normalized: NormalizedCards, 
  predicate: (card: Card) => boolean
): NormalizedCards {
  const filtered: Card[] = [];
  const filteredIds: string[] = [];

  normalized.allIds.forEach(id => {
    const card = normalized.byId.get(id);
    if (card && predicate(card)) {
      filtered.push(card);
      filteredIds.push(id);
    }
  });

  return normalizeCards(filtered);
}

/**
 * Group cards by a key function (for duplicate detection)
 */
export function groupCards<K>(
  normalized: NormalizedCards,
  keyFn: (card: Card) => K
): Map<K, Card[]> {
  const groups = new Map<K, Card[]>();

  normalized.allIds.forEach(id => {
    const card = normalized.byId.get(id);
    if (!card) return;

    const key = keyFn(card);
    const group = groups.get(key) || [];
    group.push(card);
    groups.set(key, group);
  });

  return groups;
}

/**
 * Find cards that match another card (same name, rarity, type, faction)
 */
export function findMatchingCards(
  normalized: NormalizedCards,
  targetCard: Card
): Card[] {
  const matching: Card[] = [];

  normalized.allIds.forEach(id => {
    const card = normalized.byId.get(id);
    if (!card) return;

    if (
      card.name === targetCard.name &&
      card.rarity === targetCard.rarity &&
      card.type === targetCard.type &&
      card.faction === targetCard.faction
    ) {
      matching.push(card);
    }
  });

  return matching;
}

/**
 * Get group key for card (used for stacking identical cards)
 */
export function getCardGroupKey(card: Card): string {
  return `${card.name}_${card.rarity}_${card.type}_${card.faction || 'none'}`;
}

/**
 * Batch update multiple cards
 */
export function batchUpdateCards(
  normalized: NormalizedCards,
  updates: Card[]
): NormalizedCards {
  const newById = new Map(normalized.byId);
  const newIds = new Set(normalized.allIds);

  updates.forEach(card => {
    newById.set(card.id, card);
    newIds.add(card.id);
  });

  return {
    byId: newById,
    allIds: Array.from(newIds)
  };
}

/**
 * Batch remove multiple cards
 */
export function batchRemoveCards(
  normalized: NormalizedCards,
  cardIds: string[]
): NormalizedCards {
  const newById = new Map(normalized.byId);
  const removedSet = new Set(cardIds);

  cardIds.forEach(id => newById.delete(id));

  return {
    byId: newById,
    allIds: normalized.allIds.filter(id => !removedSet.has(id))
  };
}
