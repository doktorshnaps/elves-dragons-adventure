import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { Inventory } from "@/components/battle/Inventory";
import { useBattleState } from "@/hooks/useBattleState";
import { Button } from "@/components/ui/button";
import { DungeonMinimap } from "@/components/dungeon/DungeonMinimap";
import { DungeonState } from "@/types/dungeon";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dungeonState, setDungeonState] = useState<DungeonState | null>(null);
  
  const {
    playerStats,
    opponents,
    inventory,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    level,
    handleNextLevel,
  } = useBattleState(1);

  useEffect(() => {
    const savedDungeonState = localStorage.getItem('dungeonState');
    if (savedDungeonState) {
      setDungeonState(JSON.parse(savedDungeonState));
    } else {
      navigate('/game');
    }
  }, [navigate]);

  const handleRoomChange = (roomId: string) => {
    if (!dungeonState) return;

    const targetRoom = dungeonState.rooms.find(r => r.id === roomId);
    const currentRoom = dungeonState.rooms.find(r => r.id === dungeonState.currentRoomId);

    if (!targetRoom || !currentRoom || !targetRoom.isAccessible) return;

    if (!currentRoom.connections.includes(roomId)) {
      toast({
        title: "Недоступная комната",
        description: "Вы можете перемещаться только в соседние комнаты",
        variant: "destructive"
      });
      return;
    }

    const newDungeonState = {
      ...dungeonState,
      currentRoomId: roomId,
      rooms: dungeonState.rooms.map(room => {
        if (room.id === currentRoom.id) {
          return { ...room, isCompleted: true };
        }
        if (room.id === roomId) {
          return { ...room, isAccessible: true };
        }
        return room;
      })
    };

    setDungeonState(newDungeonState);
    localStorage.setItem('dungeonState', JSON.stringify(newDungeonState));
    handleNextLevel();
  };

  if (!playerStats || !dungeonState) return null;

  const currentRoom = dungeonState.rooms.find(r => r.id === dungeonState.currentRoomId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-game-background relative p-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PlayerCard
              playerStats={{
                health: playerStats.health,
                maxHealth: playerStats.maxHealth,
                power: playerStats.power,
                defense: playerStats.defense
              }}
            />
            
            <div className="space-y-4">
              {opponents.map((opponent) => (
                <OpponentCard
                  key={opponent.id}
                  opponent={opponent}
                  onAttack={() => attackEnemy(opponent.id)}
                  isPlayerTurn={isPlayerTurn}
                  currentLevel={level}
                  playerHealth={playerStats.health}
                />
              ))}
              
              {opponents.length === 0 && currentRoom?.type !== 'treasure' && (
                <div className="text-center p-4">
                  <p className="text-game-accent mb-4">Комната зачищена!</p>
                  <Button
                    onClick={() => handleNextLevel()}
                    className="bg-game-primary hover:bg-game-primary/80"
                  >
                    Призвать следующую волну врагов
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Inventory items={inventory} onUseItem={useItem} />
        </div>
      </div>

      <DungeonMinimap
        rooms={dungeonState.rooms}
        currentRoomId={dungeonState.currentRoomId}
        onRoomClick={handleRoomChange}
      />
    </motion.div>
  );
};

export default Battle;