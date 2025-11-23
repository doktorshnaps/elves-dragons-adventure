import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAccountSync = () => {
  const { accountId, selector, isLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { syncAccountData, initializeAccountData, clearAllData } = useGameStore();
  const { toast } = useToast();
  const referralProcessedRef = useRef(false);

  // Process referral when wallet connects
  useEffect(() => {
    const processReferral = async () => {
      if (!accountId || referralProcessedRef.current) {
        return;
      }

      const pendingReferrer = localStorage.getItem('pendingReferrer');
      if (!pendingReferrer) {
        return;
      }

      referralProcessedRef.current = true;
      console.log('🔗 useAccountSync: Processing referral', {
        referrer: pendingReferrer,
        referred: accountId
      });

      try {
        const { data, error } = await supabase.rpc('add_referral', {
          p_referrer_wallet_address: pendingReferrer,
          p_referred_wallet_address: accountId
        });

        if (error) {
          console.error('❌ Referral error:', error);
          referralProcessedRef.current = false;
        } else {
          console.log('✅ Referral added successfully:', data);
          localStorage.removeItem('pendingReferrer');
          toast({
            title: "Referral Added",
            description: "You've been successfully referred!"
          });
        }
      } catch (error) {
        console.error('❌ Referral processing error:', error);
        referralProcessedRef.current = false;
      }
    };

    if (isConnected && accountId) {
      processReferral();
    }
  }, [isConnected, accountId, toast]);

  useEffect(() => {
    // Не выполняем синхронизацию пока wallet selector не инициализирован
    if (isLoading || !selector) {
      return;
    }

    if (isConnected && accountId) {
      console.log('🔄 Account connected, syncing data for:', accountId);
      initializeAccountData(accountId).then(() => {
        // Всегда синхронизируем с БД при подключении
        syncAccountData(accountId);
      });
    } else if (!isConnected) {
      console.log('⚠️ Wallet disconnected');
      // При отключении кошелька сбрасываем только уровень и опыт до дефолтных значений
      // остальные данные остаются для избежания потери прогресса при HMR
    }
  }, [isConnected, accountId, syncAccountData, initializeAccountData, selector, isLoading]);
};