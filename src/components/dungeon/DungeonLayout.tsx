import React from 'react';

interface DungeonLayoutProps {
  children: React.ReactNode;
  backgroundImage: string;
}

export const DungeonLayout = ({ children, backgroundImage }: DungeonLayoutProps) => {
  return (
    <div 
      className="min-h-screen p-6 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};