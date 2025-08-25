import { Card } from '@/types/cards';
import { TeamPair } from '@/types/teamBattle';
import { applyDamageToCard } from './cardHealthUtils';

/**
 * Apply damage to cards in a team pair and update localStorage
 */
export const applyDamageToPair = async (
  pair: TeamPair, 
  damage: number,
  updateGameData: (data: any) => Promise<void>,
  gameData: any
): Promise<TeamPair> => {
  if (!pair.hero && !pair.dragon) return pair;

  const totalHealth = pair.health;
  const heroProportion = pair.hero ? (pair.hero.currentHealth ?? pair.hero.health) / totalHealth : 0;
  const dragonProportion = pair.dragon ? (pair.dragon.currentHealth ?? pair.dragon.health) / totalHealth : 0;
  
  // Distribute damage proportionally
  const heroDamage = pair.hero ? Math.floor(damage * heroProportion) : 0;
  const dragonDamage = pair.dragon ? Math.floor(damage * dragonProportion) : 0;
  
  let updatedHero = pair.hero;
  let updatedDragon = pair.dragon;
  
  // Apply damage to cards
  if (pair.hero && heroDamage > 0) {
    updatedHero = applyDamageToCard(pair.hero, heroDamage);
  }
  
  if (pair.dragon && dragonDamage > 0) {
    updatedDragon = applyDamageToCard(pair.dragon, dragonDamage);
  }
  
  // Update cards in game data
  const currentCards = (gameData.cards as Card[]) || [];
  const updatedCards = currentCards.map(card => {
    if (updatedHero && card.id === updatedHero.id) return updatedHero;
    if (updatedDragon && card.id === updatedDragon.id) return updatedDragon;
    return card;
  });
  
  // Save to Supabase
  await updateGameData({ cards: updatedCards });
  
  // Recalculate pair health
  const newHeroHealth = updatedHero ? (updatedHero.currentHealth ?? updatedHero.health) : 0;
  const newDragonHealth = updatedDragon ? (updatedDragon.currentHealth ?? updatedDragon.health) : 0;
  
  return {
    ...pair,
    hero: updatedHero,
    dragon: updatedDragon,
    health: newHeroHealth + newDragonHealth
  };
};