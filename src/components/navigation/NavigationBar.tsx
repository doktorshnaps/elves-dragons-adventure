import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const NavigationBar = () => {
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
    <div className="relative z-10 w-full p-4">
      <Button
        variant="outline"
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={resetGame}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Сбросить игру
      </Button>
    </div>
  );
};