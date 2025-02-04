import { DungeonSearch } from "@/components/DungeonSearch";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBalanceState } from "@/hooks/useBalanceState";

const Dungeons = () => {
  const navigate = useNavigate();
  const { balance, updateBalance } = useBalanceState();

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10">
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
    </div>
  );
};

export default Dungeons;