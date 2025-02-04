import React from 'react';

interface AdventureLayoutProps {
  children: React.ReactNode;
}

export const AdventureLayout = ({ children }: AdventureLayoutProps) => {
  return (
    <div 
      className="min-h-screen p-6 relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};