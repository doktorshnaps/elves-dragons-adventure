
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface GameHeaderProps {
  balance: number;
  onBack: () => void;
}

export const GameHeader = ({ balance, onBack }: GameHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-game-surface/90 p-4">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
        <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
      </div>
    </div>
  );
};
