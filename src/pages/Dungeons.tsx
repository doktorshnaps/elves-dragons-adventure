import { DungeonSearch } from "@/components/DungeonSearch";
import { useNavigate } from "react-router-dom";
import { useBalanceState } from "@/hooks/useBalanceState";

const Dungeons = () => {
  const navigate = useNavigate();
  const { balance, updateBalance } = useBalanceState();

  return (
    <div className="p-4">
      <DungeonSearch 
        onClose={() => navigate('/menu')} 
        balance={balance}
        onBalanceChange={updateBalance}
      />
    </div>
  );
};

export default Dungeons;