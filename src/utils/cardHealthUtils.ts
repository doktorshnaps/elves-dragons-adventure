import { Card } from '@/types/cards';

/**
 * Initialize card health if not set
 */
export const initializeCardHealth = (card: Card): Card => {
  // Только инициализируем lastHealTime, но НЕ сбрасываем currentHealth
  // Если currentHealth не задан, устанавливаем его в максимальное значение только один раз
  return {
    ...card,
    currentHealth: card.currentHealth !== undefined ? card.currentHealth : card.health,
    lastHealTime: card.lastHealTime ?? Date.now()
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