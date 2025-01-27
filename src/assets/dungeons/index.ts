import blackDragonLair from './black-dragon-lair.png';
import forgottenSoulsCave from './forgotten-souls-cave.png';
import icyThrone from './icy-throne.png';
import darkMageTower from './dark-mage-tower.png';
import spiderNest from './spider-nest.png';
import boneDemonDungeon from './bone-demon-dungeon.png';
import seaSerpentLair from './sea-serpent-lair.png';
import inventoryBackground from './inventory-background.png';
import teamStatsBackground from './team-stats-background.png';
import gameBackground from './game-background.png';

export const dungeonBackgrounds = {
  "Логово Черного Дракона": blackDragonLair,
  "Пещеры Забытых Душ": forgottenSoulsCave,
  "Трон Ледяного Короля": icyThrone,
  "Лабиринт Темного Мага": darkMageTower,
  "Гнездо Гигантских Пауков": spiderNest,
  "Темница Костяных Демонов": boneDemonDungeon,
  "Логово Морского Змея": seaSerpentLair
} as const;

export const backgrounds = {
  inventory: inventoryBackground,
  teamStats: teamStatsBackground,
  game: gameBackground
};