import { calculateTeamStats } from "@/utils/cardUtils";
import { generateDungeonOpponents } from "@/dungeons/dungeonManager";

export const useBattleStateInitializer = () => {
  const initializeBattleState = (selectedDungeon: string, balance: number) => {
    if (!selectedDungeon) {
      throw new Error("No dungeon selected");
    }

    const savedCards = localStorage.getItem('gameCards');
    if (!savedCards) {
      throw new Error("No cards found");
    }

    const cards = JSON.parse(savedCards);
    const teamStats = calculateTeamStats(cards);

    const opponents = generateDungeonOpponents(selectedDungeon, 1);
    console.log("Selected dungeon:", selectedDungeon);
    console.log("Generated opponents:", opponents);

    if (!opponents || opponents.length === 0) {
      throw new Error("Failed to generate opponents");
    }

    const battleState = {
      playerStats: {
        health: teamStats.health,
        maxHealth: teamStats.health,
        power: teamStats.power,
        defense: teamStats.defense
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