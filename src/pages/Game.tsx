import { GameInterface } from "@/components/GameInterface";
import { useIsMobile } from "@/hooks/use-mobile";
import { backgrounds } from "@/assets/dungeons";

const Game = () => {
  const isMobile = useIsMobile();

  return (
    <div 
      className="min-h-screen bg-game-background relative"
      style={{
        backgroundImage: `url(${backgrounds.game})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className={`relative z-10 ${isMobile ? 'px-2' : 'px-6'}`}>
        <GameInterface />
      </div>
    </div>
  );
};

export default Game;