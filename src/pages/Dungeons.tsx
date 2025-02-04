import { DungeonSearch } from "@/components/DungeonSearch";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBalanceState } from "@/hooks/useBalanceState";

const Dungeons = () => {
  const navigate = useNavigate();
  const { balance, updateBalance } = useBalanceState();

  return (
    <div className="min-h-screen p-4">
      <Button
        variant="outline"
        className="mb-4 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={() => navigate('/menu')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      
      <DungeonSearch 
        onClose={() => navigate('/menu')} 
        balance={balance}
        onBalanceChange={updateBalance}
      />
    </div>
  );
};

export default Dungeons;