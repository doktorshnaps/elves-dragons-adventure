import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const NavigationBar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

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

    navigate('/');
  };

  return (
    <div className="relative z-10 w-full p-4 flex justify-end">
      <Button
        variant="outline"
        className="bg-purple-600/80 hover:bg-purple-700 text-white"
        onClick={resetGame}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Сбросить игру
      </Button>
    </div>
  );
};