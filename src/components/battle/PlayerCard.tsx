import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sword, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerStats } from "@/types/battle";
import { calculateTeamStats } from "@/utils/cardUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlayerCardProps {
  playerStats: PlayerStats;
}

export const PlayerCard = ({ playerStats }: PlayerCardProps) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    const savedState = localStorage.getItem('battleState');
    if (!savedState) {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const teamStats = calculateTeamStats(cards);
        
        const initialState = {
          playerStats: {
            power: teamStats.power,
            defense: teamStats.defense,
            health: teamStats.health,
            maxHealth: teamStats.health,
            experience: 0,
            level: 1,
            requiredExperience: 100
          },
          currentDungeonLevel: 1
        };
        
        localStorage.setItem('battleState', JSON.stringify(initialState));
        window.dispatchEvent(new CustomEvent('battleStateUpdate', { 
          detail: { state: initialState }
        }));
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 md:mt-8"
    >
      <Card className="p-3 md:p-6 bg-game-surface border-game-primary">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 bg-game-primary rounded-full">
              <Shield className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base md:text-xl font-bold text-game-accent">Ваша команда</h3>
            </div>
          </div>
          <div className="flex gap-4 md:gap-8">
            <div className="text-center">
              <Sword className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-game-accent" />
              <p className="text-xs md:text-sm text-gray-400">Сила</p>
              <p className="font-bold text-sm md:text-base text-game-accent">{playerStats.power}</p>
            </div>
            <div className="text-center">
              <Shield className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-game-accent" />
              <p className="text-xs md:text-sm text-gray-400">Защита</p>
              <p className="font-bold text-sm md:text-base text-game-accent">{playerStats.defense}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 md:gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 md:gap-2">
              <Heart className="w-4 h-4 md:w-6 md:h-6 text-red-500" />
              <div className="w-full md:w-32 bg-gray-700 rounded-full h-1.5 md:h-2.5">
                <div
                  className="bg-red-600 h-1.5 md:h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs md:text-sm text-gray-400">
                {playerStats.health}/{playerStats.maxHealth}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};