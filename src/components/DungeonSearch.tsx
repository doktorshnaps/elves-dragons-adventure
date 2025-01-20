import React from "react";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useEnergy } from "@/utils/energyManager";
import { dungeons } from "@/constants/dungeons";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { calculateTeamStats } from "@/utils/cardUtils";
import { DungeonRoom, DungeonState } from "@/types/dungeon";

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

const generateDungeonRooms = (): DungeonRoom[] => {
  const rooms: DungeonRoom[] = [];
  const size = 3; // 3x3 grid

  // Generate rooms in a grid
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const id = `room-${x}-${y}`;
      const isStart = x === 1 && y === 2; // Bottom center is start
      const isBoss = x === 1 && y === 0; // Top center is boss

      rooms.push({
        id,
        type: isBoss ? 'boss' : (Math.random() > 0.3 ? 'combat' : 'treasure'),
        isCompleted: false,
        isAccessible: isStart,
        position: { x: x - 1, y: y - 1 },
        connections: []
      });
    }
  }

  // Connect rooms
  rooms.forEach((room) => {
    const { x, y } = room.position;
    const possibleConnections = rooms.filter((otherRoom) => {
      const dx = Math.abs(otherRoom.position.x - x);
      const dy = Math.abs(otherRoom.position.y - y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });

    room.connections = possibleConnections.map(r => r.id);
  });

  return rooms;
};

export const DungeonSearch = ({ onClose, balance, onBalanceChange }: DungeonSearchProps) => {
  const [hasActiveCards, setHasActiveCards] = React.useState(false);
  const [selectedDungeon, setSelectedDungeon] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { energyState, timeUntilNext, useEnergyPoint } = useEnergy();

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

  React.useEffect(() => {
    localStorage.removeItem('battleState');
    localStorage.removeItem('dungeonState');
  }, []);

  const isHealthTooLow = React.useMemo(() => {
    const savedCards = localStorage.getItem('gameCards');
    if (savedCards) {
      const cards = JSON.parse(savedCards);
      const teamStats = calculateTeamStats(cards);
      return teamStats.health < teamStats.health * 0.2;
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

    if (!useEnergyPoint()) {
      return;
    }

    const savedCards = localStorage.getItem('gameCards');
    if (savedCards) {
      const cards = JSON.parse(savedCards);
      const teamStats = calculateTeamStats(cards);

      // Generate dungeon layout
      const rooms = generateDungeonRooms();
      const dungeonState: DungeonState = {
        dungeonName: selectedDungeon,
        currentRoomId: rooms.find(r => r.position.x === 0 && r.position.y === 1)?.id || rooms[0].id,
        rooms,
        playerPosition: { x: 0, y: 1 }
      };

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
      localStorage.setItem('dungeonState', JSON.stringify(dungeonState));
      
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