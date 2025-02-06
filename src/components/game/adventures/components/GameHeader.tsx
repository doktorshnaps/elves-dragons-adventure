
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface GameHeaderProps {
  balance: number;
  onBack: () => void;
}

export const GameHeader = ({ balance, onBack }: GameHeaderProps) => {
  return (
    <div className="flex items-center h-full">
      <Button 
        variant="outline" 
        className="fixed left-4 top-4 z-50 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
    </div>
  );
};
