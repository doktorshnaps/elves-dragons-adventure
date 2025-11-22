import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useWhitelistContext } from '@/contexts/WhitelistContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useMaintenanceStatus } from '@/hooks/useMaintenanceStatus';
import { ComingSoon } from '@/components/ComingSoon';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { accountId, isLoading: isConnecting } = useWalletContext();
  const isConnected = !!accountId;
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isWhitelisted, loading: whitelistLoading } = useWhitelistContext();
  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useMaintenanceStatus();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;
  const { toast } = useToast();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🛡️ ProtectedRoute check:', { 
        isConnected, 
        isConnecting, 
        lsConnected, 
        isWhitelisted, 
        whitelistLoading, 
        path: location.pathname 
      });
    }
  }, [isConnected, isConnecting, lsConnected, isWhitelisted, whitelistLoading, location.pathname]);

  // Initialize game data for new players
  useEffect(() => {
    if (!isConnected || !accountId || hasInitializedRef.current) {
      return;
    }

    const initializePlayer = async () => {
      try {
        hasInitializedRef.current = true;
        console.log('🎮 Initializing player data for:', accountId);

        // Check if player data exists
        const { data: existingData, error: checkError } = await supabase
          .from('game_data')
          .select('wallet_address, balance')
          .eq('wallet_address', accountId)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking player data:', checkError);
          return;
        }

        if (existingData) {
          console.log('✅ Player data already exists, balance:', existingData.balance);
          return;
        }

        // Create new player data with 100 ELL
        console.log('✨ Creating new player data...');
        const { data: userId, error: createError } = await supabase
          .rpc('ensure_game_data_exists', {
            p_wallet_address: accountId
          });

        if (createError) {
          console.error('❌ Error creating player data:', createError);
          toast({
            title: "Ошибка инициализации",
            description: "Не удалось создать данные игрока. Попробуйте переподключиться.",
            variant: "destructive"
          });
          hasInitializedRef.current = false;
          return;
        }

        console.log('✅ Player data created successfully, user_id:', userId);
        
        // Verify creation
        const { data: verifyData } = await supabase
          .from('game_data')
          .select('balance')
          .eq('wallet_address', accountId)
          .single();

        if (verifyData) {
          console.log('✅ Verified balance:', verifyData.balance);
          toast({
            title: "Добро пожаловать!",
            description: `Вы получили ${verifyData.balance} ELL для старта!`
          });
        }
      } catch (error) {
        console.error('❌ Error in player initialization:', error);
        hasInitializedRef.current = false;
      }
    };

    initializePlayer();

    return () => {
      hasInitializedRef.current = false;
    };
  }, [isConnected, accountId, toast]);

  if (isConnecting || whitelistLoading || maintenanceLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  // Check maintenance mode (before other checks)
  if (maintenanceStatus?.is_enabled) {
    if (!isAdmin) {
      return <MaintenanceScreen message={maintenanceStatus.message} />;
    }
  }

  if (!isConnected && !lsConnected) {
    return <Navigate to="/auth" replace />;
  }

  // Если localStorage показывает подключение, но accountId нет - редирект на auth
  if (lsConnected && !accountId) {
    localStorage.removeItem('walletConnected');
    return <Navigate to="/auth" replace />;
  }

  // Admin always has access, skip whitelist check
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check whitelist access after wallet is connected
  if (isConnected && isWhitelisted === false) {
    return <ComingSoon />;
  }

  return <>{children}</>;
};