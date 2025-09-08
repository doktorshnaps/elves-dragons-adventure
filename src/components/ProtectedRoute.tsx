import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected, isConnecting } = useWallet();
  const { user, loading } = useAuth();
  const location = useLocation();
  const lsConnected = (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') || false;

  useEffect(() => {
    console.log('🛡️ ProtectedRoute check:', { 
      isConnected, 
      isConnecting, 
      lsConnected, 
      hasAuthUser: !!user,
      authLoading: loading,
      path: location.pathname 
    });
  }, [isConnected, isConnecting, lsConnected, user, loading, location.pathname]);

  // Show loading state while authentication is being determined
  if (loading || isConnecting || (!isConnected && lsConnected)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Загрузка меню...</div>
      </div>
    );
  }

  // Check both wallet connection and Supabase authentication
  if (!isConnected || !user) {
    console.log('❌ Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};