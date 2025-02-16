
import React from 'react';

interface MarketplaceLayoutProps {
  children: React.ReactNode;
}

export const MarketplaceLayout = ({ children }: MarketplaceLayoutProps) => {
  return (
    <div 
      className="min-h-screen h-screen p-4 bg-game-background overflow-hidden"
      style={{
        backgroundImage: "url('/lovable-uploads/20d88f7a-4f27-4b22-8ebe-e55b87a0c7e3.png')",
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundBlendMode: 'multiply',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      {children}
    </div>
  );
};
