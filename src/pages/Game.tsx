import { GameInterface } from "@/components/GameInterface";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";

export const Game = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    const preventDefaultTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDefaultTouchMove);
    };
  }, []);

  return (
    <div 
      className="min-h-screen bg-game-background relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
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
      <div className="absolute inset-0 bg-black/30" />
      <div 
        className={`relative ${isMobile ? 'px-2' : 'px-6'}`}
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <GameInterface />
      </div>
    </div>
  );
};