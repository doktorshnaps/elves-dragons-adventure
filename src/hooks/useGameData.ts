import { useGameDataContext } from '@/contexts/GameDataContext';

/**
 * DEPRECATED: This hook now wraps GameDataContext for backward compatibility
 * 
 * All game data is now centralized in GameDataContext to prevent:
 * - Duplicate RPC calls
 * - Multiple independent state instances
 * - Performance issues from re-fetching the same data
 * 
 * New code should use useGameDataContext() directly from @/contexts/GameDataContext
 */
export const useGameData = () => {
  console.log('⚠️ useGameData wrapper called');
  return useGameDataContext();
};
