import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useWhitelist } from '@/hooks/useWhitelist';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { ComingSoon } from '@/components/ComingSoon';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { accountId, isLoading: isConnecting } = useWalletContext();
  const isConnected = !!accountId;
  const { isWhitelisted, loading: whitelistLoading } = useWhitelist();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;
  const [maintenanceStatus, setMaintenanceStatus] = useState<{
    is_enabled: boolean;
    message: string;
  } | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  useEffect(() => {
    console.log('🛡️ ProtectedRoute check:', { 
      isConnected, 
      isConnecting, 
      lsConnected, 
      isWhitelisted, 
      whitelistLoading, 
      path: location.pathname 
    });
  }, [isConnected, isConnecting, lsConnected, isWhitelisted, whitelistLoading, location.pathname]);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_maintenance_status');
        if (error) throw error;
        
        setMaintenanceStatus(data ? {
          is_enabled: (data as any).is_enabled || false,
          message: (data as any).message || ''
        } : { is_enabled: false, message: '' });
      } catch (error) {
        console.error('Error checking maintenance status:', error);
        setMaintenanceStatus({ is_enabled: false, message: '' });
      } finally {
        setMaintenanceLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, []);

  if (isConnecting || whitelistLoading || maintenanceLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Загрузка меню...</div>
      </div>
    );
  }

  // Check maintenance mode (before other checks)
  if (maintenanceStatus?.is_enabled) {
    if (!isAdmin) {
      return <MaintenanceScreen message={maintenanceStatus.message} />;
    } else {
      console.log('🛠️ Admin/Super Admin bypassing maintenance mode');
    }
  }

  if (!isConnected && !lsConnected) {
    console.log('❌ Not connected, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Если localStorage показывает подключение, но accountId нет - редирект на auth
  if (lsConnected && !accountId) {
    console.log('⚠️ localStorage connected but no accountId, redirecting to auth');
    localStorage.removeItem('walletConnected');
    return <Navigate to="/auth" replace />;
  }

  // Check whitelist access after wallet is connected
  if (isConnected && isWhitelisted === false) {
    console.log('❌ Not whitelisted, showing coming soon');
    return <ComingSoon />;
  }

  return <>{children}</>;
};