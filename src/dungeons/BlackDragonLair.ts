import { Opponent } from "@/types/battle";
import { getScaledStats } from "@/utils/opponentGenerator";

export const generateBlackDragonLairOpponents = (level: number): Opponent[] => {
  const cycleLevel = ((level - 1) % 5) + 1;
  
  switch (cycleLevel) {
    case 1:
      return [
        {
          id: 1,
          name: "Воин Драконид",
          power: getScaledStats(6, level),
          health: getScaledStats(80, level),
          maxHealth: getScaledStats(80, level)
        },
        {
          id: 2,
          name: "Маг Драконид",
          power: getScaledStats(8, level),
          health: getScaledStats(60, level),
          maxHealth: getScaledStats(60, level)
        },
        {
          id: 3,
          name: "Защитник Драконид",
          power: getScaledStats(5, level),
          health: getScaledStats(100, level),
          maxHealth: getScaledStats(100, level)
        },
        {
          id: 4,
          name: "Воин Драконид",
          power: getScaledStats(6, level),
          health: getScaledStats(80, level),
          maxHealth: getScaledStats(80, level)
        },
        {
          id: 5,
          name: "Маг Драконид",
          power: getScaledStats(8, level),
          health: getScaledStats(60, level),
          maxHealth: getScaledStats(60, level)
        }
      ];
    
    case 2:
      return [
        {
          id: 1,
          name: "Воин Ветеран Драконид",
          power: getScaledStats(10, level),
          health: getScaledStats(120, level),
          maxHealth: getScaledStats(120, level)
        },
        {
          id: 2,
          name: "Генерал Драконидов",
          power: getScaledStats(12, level),
          health: getScaledStats(150, level),
          maxHealth: getScaledStats(150, level)
        },
        {
          id: 3,
          name: "Ветеран Защитник Драконид",
          power: getScaledStats(8, level),
          health: getScaledStats(180, level),
          maxHealth: getScaledStats(180, level)
        },
        {
          id: 4,
          name: "Маг Ветеран Драконид",
          power: getScaledStats(14, level),
          health: getScaledStats(90, level),
          maxHealth: getScaledStats(90, level)
        }
      ];
    
    case 3:
      return [
        {
          id: 1,
          name: "Грауграт",
          power: getScaledStats(15, level),
          health: getScaledStats(200, level),
          maxHealth: getScaledStats(200, level)
        },
        {
          id: 2,
          name: "Дарксторм",
          power: getScaledStats(18, level),
          health: getScaledStats(180, level),
          maxHealth: getScaledStats(180, level)
        },
        {
          id: 3,
          name: "Флиндо",
          power: getScaledStats(16, level),
          health: getScaledStats(190, level),
          maxHealth: getScaledStats(190, level)
        }
      ];
    
    case 4:
      return [
        {
          id: 1,
          name: "Кристалспин",
          power: getScaledStats(22, level),
          health: getScaledStats(250, level),
          maxHealth: getScaledStats(250, level)
        },
        {
          id: 2,
          name: "Скарлетстрайк",
          power: getScaledStats(25, level),
          health: getScaledStats(230, level),
          maxHealth: getScaledStats(230, level)
        }
      ];
    
    case 5:
      const bossHealth = getScaledStats(400, level, true);
      return [{
        id: 1,
        name: "🔥 Морок",
        power: getScaledStats(35, level, true),
        health: bossHealth,
        maxHealth: bossHealth,
        isBoss: true
      }];
    
    default:
      return [];
  }
};