import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useWhitelist } from '@/hooks/useWhitelist';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useMaintenanceStatus } from '@/hooks/useMaintenanceStatus';
import { ComingSoon } from '@/components/ComingSoon';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { accountId, isLoading: isConnecting } = useWalletContext();
  const isConnected = !!accountId;
  const { isWhitelisted, loading: whitelistLoading } = useWhitelist();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useMaintenanceStatus();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;

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

  // Check whitelist access after wallet is connected
  if (isConnected && isWhitelisted === false) {
    return <ComingSoon />;
  }

  return <>{children}</>;
};