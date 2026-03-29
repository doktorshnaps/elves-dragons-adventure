/**
 * Secure Storage Utility
 * 
 * Client-side localStorage is inherently untrusted.
 * All critical game state is validated server-side via RPCs.
 * This module provides only cache management helpers.
 */

/**
 * List of critical keys used as client-side cache
 * These are NOT authoritative — server state always wins.
 */
export const CRITICAL_KEYS = [
  'gameBalance',
  'gameCards',
  'gameInventory',
  'dragonEggs',
  'selectedTeam'
] as const;

/**
 * Clear all critical cached data from localStorage.
 * Used when data integrity is questionable or on logout.
 */
export function clearCriticalData(): void {
  CRITICAL_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to clear ${key}:`, e);
    }
  });
}
