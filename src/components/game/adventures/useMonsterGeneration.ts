import { Monster } from "./types";

export const useMonsterGeneration = (baseLevel: number) => {
  const generateMonster = (position?: number): Monster => {
    const powerMultiplier = 1 + (baseLevel - 1) * 0.5;
    const healthMultiplier = 1 + (baseLevel - 1) * 0.3;
    const rewardMultiplier = 1 + (baseLevel - 1) * 0.7;

    const monsterTypes: Array<{ type: 'normal' | 'elite' | 'boss', chance: number, expReward: number }> = [
      { type: 'normal', chance: 0.7, expReward: 30 },
      { type: 'elite', chance: 0.25, expReward: 60 },
      { type: 'boss', chance: 0.05, expReward: 100 }
    ];

    const roll = Math.random();
    let cumulativeChance = 0;
    let selectedType = monsterTypes[0];

    for (const type of monsterTypes) {
      cumulativeChance += type.chance;
      if (roll <= cumulativeChance) {
        selectedType = type;
        break;
      }
    }

    const monsters = [
      "Дикий волк",
      "Горный тролль",
      "Лесной разбойник",
      "Древний голем",
      "Темный маг",
      "Ядовитый паук",
      "Скелет-воин",
      "Болотная тварь",
      "Огненный элементаль",
      "Ледяной великан"
    ];

    const monsterName = monsters[Math.floor(Math.random() * monsters.length)];
    const baseHealth = selectedType.type === 'boss' ? 100 : selectedType.type === 'elite' ? 75 : 50;
    const basePower = selectedType.type === 'boss' ? 20 : selectedType.type === 'elite' ? 15 : 10;
    
    return {
      id: Date.now() + Math.random(),
      name: `${selectedType.type === 'boss' ? 'Босс: ' : selectedType.type === 'elite' ? 'Элитный: ' : ''}${monsterName}`,
      power: Math.floor(basePower * powerMultiplier),
      health: Math.floor(baseHealth * healthMultiplier),
      maxHealth: Math.floor(baseHealth * healthMultiplier),
      reward: Math.floor(20 * rewardMultiplier),
      experienceReward: selectedType.expReward,
      type: selectedType.type,
      position: position || 400
    };
  };

  return { generateMonster };
};