import { useCallback } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { Card } from '@/types/cards';
import { applyDamageToCard } from '@/utils/cardHealthUtils';

/**
 * Synchronize dungeon/adventure damage with team cards health.
 * Distributes incoming damage across selected team pairs: dragon first, then hero, pair by pair.
 */
export const useTeamDamageSync = () => {
  const { gameData, updateGameData } = useGameData();

  const applyDamageToTeam = useCallback(async (damage: number) => {
    if (!damage || damage <= 0) return;
    const selectedTeam = (gameData.selectedTeam as any[]) || [];
    const allCards = (gameData.cards as Card[]) || [];
    if (selectedTeam.length === 0 || allCards.length === 0) return;

    let remaining = damage;

    // Build a map for quick updates
    const updatedMap = new Map<string, Card>(allCards.map(c => [c.id, c]));

    for (const pair of selectedTeam) {
      if (remaining <= 0) break;

      // Damage dragon first if exists and alive
      const dragon: Card | undefined = pair.dragon;
      if (dragon) {
        const currentDragon: Card | undefined = updatedMap.get(dragon.id);
        if (currentDragon) {
          const cur = currentDragon.currentHealth ?? currentDragon.health;
          if (cur > 0) {
            const take = Math.min(remaining, cur);
            const after = applyDamageToCard(currentDragon, take);
            updatedMap.set(after.id, after);
            remaining -= take;
          }
        }
      }

      if (remaining <= 0) break;

      // Then damage hero
      const hero: Card | undefined = pair.hero;
      if (hero) {
        const currentHero: Card | undefined = updatedMap.get(hero.id);
        if (currentHero) {
          const cur = currentHero.currentHealth ?? currentHero.health;
          if (cur > 0) {
            const take = Math.min(remaining, cur);
            const after = applyDamageToCard(currentHero, take);
            updatedMap.set(after.id, after);
            remaining -= take;
          }
        }
      }
    }

    // If nothing changed, skip
    if (remaining === damage) return;

    const updatedCards = Array.from(updatedMap.values());
    await updateGameData({ cards: updatedCards });
    // updateGameData dispatches 'cardsUpdate' and updates localStorage
  }, [gameData.selectedTeam, gameData.cards, updateGameData]);

  return { applyDamageToTeam };
};
