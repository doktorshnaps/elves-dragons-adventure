import { DungeonRoom, DungeonState } from "@/types/dungeon";

const generateRoom = (
  id: string,
  type: 'combat' | 'treasure' | 'boss',
  position: { x: number, y: number }
): DungeonRoom => ({
  id,
  type,
  isCompleted: false,
  isAccessible: position.x === 0 && position.y === 0,
  position,
  connections: []
});

export const generateDungeon = (dungeonName: string): DungeonState => {
  const rooms: DungeonRoom[] = [];
  const width = 4;
  const height = 4;

  // Создаем сетку комнат
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = `room-${x}-${y}`;
      const isBossRoom = x === width - 1 && y === height - 1;
      const isTreasureRoom = Math.random() < 0.2 && !isBossRoom;
      
      rooms.push(generateRoom(
        id,
        isBossRoom ? 'boss' : (isTreasureRoom ? 'treasure' : 'combat'),
        { x, y }
      ));
    }
  }

  // Создаем соединения между комнатами
  rooms.forEach(room => {
    const { x, y } = room.position;
    
    // Добавляем случайные дополнительные соединения для создания более сложного лабиринта
    const possibleConnections = [];
    
    if (x > 0) possibleConnections.push(`room-${x-1}-${y}`);
    if (x < width - 1) possibleConnections.push(`room-${x+1}-${y}`);
    if (y > 0) possibleConnections.push(`room-${x}-${y-1}`);
    if (y < height - 1) possibleConnections.push(`room-${x}-${y+1}`);
    
    // Добавляем диагональные соединения с вероятностью 30%
    if (x > 0 && y > 0 && Math.random() < 0.3) {
      possibleConnections.push(`room-${x-1}-${y-1}`);
    }
    if (x < width - 1 && y > 0 && Math.random() < 0.3) {
      possibleConnections.push(`room-${x+1}-${y-1}`);
    }
    
    // Гарантируем, что каждая комната имеет хотя бы одно соединение
    const minConnections = Math.max(1, Math.floor(possibleConnections.length * 0.5));
    const shuffled = possibleConnections.sort(() => Math.random() - 0.5);
    room.connections = shuffled.slice(0, minConnections);
    
    // Делаем соединения двусторонними
    room.connections.forEach(targetId => {
      const targetRoom = rooms.find(r => r.id === targetId);
      if (targetRoom && !targetRoom.connections.includes(room.id)) {
        targetRoom.connections.push(room.id);
      }
    });
  });

  return {
    dungeonName,
    currentRoomId: 'room-0-0',
    rooms,
    playerPosition: { x: 0, y: 0 }
  };
};