import { DungeonSearch } from "@/components/DungeonSearch";
import { useNavigate } from "react-router-dom";
import { useBalanceState } from "@/hooks/useBalanceState";

const Dungeons = () => {
  const navigate = useNavigate();
  const { balance, updateBalance } = useBalanceState();

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10">
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