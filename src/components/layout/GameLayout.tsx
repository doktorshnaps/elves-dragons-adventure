import React from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { useGameSync } from '@/hooks/useGameSync';


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
  useGameSync();

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