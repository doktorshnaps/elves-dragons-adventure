import { useState, useCallback } from 'react';
import { generateDungeon, GeneratedDungeon } from '@/utils/dungeonGenerator';
import { DungeonType } from '@/constants/dungeons';

export const useDungeonGeneration = (initialDungeonType: DungeonType, initialLevel: number) => {
  const [dungeon, setDungeon] = useState<GeneratedDungeon>(() => 
    generateDungeon(initialDungeonType, initialLevel)
  );
  const [currentRoom, setCurrentRoom] = useState<string>(dungeon.startRoom);

  const regenerateDungeon = useCallback((dungeonType: DungeonType, level: number) => {
    const newDungeon = generateDungeon(dungeonType, level);
    setDungeon(newDungeon);
    setCurrentRoom(newDungeon.startRoom);
  }, []);

  const moveToRoom = useCallback((roomId: string) => {
    setCurrentRoom(roomId);
    setDungeon(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => 
        room.id === roomId ? { ...room, cleared: true } : room
      )
    }));
  }, []);

  return {
    dungeon,
    currentRoom,
    regenerateDungeon,
    moveToRoom
  };
};