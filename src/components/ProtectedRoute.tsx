import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected, isConnecting } = useWallet();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;

  useEffect(() => {
    console.log('🛡️ ProtectedRoute check:', { isConnected, isConnecting, lsConnected, path: location.pathname });
  }, [isConnected, isConnecting, lsConnected, location.pathname]);

  if (isConnecting || (!isConnected && lsConnected)) {
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

  return <>{children}</>;
};