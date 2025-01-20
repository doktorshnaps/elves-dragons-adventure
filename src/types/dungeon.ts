export interface DungeonRoom {
  id: string;
  type: 'combat' | 'treasure' | 'boss';
  isCompleted: boolean;
  isAccessible: boolean;
  position: {
    x: number;
    y: number;
  };
  connections: string[]; // IDs of connected rooms
}

export interface DungeonState {
  dungeonName: string;
  currentRoomId: string;
  rooms: DungeonRoom[];
  playerPosition: {
    x: number;
    y: number;
  };
}