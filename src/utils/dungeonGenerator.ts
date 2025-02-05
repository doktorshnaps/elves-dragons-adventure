import { DungeonType } from '@/constants/dungeons';

export interface DungeonRoom {
  id: string;
  type: 'normal' | 'elite' | 'boss' | 'treasure' | 'shop';
  position: { x: number; y: number };
  connections: string[];
  cleared: boolean;
  enemies?: number;
  treasure?: boolean;
}

export interface GeneratedDungeon {
  rooms: DungeonRoom[];
  startRoom: string;
  bossRoom: string;
  dungeonType: DungeonType;
  level: number;
}

const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

const createRoom = (
  type: DungeonRoom['type'],
  position: { x: number; y: number }
): DungeonRoom => ({
  id: generateUniqueId(),
  type,
  position,
  connections: [],
  cleared: false,
  enemies: type === 'normal' ? Math.floor(Math.random() * 3) + 1 : 
          type === 'elite' ? Math.floor(Math.random() * 2) + 2 : 
          type === 'boss' ? 1 : 0,
  treasure: type === 'treasure' || Math.random() < 0.3
});

export const generateDungeon = (dungeonType: DungeonType, level: number): GeneratedDungeon => {
  const rooms: DungeonRoom[] = [];
  const gridSize = Math.min(5 + Math.floor(level / 3), 10);
  
  // Создаем стартовую комнату
  const startRoom = createRoom('normal', { x: 0, y: 0 });
  rooms.push(startRoom);

  // Генерируем основные комнаты
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (i === 0 && j === 0) continue; // Пропускаем стартовую комнату

      const shouldCreateRoom = Math.random() < 0.7;
      if (!shouldCreateRoom) continue;

      const roomType = Math.random() < 0.2 ? 'elite' :
                      Math.random() < 0.3 ? 'treasure' :
                      'normal';

      const room = createRoom(roomType, { 
        x: (i - Math.floor(gridSize/2)) * 200, 
        y: (j - Math.floor(gridSize/2)) * 200 
      });
      rooms.push(room);
    }
  }

  // Добавляем комнату босса
  const bossRoom = createRoom('boss', {
    x: (gridSize - Math.floor(gridSize/2)) * 200,
    y: 0
  });
  rooms.push(bossRoom);

  // Создаем соединения между комнатами
  rooms.forEach(room => {
    rooms.forEach(otherRoom => {
      if (room.id === otherRoom.id) return;

      const distance = Math.sqrt(
        Math.pow(room.position.x - otherRoom.position.x, 2) +
        Math.pow(room.position.y - otherRoom.position.y, 2)
      );

      if (distance <= 250) {
        room.connections.push(otherRoom.id);
        otherRoom.connections.push(room.id);
      }
    });
  });

  return {
    rooms,
    startRoom: startRoom.id,
    bossRoom: bossRoom.id,
    dungeonType,
    level
  };
};