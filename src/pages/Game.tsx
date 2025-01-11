import { GameInterface } from "@/components/GameInterface";
import { useIsMobile } from "@/hooks/use-mobile";

const Game = () => {
  const isMobile = useIsMobile();

  return (
    <div 
      className={`min-h-screen bg-game-background ${isMobile ? 'px-2' : 'px-6'}`}
      style={{
        backgroundImage: "url('/lovable-uploads/7b41199f-7eca-42a5-a6cc-42711e736f48.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10">
        <GameInterface />
      </div>
    </div>
  );
};

export default Game;