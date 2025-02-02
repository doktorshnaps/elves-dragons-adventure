import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdventureHeaderProps {
  level: number;
  balance: number;
}

export const AdventureHeader = ({ level, balance }: AdventureHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center">
      <Button 
        variant="outline" 
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={() => navigate('/game')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="text-base text-gray-200">Уровень: {level}</span>
        </div>
        <span className="text-2xl font-bold text-yellow-400">{balance} монет</span>
      </div>
    </div>
  );
};