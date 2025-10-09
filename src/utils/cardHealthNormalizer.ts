import { Card } from '@/types/cards';
import { calculateCardStats } from './cardUtils';

/**
 * Normalizes card health values to ensure health (max) is correct
 * This prevents corruption where health gets overwritten with currentHealth
 */
export const normalizeCardHealth = (card: Card): Card => {
  // Calculate correct max health based on card stats
  const calculatedStats = calculateCardStats(
    card.name,
    Number(card.rarity) as any,
    card.type === 'pet' ? 'pet' : 'character'
  );
  
  const correctMaxHealth = calculatedStats.health;
  const currentHealth = card.currentHealth ?? card.health;
  
  // If card.health is less than currentHealth, it's corrupted - fix it
  const needsFix = card.health < currentHealth || card.health < correctMaxHealth * 0.5;
  
  if (needsFix) {
    console.log(`🔧 Normalizing health for ${card.name}: ${card.health} -> ${correctMaxHealth}`);
    return {
      ...card,
      health: correctMaxHealth,
      currentHealth: Math.min(currentHealth, correctMaxHealth)
    };
  }
  
  return card;
};

/**
 * Normalizes an array of cards
 */
export const normalizeCardsHealth = (cards: Card[]): Card[] => {
  return cards.map(normalizeCardHealth);
};
