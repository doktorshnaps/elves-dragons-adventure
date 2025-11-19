import { Card } from '@/types/cards';

/**
 * Initialize card health and defense if not set
 */
export const initializeCardHealth = (card: Card): Card => {
  // Только инициализируем lastHealTime, но НЕ сбрасываем currentHealth и currentDefense
  // Если currentHealth/currentDefense не задан, устанавливаем в максимальное значение только один раз
  return {
    ...card,
    currentHealth: card.currentHealth !== undefined ? card.currentHealth : card.health,
    currentDefense: card.currentDefense !== undefined ? card.currentDefense : card.defense,
    maxDefense: card.maxDefense !== undefined ? card.maxDefense : card.defense,
    lastHealTime: card.lastHealTime ?? Date.now()
  };
};

/**
 * Apply damage to a card (reduces defense by 1, then health)
 */
export const applyDamageToCard = (card: Card, damage: number): Card => {
  const currentHealth = card.currentHealth ?? card.health;
  const currentDefense = card.currentDefense ?? card.defense;
  
  // Броня уменьшается на 1 при любом уроне
  let newDefense = currentDefense;
  if (currentDefense > 0) {
    newDefense = currentDefense - 1;
  }
  
  // Весь урон идет в здоровье
  const newHealth = Math.max(0, currentHealth - damage);
  
  const updatedCard = {
    ...card,
    currentHealth: newHealth,
    currentDefense: newDefense,
    maxDefense: card.maxDefense ?? card.defense
  };

  // Dispatch event to synchronize health and defense across all components
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
 * Get card defense percentage for UI
 */
export const getCardDefensePercentage = (card: Card): number => {
  const currentDefense = card.currentDefense ?? card.defense;
  const maxDefense = card.maxDefense ?? card.defense;
  return maxDefense > 0 ? (currentDefense / maxDefense) * 100 : 0;
};

/**
 * Check if card is at full health
 */
export const isCardAtFullHealth = (card: Card): boolean => {
  const currentHealth = card.currentHealth ?? card.health;
  return currentHealth >= card.health;
};

/**
 * Check if card is at full defense
 */
export const isCardAtFullDefense = (card: Card): boolean => {
  const currentDefense = card.currentDefense ?? card.defense;
  const maxDefense = card.maxDefense ?? card.defense;
  return currentDefense >= maxDefense;
};

/**
 * Check if card is alive (has health > 0)
 */
export const isCardAlive = (card: Card): boolean => {
  const currentHealth = card.currentHealth ?? card.health;
  return currentHealth > 0;
};