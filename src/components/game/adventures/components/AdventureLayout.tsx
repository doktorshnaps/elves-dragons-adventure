import React from 'react';

interface AdventureLayoutProps {
  children: React.ReactNode;
}

export const AdventureLayout = ({ children }: AdventureLayoutProps) => {
  return (
    <div 
      className="min-h-screen p-6 relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/59e5d39f-bbd6-4283-be9f-a8710e7cc372.png")',
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
      <div className="relative z-10 space-y-6">
        {children}
      </div>
    </div>
  );
};