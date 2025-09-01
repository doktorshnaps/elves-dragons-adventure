import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected, isConnecting } = useWallet();
  const location = useLocation();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute check:', { isConnected, isConnecting, path: location.pathname });
  }, [isConnected, isConnecting, location.pathname]);

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Подключение кошелька...</div>
      </div>
    );
  }

  if (!isConnected) {
    console.log('❌ Not connected, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};