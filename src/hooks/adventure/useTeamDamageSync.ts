import { useCallback } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useCardInstances } from '@/hooks/useCardInstances';

/**
 * Synchronize dungeon/adventure damage with team cards health.
 * Distributes incoming damage across selected team pairs: dragon first, then hero, pair by pair.
 */
export const useTeamDamageSync = () => {
  const { gameData } = useGameData();
  const { cardInstances, updateCardHealth } = useCardInstances();

  const applyDamageToCard = useCallback(async (cardId: string, damage: number) => {
    const instance = cardInstances.find(ci => ci.card_template_id === cardId || ci.id === cardId);
    if (instance) {
      const newHealth = Math.max(0, instance.current_health - damage);
      await updateCardHealth(instance.id, newHealth);
    }
  }, [cardInstances, updateCardHealth]);

  const applyDamageToTeam = useCallback(async (damage: number) => {
    if (!damage || damage <= 0) return;
    const selectedTeam = (gameData.selectedTeam as any[]) || [];
    if (selectedTeam.length === 0) return;

    let remaining = damage;

    for (const pair of selectedTeam) {
      if (remaining <= 0) break;

      // Damage dragon first if exists and alive
      const dragon = pair.dragon;
      if (dragon && remaining > 0) {
        const dragonDamage = Math.min(remaining, dragon.currentHealth || dragon.health);
        await applyDamageToCard(dragon.id, dragonDamage);
        remaining -= dragonDamage;
      }

      if (remaining <= 0) break;

      // Then damage hero
      const hero = pair.hero;
      if (hero && remaining > 0) {
        const heroDamage = Math.min(remaining, hero.currentHealth || hero.health);
        await applyDamageToCard(hero.id, heroDamage);
        remaining -= heroDamage;
      }
    }
  }, [gameData.selectedTeam, applyDamageToCard]);

  return { applyDamageToTeam };
};
