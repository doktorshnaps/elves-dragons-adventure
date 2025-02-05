import React from 'react';
import { DungeonRoom, GeneratedDungeon } from '@/utils/dungeonGenerator';

interface DungeonMapProps {
  dungeon: GeneratedDungeon;
  currentRoom: string;
  onRoomSelect: (roomId: string) => void;
}

export const DungeonMap: React.FC<DungeonMapProps> = ({
  dungeon,
  currentRoom,
  onRoomSelect
}) => {
  const getRoomColor = (room: DungeonRoom) => {
    if (room.id === currentRoom) return 'bg-game-accent';
    if (!room.cleared) {
      switch (room.type) {
        case 'boss': return 'bg-red-600';
        case 'elite': return 'bg-purple-600';
        case 'treasure': return 'bg-yellow-600';
        case 'shop': return 'bg-blue-600';
        default: return 'bg-gray-600';
      }
    }
    return 'bg-green-600';
  };

  const canAccessRoom = (room: DungeonRoom) => {
    return room.connections.includes(currentRoom) || room.id === currentRoom;
  };

  return (
    <div className="fixed top-4 right-4 w-64 h-64 bg-game-surface/80 rounded-lg p-4">
      <div className="relative w-full h-full">
        {dungeon.rooms.map(room => (
          <React.Fragment key={room.id}>
            {room.connections.map(connectionId => {
              const connectedRoom = dungeon.rooms.find(r => r.id === connectionId);
              if (!connectedRoom) return null;

              const startX = (room.position.x / 200 * 32) + 32;
              const startY = (room.position.y / 200 * 32) + 32;
              const endX = (connectedRoom.position.x / 200 * 32) + 32;
              const endY = (connectedRoom.position.y / 200 * 32) + 32;

              return (
                <div
                  key={`${room.id}-${connectionId}`}
                  className="absolute bg-gray-500"
                  style={{
                    left: Math.min(startX, endX),
                    top: Math.min(startY, endY),
                    width: '2px',
                    height: Math.abs(endY - startY),
                    transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
        {dungeon.rooms.map(room => (
          <button
            key={room.id}
            className={`absolute w-4 h-4 rounded-full ${getRoomColor(room)} 
                       ${canAccessRoom(room) ? 'cursor-pointer hover:ring-2 ring-white' : 'opacity-50 cursor-not-allowed'}`}
            style={{
              left: (room.position.x / 200 * 32) + 30,
              top: (room.position.y / 200 * 32) + 30,
            }}
            onClick={() => canAccessRoom(room) && onRoomSelect(room.id)}
            disabled={!canAccessRoom(room)}
          />
        ))}
      </div>
    </div>
  );
};