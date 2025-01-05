import { GameTitle } from "@/components/GameTitle";

const Index = () => {
  return (
    <div className="min-h-screen bg-game-background flex items-center justify-center">
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-game-primary/20 rounded-full filter blur-3xl animate-pulse" />
        </div>
        <GameTitle />
      </div>
    </div>
  );
};

export default Index;