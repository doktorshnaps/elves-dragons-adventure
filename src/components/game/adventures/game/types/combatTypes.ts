
export interface TargetedMonster {
  id: number;
  position: number;
}

export interface ProjectileData {
  id: number;
  x: number;
  y: number;
  direction: number;
  monsterId: number;
}
