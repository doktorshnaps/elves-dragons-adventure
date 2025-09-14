import { Card } from '@/types/cards';

const HEAL_RATE = 1; // 1 HP per interval
const HEAL_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds

/**
 * Initialize card health if not set
 */
export const initializeCardHealth = (card: Card): Card => {
  return {
    ...card,
    currentHealth: card.currentHealth ?? card.health,
    lastHealTime: card.lastHealTime ?? Date.now()
  };
};

/**
 * Calculate how much health should be restored based on time passed
 */
export const calculateHealthRegeneration = (card: Card): Card => {
  const now = Date.now();
  const lastHeal = card.lastHealTime ?? now;
  const timePassed = now - lastHeal;
  
  // If not enough time has passed, return original card
  if (timePassed < HEAL_INTERVAL) {
    return card;
  }
  
  // Calculate how many heal intervals have passed
  const healIntervals = Math.floor(timePassed / HEAL_INTERVAL);
  const healthToRestore = healIntervals * HEAL_RATE;
  
  const currentHealth = card.currentHealth ?? card.health;
  const newHealth = Math.min(card.health, currentHealth + healthToRestore);
  
  // Update last heal time to the last complete interval
  const newLastHealTime = lastHeal + (healIntervals * HEAL_INTERVAL);
  
  return {
    ...card,
    currentHealth: newHealth,
    lastHealTime: newLastHealTime
  };
};

/**
 * Apply damage to a card
 */
export const applyDamageToCard = (card: Card, damage: number): Card => {
  const currentHealth = card.currentHealth ?? card.health;
  const newHealth = Math.max(0, currentHealth - damage);
  
  const updatedCard = {
    ...card,
    currentHealth: newHealth
  };

  // Dispatch event to synchronize health across all components
  const event = new CustomEvent('cardHealthChanged', { 
    detail: { card: updatedCard, damage }
  });
  window.dispatchEvent(event);

  return updatedCard;
};

/**
 * Process health regeneration for all cards
 */
export const processCardsHealthRegeneration = (cards: Card[]): Card[] => {
  return cards.map(card => {
    const initializedCard = initializeCardHealth(card);
    return calculateHealthRegeneration(initializedCard);
  });
};

/**
 * Get card health percentage for UI
 */
export const getCardHealthPercentage = (card: Card): number => {
  const currentHealth = card.currentHealth ?? card.health;
  return (currentHealth / card.health) * 100;
};

/**
 * Check if card is at full health
 */
export const isCardAtFullHealth = (card: Card): boolean => {
  const currentHealth = card.currentHealth ?? card.health;
  return currentHealth >= card.health;
};

/**
 * Check if card is alive (has health > 0)
 */
export const isCardAlive = (card: Card): boolean => {
  const currentHealth = card.currentHealth ?? card.health;
  return currentHealth > 0;
};