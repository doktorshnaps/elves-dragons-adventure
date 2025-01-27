import { Item, ItemEffect } from "@/types/inventory";
import { PlayerStats } from "@/types/battle";

export const getItemPrice = (item: Item): number => {
  if (!item) throw new Error('Invalid item: item is undefined');
  
  switch (item.type) {
    case "healthPotion":
      return 100;
    case "cardPack":
      return 1000;
    case "defensePotion":
      return 200;
    case "weapon":
      return 300;
    case "armor":
      return 400;
    default:
      return 0;
  }
};

export const canUpgradeItems = (items: Item[]): boolean => {
  if (!Array.isArray(items)) {
    throw new Error('Invalid input: items must be an array');
  }
  return false;
};

export const upgradeItems = (items: Item[], itemsToUpgrade: Item[]): Item[] => {
  if (!Array.isArray(items) || !Array.isArray(itemsToUpgrade)) {
    throw new Error('Invalid input: both parameters must be arrays');
  }
  return items;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const applyEffect = (stats: PlayerStats, effect: ItemEffect): PlayerStats => {
  const newStats = { ...stats };
  
  switch (effect.stat) {
    case 'health':
      return {
        ...newStats,
        health: Math.floor(clamp(
          stats.health + effect.value,
          0,
          stats.maxHealth
        ))
      };
    case 'power':
      return {
        ...newStats,
        power: Math.max(0, stats.power + effect.value)
      };
    case 'defense':
      return {
        ...newStats,
        defense: Math.max(0, stats.defense + effect.value)
      };
    default:
      return newStats;
  }
};

export const applyItemEffect = (item: Item, playerStats: PlayerStats): PlayerStats => {
  if (!item) throw new Error('Invalid input: item is undefined');
  if (!playerStats) throw new Error('Invalid input: playerStats is undefined');
  
  const newStats = { ...playerStats };

  // If item has an effect property, use it
  if (item.effect) {
    return applyEffect(newStats, item.effect);
  }

  // Fallback to legacy item handling
  switch (item.name) {
    case "Зелье здоровья":
      if (typeof item.value !== 'number') {
        throw new Error('Invalid item value for health potion');
      }
      const newHealth = clamp(
        playerStats.health + item.value,
        0,
        playerStats.maxHealth
      );
      return {
        ...newStats,
        health: Math.floor(newHealth)
      };
    
    case "Зелье защиты":
      if (typeof item.value !== 'number') {
        throw new Error('Invalid item value for defense potion');
      }
      return {
        ...newStats,
        defense: Math.max(0, newStats.defense + item.value)
      };
    
    case "Старый железный меч":
      if (typeof item.value !== 'number') {
        throw new Error('Invalid item value for sword');
      }
      return {
        ...newStats,
        power: Math.max(0, newStats.power + item.value)
      };
    
    case "Кожаная броня":
      if (typeof item.value !== 'number') {
        throw new Error('Invalid item value for armor');
      }
      return {
        ...newStats,
        defense: Math.max(0, newStats.defense + item.value)
      };
    
    default:
      throw new Error(`Unknown item type: ${item.name}`);
  }
};