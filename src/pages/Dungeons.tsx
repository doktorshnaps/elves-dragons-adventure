import { DungeonSearch } from "@/components/DungeonSearch";
import { useNavigate } from "react-router-dom";
import { useBalanceState } from "@/hooks/useBalanceState";
import { usePageMeta } from "@/hooks/usePageTitle";

const Dungeons = () => {
  const navigate = useNavigate();
  const { balance, updateBalance } = useBalanceState();
  usePageMeta({ 
    title: 'Подземелья', 
    description: 'Исследуй подземелья, сражайся с боссами, получай награды в токенах. 50+ уникальных локаций с нарастающей сложностью.' 
  });

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