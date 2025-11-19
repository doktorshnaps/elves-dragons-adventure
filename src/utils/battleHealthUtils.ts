import { Card } from '@/types/cards';
import { TeamPair } from '@/types/teamBattle';
import { applyDamageToCard } from './cardHealthUtils';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Persist damage to Supabase card_instances (source of truth)
  const wallet = ((gameData as any)?.wallet_address) || localStorage.getItem('walletAccountId');

  // Calculate actual damage portions
  const originalDragonHealth = pair.dragon ? (pair.dragon.currentHealth ?? pair.dragon.health ?? 0) : 0;
  const appliedDragonDamage = pair.dragon ? Math.min(damage, Math.max(0, originalDragonHealth)) : 0;
  const appliedHeroDamage = Math.max(0, damage - appliedDragonDamage);

  try {
    if (wallet && updatedDragon && appliedDragonDamage > 0 && pair.dragon) {
      const newDragonHealth = updatedDragon.currentHealth ?? updatedDragon.health;
      const newDragonDefense = updatedDragon.currentDefense ?? updatedDragon.defense;
      await supabase.rpc('update_card_instance_health_and_defense_by_template', {
        p_wallet_address: wallet,
        p_card_template_id: pair.dragon.id,
        p_current_health: newDragonHealth,
        p_current_defense: newDragonDefense
      });
    }

    if (wallet && updatedHero && appliedHeroDamage > 0 && pair.hero) {
      const newHeroHealth = updatedHero.currentHealth ?? updatedHero.health;
      const newHeroDefense = updatedHero.currentDefense ?? updatedHero.defense;
      await supabase.rpc('update_card_instance_health_and_defense_by_template', {
        p_wallet_address: wallet,
        p_card_template_id: pair.hero.id,
        p_current_health: newHeroHealth,
        p_current_defense: newHeroDefense
      });
    }

    if ((appliedDragonDamage > 0 || appliedHeroDamage > 0)) {
      window.dispatchEvent(new CustomEvent('cardInstanceHealthUpdate', { detail: {} }));
    }
  } catch (err) {
    console.error('Failed to persist damage to Supabase:', err);
  }

  
  // Dispatch health sync events for immediate UI updates
  if (updatedHero) {
    const heroEvent = new CustomEvent('cardHealthChanged', { 
      detail: { card: updatedHero, damage: remainingDamage }
    });
    window.dispatchEvent(heroEvent);
  }
  
  if (updatedDragon) {
    const dragonDamage = Math.min(damage, (pair.dragon?.currentHealth ?? pair.dragon?.health ?? 0));
    const dragonEvent = new CustomEvent('cardHealthChanged', { 
      detail: { card: updatedDragon, damage: dragonDamage }
    });
    window.dispatchEvent(dragonEvent);
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