import { GameContainer } from "@/components/game/GameContainer";

export const Game = () => {
  return (
    <div className="h-screen flex flex-col bg-game-background">
      <div className="flex-1 overflow-y-auto">
        <GameContainer />
      </div>
    </div>
  );
};