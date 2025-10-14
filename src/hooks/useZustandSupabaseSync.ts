import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash.debounce';

/**
 * Hook для автоматической синхронизации Zustand с Supabase
 * Оптимизирован для снижения нагрузки на БД - обновляет только измененные поля
 */
export const useZustandSupabaseSync = (walletAddress: string | null) => {
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef<any>(null);

  const state = useGameStore((state) => ({
    balance: state.balance,
    cards: state.cards,
    inventory: state.inventory,
    dragonEggs: state.dragonEggs,
    selectedTeam: state.selectedTeam,
    accountLevel: state.accountLevel,
    accountExperience: state.accountExperience,
  }));

  // Debounced sync function - увеличен debounce до 2000ms для снижения нагрузки
  const syncToSupabase = useRef(
    debounce(
      async (currentState: typeof state, wallet: string) => {
        if (isSyncingRef.current) {
          console.log('⏭️ Sync already in progress, skipping...');
          return;
        }

        // Определяем только измененные поля
        const updates: any = { updated_at: new Date().toISOString() };
        let hasChanges = false;

        if (!lastStateRef.current) {
          // Первая синхронизация - обновляем все
          updates.balance = currentState.balance;
          updates.cards = currentState.cards as any || [];
          updates.inventory = currentState.inventory as any || [];
          updates.dragon_eggs = currentState.dragonEggs as any || [];
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
          if (JSON.stringify(currentState.cards) !== JSON.stringify(lastStateRef.current.cards)) {
            updates.cards = currentState.cards as any || [];
            hasChanges = true;
          }
          if (JSON.stringify(currentState.inventory) !== JSON.stringify(lastStateRef.current.inventory)) {
            updates.inventory = currentState.inventory as any || [];
            hasChanges = true;
          }
          if (JSON.stringify(currentState.dragonEggs) !== JSON.stringify(lastStateRef.current.dragonEggs)) {
            updates.dragon_eggs = currentState.dragonEggs as any || [];
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

  // Sync to Supabase when state changes (БЕЗ localStorage - данные только в Supabase)
  useEffect(() => {
    if (!walletAddress) return;

    // Sync to Supabase
    syncToSupabase(state, walletAddress);
  }, [state, walletAddress, syncToSupabase]);

  return { syncing: isSyncingRef.current };
};
