import React, { useEffect } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { useAccountSync } from '@/hooks/useAccountSync';
import { useGameSync } from '@/hooks/useGameSync';
import { metricsMonitor } from '@/utils/metricsMonitor';


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
  // Отслеживание рендеров
  useEffect(() => {
    metricsMonitor.trackComponentRender('GameLayout');
  });

  // Инициализируем синхронизацию (с guards внутри для проверки готовности wallet)
  useAccountSync();
  useGameSync();
  
  return (
    <ErrorBoundary>
      
      <div 
        className="min-h-screen bg-game-background"
        style={backgroundImage ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
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