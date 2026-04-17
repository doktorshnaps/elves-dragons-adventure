import { useEffect } from 'react';
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

const DEV = import.meta.env.DEV;

/**
 * Optimistic render strategy:
 * - We ONLY block the UI when the wallet is still connecting (because nothing
 *   downstream can run without an accountId).
 * - admin/whitelist/maintenance loading states do NOT block — they resolve in
 *   the background and we apply the result as soon as it arrives. This makes
 *   buttons appear in the DOM almost immediately on iOS WKWebView (Safari +
 *   Telegram WebApp), where 8s of spinner was being perceived as
 *   "buttons don't respond".
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { accountId, isLoading: isConnecting } = useWalletContext();
  const isConnected = !!accountId;
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isWhitelisted, loading: whitelistLoading } = useWhitelistContext();
  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useMaintenanceStatus();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;

  useEffect(() => {
    if (DEV) {
      console.log('🛡️ [ProtectedRoute] Status check:', {
        isConnected,
        isConnecting,
        lsConnected,
        isAdmin,
        adminLoading,
        isWhitelisted,
        whitelistLoading,
        maintenanceLoading,
        path: location.pathname,
      });
    }
  }, [isConnected, isConnecting, lsConnected, isAdmin, adminLoading, isWhitelisted, whitelistLoading, maintenanceLoading, location.pathname]);

  // Only block UI for wallet connection. Everything else renders optimistically.
  if (isConnecting && !accountId && !lsConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isConnected && !lsConnected) {
    const redirectPath = `/auth${location.search}`;
    if (DEV) console.log('🔀 [ProtectedRoute] Redirecting to auth:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // localStorage stale flag cleanup
  if (lsConnected && !accountId && !isConnecting) {
    localStorage.removeItem('walletConnected');
    const redirectPath = `/auth${location.search}`;
    if (DEV) console.log('🔀 [ProtectedRoute] Redirecting to auth (cleanup):', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Maintenance check — render as overlay only when both:
  // (1) maintenance loaded AND enabled, (2) admin status resolved AND not admin.
  // While these are still loading we render content optimistically.
  if (!maintenanceLoading && maintenanceStatus?.is_enabled && !adminLoading && !isAdmin) {
    return <MaintenanceScreen message={maintenanceStatus.message} />;
  }

  // Whitelist gate — only after both adminLoading & whitelistLoading resolve
  if (!adminLoading && !isAdmin && !whitelistLoading && isConnected && isWhitelisted === false) {
    return <ComingSoon />;
  }

  return <>{children}</>;
};
