import React from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { useGameSync } from '@/hooks/useGameSync';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';


interface GameLayoutProps {
  children: React.ReactNode;
  backgroundImage?: string;
  showHeader?: boolean;
}

export const GameLayout = ({ 
  children, 
  backgroundImage,
  showHeader = true 
}: GameLayoutProps) => {
  // Не вызываем useGameSync на страницах без авторизации
  const isConnected = typeof window !== 'undefined' && localStorage.getItem('walletAccountId');
  const { loading } = isConnected ? useGameSync() : { loading: false };

  // Показываем загрузку только на авторизованных страницах
  const shouldShowLoading = loading && isConnected && 
    window.location.pathname !== '/' && 
    window.location.pathname !== '/auth';

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-game-background">
        <LoadingSpinner size="lg" text="Загрузка игры..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      
      <div 
        className="min-h-screen bg-game-background"
        style={backgroundImage ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        {backgroundImage && <div className="absolute inset-0 bg-black/40" />}
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
      <Toaster />
    </ErrorBoundary>
  );
};