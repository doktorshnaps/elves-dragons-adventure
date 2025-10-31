import { Button } from "@/components/ui/button";
import { ShoppingCart, BarChart3 } from "lucide-react";

interface GameActionsProps {
  onOpenShop: () => void;
  onOpenStats: () => void;
}

export const GameActions = ({ onOpenShop, onOpenStats }: GameActionsProps) => {
  return (
    <div className="mt-8 flex justify-center gap-4">
      <Button
        variant="outline"
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={onOpenShop}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Открыть магазин
      </Button>
      <Button
        variant="outline"
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={onOpenStats}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        Статистика
      </Button>
    </div>
  );
};