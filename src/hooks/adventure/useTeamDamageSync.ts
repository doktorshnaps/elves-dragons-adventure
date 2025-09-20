import { useCallback } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useCardInstanceSync } from '@/hooks/useCardInstanceSync';
import { Card } from '@/types/cards';

/**
 * Synchronize dungeon/adventure damage with team cards health.
 * Distributes incoming damage across selected team pairs: dragon first, then hero, pair by pair.
 */
export const useTeamDamageSync = () => {
  const { gameData, updateGameData } = useGameData();
  // const { applyDamageToCard } = useCardInstanceSync(); // ОТКЛЮЧЕНО

  const applyDamageToTeam = useCallback(async (damage: number) => {
    if (!damage || damage <= 0) return;
    const selectedTeam = (gameData.selectedTeam as any[]) || [];
    if (selectedTeam.length === 0) return;

    // Пока отключаем нанесение урона по экземплярам карт
    console.log('Damage to team requested but disabled:', damage);
    return;

    // let remaining = damage;

    // for (const pair of selectedTeam) {
    //   if (remaining <= 0) break;

    //   // Damage dragon first if exists and alive
    //   const dragon = pair.dragon;
    //   if (dragon && remaining > 0) {
    //     const dragonDamage = Math.min(remaining, dragon.currentHealth || dragon.health);
    //     // await applyDamageToCard(dragon.id, dragonDamage);
    //     remaining -= dragonDamage;
    //   }

    //   if (remaining <= 0) break;

    //   // Then damage hero
    //   const hero = pair.hero;
    //   if (hero && remaining > 0) {
    //     const heroDamage = Math.min(remaining, hero.currentHealth || hero.health);
    //     // await applyDamageToCard(hero.id, heroDamage);
    //     remaining -= heroDamage;
    //   }
    // }
  }, [gameData.selectedTeam]);

  return { applyDamageToTeam };
};
