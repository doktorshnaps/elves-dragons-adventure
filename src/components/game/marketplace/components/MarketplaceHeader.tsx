import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MarketplaceHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-4">
      <Button 
        variant="outline" 
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={() => navigate('/menu')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
    </div>
  );
};