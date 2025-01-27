import { PlayerStats, Opponent } from "@/types/battle";
import { Effect } from "@/types/effects";

interface DamageResult {
  damage: number;
  isCritical: boolean;
}

export class BattleEngine {
  static calculatePlayerDamage(playerStats: PlayerStats, opponent: Opponent): DamageResult {
    const baseDamage = playerStats.power;
    const randomFactor = Math.random() * 0.4 + 0.8; // 80-120% от базового урона
    const isCritical = Math.random() < 0.2; // 20% шанс крита
    const criticalMultiplier = isCritical ? 1.5 : 1;
    
    const finalDamage = Math.floor(baseDamage * randomFactor * criticalMultiplier);
    
    return {
      damage: finalDamage,
      isCritical
    };
  }

  static calculateOpponentDamage(
    opponentPower: number,
    playerDefense: number
  ): {
    blockedDamage: number;
    damageToHealth: number;
    newDefense: number;
  } {
    const incomingDamage = Math.floor(opponentPower);
    
    // Если есть защита, сначала снимаем её
    if (playerDefense > 0) {
      const damageToDefense = Math.min(playerDefense, incomingDamage);
      const remainingDamage = Math.max(0, incomingDamage - damageToDefense);
      const newDefense = Math.max(0, playerDefense - damageToDefense);
      
      return {
        blockedDamage: damageToDefense,
        damageToHealth: remainingDamage,
        newDefense: newDefense
      };
    }
    
    // Если защиты нет, весь урон идёт по здоровью
    return {
      blockedDamage: 0,
      damageToHealth: incomingDamage,
      newDefense: 0
    };
  }

  static calculateExperience(
    currentLevel: number,
    currentExperience: number,
    gainedExperience: number
  ): {
    newExperience: number;
    newLevel: number;
    requiredExperience: number;
  } {
    const baseRequiredExperience = 100;
    const requiredExperience = Math.floor(baseRequiredExperience * Math.pow(1.5, currentLevel - 1));
    
    let totalExperience = currentExperience + gainedExperience;
    let newLevel = currentLevel;
    
    while (totalExperience >= requiredExperience) {
      totalExperience -= requiredExperience;
      newLevel++;
    }
    
    return {
      newExperience: totalExperience,
      newLevel,
      requiredExperience
    };
  }

  static applyEffect(
    stats: PlayerStats | Opponent,
    effect: Effect
  ): {
    newStats: PlayerStats | Opponent;
    triggeredEffect?: Effect;
  } {
    const newStats = { ...stats };
    
    switch (effect.type) {
      case 'poison':
        newStats.health = Math.max(0, newStats.health - effect.value);
        return { newStats, triggeredEffect: effect };
      
      case 'burn':
        newStats.health = Math.max(0, newStats.health - effect.value);
        return { newStats, triggeredEffect: effect };
      
      case 'heal':
        if ('maxHealth' in newStats) {
          newStats.health = Math.min(newStats.maxHealth, newStats.health + effect.value);
        } else {
          newStats.health = newStats.health + effect.value;
        }
        return { newStats };
      
      case 'strength':
        newStats.power += effect.value;
        return { newStats };
      
      case 'defense':
        if ('defense' in newStats) {
          newStats.defense += effect.value;
        }
        return { newStats };
      
      default:
        return { newStats };
    }
  }
}