import { GameInterface } from "@/components/GameInterface";
import { useIsMobile } from "@/hooks/use-mobile";

export const Game = () => {
  const isMobile = useIsMobile();

  return (
    <div 
      className="min-h-screen bg-game-background relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className={`relative ${isMobile ? 'px-2' : 'px-6'}`}>
        <GameInterface />
      </div>
    </div>
  );
};