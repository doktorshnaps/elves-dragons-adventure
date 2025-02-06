export interface Projectile {
  id: number;
  x: number;
  y: number;
  direction: number;
  monsterId: number; // Добавляем ID монстра
}