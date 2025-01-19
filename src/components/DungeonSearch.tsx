import React from "react";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useEnergy } from "@/utils/energyManager";
import { dungeons } from "@/constants/dungeons";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { calculateTeamStats } from "@/utils/cardUtils";

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const DungeonSearch = ({ onClose, balance, onBalanceChange }: DungeonSearchProps) => {
  const [hasActiveCards, setHasActiveCards] = React.useState(false);
  const [selectedDungeon, setSelectedDungeon] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { energyState, timeUntilNext } = useEnergy();

  // Проверяем наличие активных карт
  React.useEffect(() => {
    const checkActiveCards = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const heroes = cards.filter(card => card.type === 'character');
        setHasActiveCards(heroes.length > 0);
      } else {
        setHasActiveCards(false);
      }
    };

    checkActiveCards();
    window.addEventListener('cardsUpdate', checkActiveCards);
    window.addEventListener('storage', checkActiveCards);

    return () => {
      window.removeEventListener('cardsUpdate', checkActiveCards);
      window.removeEventListener('storage', checkActiveCards);
    };
  }, []);

  // При открытии компонента поиска подземелья, сбрасываем состояние битвы
  React.useEffect(() => {
    localStorage.removeItem('battleState');
  }, []);

  const isHealthTooLow = React.useMemo(() => {
    const savedCards = localStorage.getItem('gameCards');
    if (savedCards) {
      const cards = JSON.parse(savedCards);
      const teamStats = calculateTeamStats(cards);
      return teamStats.health < teamStats.health * 0.2; // Using health instead of maxHealth
    }
    return false;
  }, []);

  const enterDungeon = () => {
    if (!selectedDungeon) {
      toast({
        title: "Выберите подземелье",
        description: "Пожалуйста, выберите подземелье для входа",
        variant: "destructive",
      });
      return;
    }

    if (energyState.current <= 0) {
      toast({
        title: "Недостаточно энергии",
        description: "Подождите пока энергия восстановится",
        variant: "destructive",
      });
      return;
    }

    if (isHealthTooLow) {
      toast({
        title: "Низкое здоровье",
        description: "Подождите пока здоровье восстановится до 20% от максимума",
        variant: "destructive",
      });
      return;
    }

    const savedCards = localStorage.getItem('gameCards');
    if (savedCards) {
      const cards = JSON.parse(savedCards);
      const teamStats = calculateTeamStats(cards);

      const battleState = {
        playerStats: {
          health: teamStats.health,
          maxHealth: teamStats.health,
          power: teamStats.power,
          defense: teamStats.defense
        },
        opponents: [],
        currentDungeonLevel: 1,
        inventory: [],
        coins: balance,
        selectedDungeon
      };

      localStorage.setItem('battleState', JSON.stringify(battleState));
      
      toast({
        title: "Подземелье найдено!",
        description: `Вы входите в ${selectedDungeon}`,
      });

      setTimeout(() => {
        navigate("/battle");
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <DungeonSearchDialog
        onClose={onClose}
        balance={balance}
        selectedDungeon={selectedDungeon}
        onDungeonSelect={setSelectedDungeon}
        energyState={energyState}
        timeUntilNext={timeUntilNext}
        isHealthTooLow={isHealthTooLow}
        onEnterDungeon={enterDungeon}
        hasActiveCards={hasActiveCards}
        dungeons={dungeons}
      />
    </div>
  );
};