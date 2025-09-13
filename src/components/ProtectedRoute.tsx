import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useWhitelist } from '@/hooks/useWhitelist';
import { ComingSoon } from '@/components/ComingSoon';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected, isConnecting } = useWallet();
  const { isWhitelisted, loading: whitelistLoading } = useWhitelist();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;

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

  if (isConnecting || whitelistLoading || (!isConnected && lsConnected)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Загрузка меню...</div>
      </div>
    );
  }

  if (!isConnected && !lsConnected) {
    console.log('❌ Not connected, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Check whitelist access after wallet is connected
  if (isConnected && isWhitelisted === false) {
    console.log('❌ Not whitelisted, showing coming soon');
    return <ComingSoon />;
  }

  return <>{children}</>;
};