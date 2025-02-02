import { Button } from "@/components/ui/button";
import { RefreshCw, ShoppingCart, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const NavigationBar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const resetGame = () => {
    localStorage.removeItem('gameCards');
    localStorage.removeItem('gameInitialized');
    localStorage.removeItem('gameBalance');
    localStorage.removeItem('gameInventory');
    localStorage.removeItem('battleState');
    localStorage.removeItem('dragonEggs');
    localStorage.removeItem('marketplaceListings');
    localStorage.removeItem('dungeonEnergy');
    localStorage.removeItem('socialQuests');

    toast({
      title: "Игра сброшена",
      description: "Все данные очищены. Игра начнется заново при следующем входе.",
    });

    window.location.reload();
  };

  return (
    <div className="relative z-10 w-full p-4 flex justify-between items-center">
      <Button
        variant="outline"
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={resetGame}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Сбросить игру
      </Button>
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/marketplace')}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Торговая площадка
        </Button>
        <Button
          variant="outline"
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/grimoire')}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Гримуар
        </Button>
      </div>
    </div>
  );
};