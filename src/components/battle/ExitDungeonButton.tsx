import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DoorOpen } from "lucide-react";

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

  return (
    <Button 
      onClick={handleExit}
      variant="outline"
      className="bg-red-500 hover:bg-red-600 text-white"
    >
      <DoorOpen className="w-4 h-4 mr-2" />
      Покинуть подземелье
    </Button>
  );
};