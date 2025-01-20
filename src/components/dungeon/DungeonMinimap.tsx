import React from 'react';
import { DungeonRoom } from '@/types/dungeon';
import { cn } from '@/lib/utils';

interface DungeonMinimapProps {
  rooms: DungeonRoom[];
  currentRoomId: string;
  onRoomClick: (roomId: string) => void;
}

export const DungeonMinimap = ({ rooms, currentRoomId, onRoomClick }: DungeonMinimapProps) => {
  return (
    <div className="fixed bottom-4 right-4 w-48 h-48 bg-black/80 rounded-lg p-2 border border-game-accent">
      <div className="relative w-full h-full">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={cn(
              "absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all",
              room.isAccessible ? "opacity-100" : "opacity-50",
              room.isCompleted ? "bg-green-500" : "bg-game-accent",
              currentRoomId === room.id && "ring-2 ring-white",
              !room.isAccessible && "cursor-not-allowed"
            )}
            style={{
              left: `${(room.position.x + 1) * 50}%`,
              top: `${(room.position.y + 1) * 50}%`,
            }}
            onClick={() => room.isAccessible && onRoomClick(room.id)}
          />
        ))}
        {rooms.map((room) => (
          <React.Fragment key={`lines-${room.id}`}>
            {room.connections.map((connectedId) => {
              const connectedRoom = rooms.find((r) => r.id === connectedId);
              if (!connectedRoom) return null;

              const startX = (room.position.x + 1) * 50;
              const startY = (room.position.y + 1) * 50;
              const endX = (connectedRoom.position.x + 1) * 50;
              const endY = (connectedRoom.position.y + 1) * 50;

              return (
                <svg
                  key={`line-${room.id}-${connectedId}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <line
                    x1={`${startX}%`}
                    y1={`${startY}%`}
                    x2={`${endX}%`}
                    y2={`${endY}%`}
                    stroke={room.isAccessible && connectedRoom.isAccessible ? "#fff" : "#666"}
                    strokeWidth="2"
                    strokeDasharray={!room.isAccessible || !connectedRoom.isAccessible ? "4" : "0"}
                  />
                </svg>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};