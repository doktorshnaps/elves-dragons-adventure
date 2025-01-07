import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DoorOpen, Menu } from "lucide-react";

export const ExitDungeonButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExit = () => {
    localStorage.removeItem('battleState');
    toast({
      title: "Подземелье покинуто",
      description: "Вы успешно покинули подземелье",
    });
    navigate('/game');
  };

  const handleReturnToMenu = () => {
    navigate('/game');
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleReturnToMenu}
        variant="outline"
        className="bg-blue-500 hover:bg-blue-600 text-white"
      >
        <Menu className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>

      <Button 
        onClick={handleExit}
        variant="outline"
        className="bg-red-500 hover:bg-red-600 text-white"
      >
        <DoorOpen className="w-4 h-4 mr-2" />
        Покинуть подземелье
      </Button>
    </div>
  );
};