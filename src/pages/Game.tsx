import { GameInterface } from "@/components/GameInterface";
import { useIsMobile } from "@/hooks/use-mobile";

const Game = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-game-background ${isMobile ? 'px-2' : 'px-6'}`}>
      <GameInterface />
    </div>
  );
};

export default Game;