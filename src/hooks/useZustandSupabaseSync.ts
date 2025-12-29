import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash.debounce';

/**
 * Hook для автоматической синхронизации Zustand с Supabase
 * 
 * РЕФАКТОРИНГ: Удалены серверные данные из синхронизации:
 * - cards → используйте card_instances
 * - inventory → используйте item_instances через useItemInstances()
 * - dragonEggs → используйте gameData.dragonEggs через DragonEggContext
 */
export const useZustandSupabaseSync = (walletAddress: string | null) => {
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef<any>(null);

  // Синхронизируем только UI-состояние
  const state = useGameStore((state) => ({
    balance: state.balance,
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

        const updates: any = { updated_at: new Date().toISOString() };
        let hasChanges = false;

        if (!lastStateRef.current) {
          // Первая синхронизация
          updates.balance = currentState.balance;
          updates.selected_team = currentState.selectedTeam as any || [];
          updates.account_level = currentState.accountLevel || 1;
          updates.account_experience = currentState.accountExperience || 0;
          hasChanges = true;
        } else {
          // Обновляем только измененные поля
          if (currentState.balance !== lastStateRef.current.balance) {
            updates.balance = currentState.balance;
            hasChanges = true;
          }
          if (JSON.stringify(currentState.selectedTeam) !== JSON.stringify(lastStateRef.current.selectedTeam)) {
            updates.selected_team = currentState.selectedTeam as any || [];
            hasChanges = true;
          }
          if (currentState.accountLevel !== lastStateRef.current.accountLevel) {
            updates.account_level = currentState.accountLevel || 1;
            hasChanges = true;
          }
          if (currentState.accountExperience !== lastStateRef.current.accountExperience) {
            updates.account_experience = currentState.accountExperience || 0;
            hasChanges = true;
          }
        }

        if (!hasChanges) {
          return;
        }

        isSyncingRef.current = true;
        try {
          console.log('🔄 [ZustandSync] Syncing changed fields to Supabase:', Object.keys(updates).filter(k => k !== 'updated_at'));

          const { error } = await supabase
            .from('game_data')
            .update(updates)
            .eq('wallet_address', wallet);

          if (error) {
            console.error('❌ [ZustandSync] Sync failed:', error);
          } else {
            lastStateRef.current = { ...currentState };
            console.log('✅ [ZustandSync] Synced to Supabase');
          }
        } catch (error) {
          console.error('❌ [ZustandSync] Sync error:', error);
        } finally {
          isSyncingRef.current = false;
        }
      },
      2000,
      { leading: false, trailing: true, maxWait: 5000 }
    )
  ).current;

  useEffect(() => {
    if (!walletAddress) return;
    syncToSupabase(state, walletAddress);
  }, [state, walletAddress, syncToSupabase]);

  return { syncing: isSyncingRef.current };
};
