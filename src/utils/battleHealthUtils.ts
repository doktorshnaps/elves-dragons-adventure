import { Card } from '@/types/cards';
import { TeamPair } from '@/types/teamBattle';
import { applyDamageToCard } from './cardHealthUtils';

/**
 * Apply damage to cards in a team pair and update localStorage
 * Dragon takes damage first, then hero
 */
export const applyDamageToPair = async (
  pair: TeamPair, 
  damage: number,
  updateGameData: (data: any) => Promise<void>,
  gameData: any
): Promise<TeamPair> => {
  if (!pair.hero && !pair.dragon) return pair;

  let remainingDamage = damage;
  let updatedHero = pair.hero;
  let updatedDragon = pair.dragon;
  let wasDragonAlive = false;
  
  // Dragon takes damage first
  if (pair.dragon) {
    const dragonCurrentHealth = pair.dragon.currentHealth ?? pair.dragon.health;
    wasDragonAlive = dragonCurrentHealth > 0;
    
    if (dragonCurrentHealth > 0) {
      const dragonDamage = Math.min(remainingDamage, dragonCurrentHealth);
      updatedDragon = applyDamageToCard(pair.dragon, dragonDamage);
      remainingDamage -= dragonDamage;
    }
  }
  
  // If there's remaining damage and hero exists, apply to hero
  if (remainingDamage > 0 && pair.hero) {
    updatedHero = applyDamageToCard(pair.hero, remainingDamage);
  }
  
  // Update cards in game data
  const currentCards = (gameData.cards as Card[]) || [];
  const updatedCards = currentCards.map(card => {
    if (updatedHero && card.id === updatedHero.id) return updatedHero;
    if (updatedDragon && card.id === updatedDragon.id) return updatedDragon;
    return card;
  });
  
  // Persist updated cards
  await updateGameData({ cards: updatedCards });
  // Sync localStorage and notify listeners
  try {
    localStorage.setItem('gameCards', JSON.stringify(updatedCards));
    window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: updatedCards } }));
  } catch (e) {
    // no-op if storage not available
  }
  
  // Recalculate pair health and stats
  const newHeroHealth = updatedHero ? (updatedHero.currentHealth ?? updatedHero.health) : 0;
  const newDragonHealth = updatedDragon ? (updatedDragon.currentHealth ?? updatedDragon.health) : 0;
  
  // Check if dragon died during this damage
  const isDragonNowDead = updatedDragon ? (updatedDragon.currentHealth ?? updatedDragon.health) <= 0 : false;
  const dragonJustDied = wasDragonAlive && isDragonNowDead;
  
  // Recalculate stats - if dragon died, remove its contribution
  let newPower = pair.power;
  let newDefense = pair.defense;
  
  if (dragonJustDied && pair.dragon) {
    newPower -= pair.dragon.power;
    newDefense -= pair.dragon.defense;
  }
  
  return {
    ...pair,
    hero: updatedHero,
    dragon: updatedDragon,
    health: newHeroHealth + newDragonHealth,
    power: newPower,
    defense: newDefense
  };
};