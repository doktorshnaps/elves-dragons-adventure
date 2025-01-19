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
          maxHealth: getScaledStats(80, level),
          image: "/lovable-uploads/a0564796-e124-4d24-99c2-33fd81d40f33.png"
        },
        {
          id: 2,
          name: "Маг Драконид",
          power: getScaledStats(8, level),
          health: getScaledStats(60, level),
          maxHealth: getScaledStats(60, level),
          image: "/lovable-uploads/6daa465b-a7a9-4a8e-aff1-10e39f4cb35c.png"
        },
        {
          id: 3,
          name: "Защитник Драконид",
          power: getScaledStats(5, level),
          health: getScaledStats(100, level),
          maxHealth: getScaledStats(100, level),
          image: "/lovable-uploads/fa275f77-d4b5-440e-992d-8ab28fddb462.png"
        }
      ];
    
    case 2:
      return [
        {
          id: 1,
          name: "Воин Ветеран Драконид",
          power: getScaledStats(10, level),
          health: getScaledStats(120, level),
          maxHealth: getScaledStats(120, level),
          image: "/lovable-uploads/2c52d6e5-a122-42b0-bc2d-a0e512dc6f1d.png"
        },
        {
          id: 2,
          name: "Ветеран Защитник Драконид",
          power: getScaledStats(8, level),
          health: getScaledStats(180, level),
          maxHealth: getScaledStats(180, level),
          image: "/lovable-uploads/784a4ae5-5649-4d42-b7e5-5c369875d7a5.png"
        },
        {
          id: 3,
          name: "Маг Ветеран Драконид",
          power: getScaledStats(14, level),
          health: getScaledStats(90, level),
          maxHealth: getScaledStats(90, level),
          image: "/lovable-uploads/bebbb653-ee59-476b-b370-5c97f8ed8905.png"
        },
        {
          id: 4,
          name: "Генерал Драконид",
          power: getScaledStats(16, level),
          health: getScaledStats(150, level),
          maxHealth: getScaledStats(150, level),
          image: "/lovable-uploads/2c18d5b6-350b-4f71-93c6-07c5aec90385.png"
        }
      ];
    
    case 3:
      return [
        {
          id: 1,
          name: "Грауграт",
          power: getScaledStats(15, level),
          health: getScaledStats(200, level),
          maxHealth: getScaledStats(200, level),
          image: "/lovable-uploads/afb1a004-7e68-4aad-b869-c75f0df086c7.png"
        },
        {
          id: 2,
          name: "Дарксторм",
          power: getScaledStats(18, level),
          health: getScaledStats(180, level),
          maxHealth: getScaledStats(180, level),
          image: "/lovable-uploads/c6ecc1a1-329f-4ccb-9eba-0f81fecee99c.png"
        },
        {
          id: 3,
          name: "Флиндо",
          power: getScaledStats(16, level),
          health: getScaledStats(190, level),
          maxHealth: getScaledStats(190, level),
          image: "/lovable-uploads/db1eb268-503b-4132-b244-9c29b059f888.png"
        }
      ];
    
    case 4:
      return [
        {
          id: 1,
          name: "Кристалспин",
          power: getScaledStats(22, level),
          health: getScaledStats(250, level),
          maxHealth: getScaledStats(250, level),
          image: "/lovable-uploads/7d822219-ea60-4ba1-96ff-1a48100342eb.png"
        },
        {
          id: 2,
          name: "Скарлетстрайк",
          power: getScaledStats(25, level),
          health: getScaledStats(230, level),
          maxHealth: getScaledStats(230, level),
          image: "/lovable-uploads/49320036-3a6a-4fd7-a337-f216ad03549c.png"
        }
      ];
    
    case 5:
      return [{
        id: 1,
        name: "🔥 Морок",
        power: getScaledStats(35, level),
        health: getScaledStats(400, level),
        maxHealth: getScaledStats(400, level),
        image: "/lovable-uploads/c4c7de60-34c9-4c14-9318-2dbd20467d89.png",
        isBoss: true
      }];
    
    default:
      return [];
  }
};