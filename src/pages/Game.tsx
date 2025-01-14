import { GameInterface } from "@/components/GameInterface";
import { useIsMobile } from "@/hooks/use-mobile";

const Game = () => {
  const isMobile = useIsMobile();

  return (
    <div 
      className="min-h-screen bg-game-background relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/9dedb845-d564-4666-b1ef-2bc1d8289353.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className={`relative ${isMobile ? 'px-2' : 'px-6'}`}>
        <GameInterface />
      </div>
    </div>
  );
};

export default Game;