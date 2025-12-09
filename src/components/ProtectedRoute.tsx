import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useWhitelistContext } from '@/contexts/WhitelistContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useMaintenanceStatus } from '@/hooks/useMaintenanceStatus';
import { ComingSoon } from '@/components/ComingSoon';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';

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

  useEffect(() => {
    console.log('🛡️ [ProtectedRoute] Status check:', { 
      isConnected, 
      isConnecting, 
      lsConnected, 
      isAdmin,
      adminLoading,
      isWhitelisted, 
      whitelistLoading,
      maintenanceLoading,
      path: location.pathname 
    });
  }, [isConnected, isConnecting, lsConnected, isAdmin, adminLoading, isWhitelisted, whitelistLoading, maintenanceLoading, location.pathname]);

  // Добавляем таймаут для предотвращения бесконечной загрузки
  const [timedOut, setTimedOut] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isConnecting || whitelistLoading || maintenanceLoading || adminLoading) {
        console.warn('⚠️ [ProtectedRoute] Loading timeout, forcing render');
        setTimedOut(true);
      }
    }, 5000); // 5 секунд таймаут
    
    return () => clearTimeout(timer);
  }, []);

  const isStillLoading = !timedOut && (isConnecting || whitelistLoading || maintenanceLoading || adminLoading);

  if (isStillLoading) {
    console.log('⏳ [ProtectedRoute] Waiting for:', {
      isConnecting,
      whitelistLoading,
      maintenanceLoading,
      adminLoading
    });
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
    // Preserve search parameters (including ref) when redirecting to auth
    const redirectPath = `/auth${location.search}`;
    console.log('🔀 [ProtectedRoute] Redirecting to auth with search params:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Если localStorage показывает подключение, но accountId нет - редирект на auth
  if (lsConnected && !accountId) {
    localStorage.removeItem('walletConnected');
    const redirectPath = `/auth${location.search}`;
    console.log('🔀 [ProtectedRoute] Redirecting to auth (localStorage cleanup) with search params:', redirectPath);
    return <Navigate to={redirectPath} replace />;
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