import { calculateTeamStats } from "@/utils/cardUtils";
import { generateDungeonOpponents } from "@/dungeons/dungeonManager";

export const useBattleStateInitializer = () => {
  const initializeBattleState = (selectedDungeon: string, balance: number) => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    const opponents = generateDungeonOpponents(selectedDungeon, 1);
    console.log("Selected dungeon:", selectedDungeon);
    console.log("Generated opponents:", opponents);

    const battleState = {
      playerStats: {
        health: teamStats.health,
        maxHealth: teamStats.health,
        power: teamStats.power,
        defense: teamStats.defense,
        experience: 0,
        level: 1,
        requiredExperience: 100
      },
      selectedDungeon,
      currentDungeonLevel: 1,
      opponents,
      inventory: [],
      coins: balance
    };

    localStorage.setItem('battleState', JSON.stringify(battleState));
    return battleState;
  };

  return {
    initializeBattleState
  };
};