import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { supabase } from '@/integrations/supabase/client';
import { localStorageBatcher } from '@/utils/localStorageBatcher';
import debounce from 'lodash.debounce';

/**
 * Hook для автоматической синхронизации Zustand с Supabase
 * Заменяет useGameSync с более простой и надежной реализацией
 */
export const useZustandSupabaseSync = (walletAddress: string | null) => {
  const isSyncingRef = useRef(false);
  const lastSyncedRef = useRef<string>('');

  const state = useGameStore((state) => ({
    balance: state.balance,
    cards: state.cards,
    inventory: state.inventory,
    dragonEggs: state.dragonEggs,
    selectedTeam: state.selectedTeam,
    accountLevel: state.accountLevel,
    accountExperience: state.accountExperience,
  }));

  // Debounced sync function
  const syncToSupabase = useRef(
    debounce(
      async (currentState: typeof state, wallet: string) => {
        if (isSyncingRef.current) {
          console.log('⏭️ Sync already in progress, skipping...');
          return;
        }

        // Check if state changed
        const stateHash = JSON.stringify(currentState);
        if (stateHash === lastSyncedRef.current) {
          return;
        }

        isSyncingRef.current = true;
        try {
          console.log('🔄 [ZustandSync] Syncing to Supabase');

          const { error } = await supabase
            .from('game_data')
            .update({
              balance: currentState.balance,
              cards: currentState.cards as any || [],
              inventory: currentState.inventory as any || [],
              dragon_eggs: currentState.dragonEggs as any || [],
              selected_team: currentState.selectedTeam as any || [],
              account_level: currentState.accountLevel || 1,
              account_experience: currentState.accountExperience || 0,
              updated_at: new Date().toISOString(),
            })
            .eq('wallet_address', wallet);

          if (error) {
            console.error('❌ [ZustandSync] Sync failed:', error);
          } else {
            lastSyncedRef.current = stateHash;
            console.log('✅ [ZustandSync] Synced to Supabase');
          }
        } catch (error) {
          console.error('❌ [ZustandSync] Sync error:', error);
        } finally {
          isSyncingRef.current = false;
        }
      },
      800,
      { leading: false, trailing: true, maxWait: 2000 }
    )
  ).current;

  // Sync to Supabase when state changes (БЕЗ localStorage - данные только в Supabase)
  useEffect(() => {
    if (!walletAddress) return;

    // Sync to Supabase
    syncToSupabase(state, walletAddress);
  }, [state, walletAddress, syncToSupabase]);

  return { syncing: isSyncingRef.current };
};
