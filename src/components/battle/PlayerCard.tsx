import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sword, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerStats } from "@/types/battle";
import { calculateTeamStats } from "@/utils/cardUtils";

interface PlayerCardProps {
  playerStats: PlayerStats;
}

export const PlayerCard = ({ playerStats }: PlayerCardProps) => {
  useEffect(() => {
    const updateStatsFromTeam = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const teamStats = calculateTeamStats(cards);
        
        // Обновляем статистику в battleState
        const savedState = localStorage.getItem('battleState');
        if (savedState) {
          const state = JSON.parse(savedState);
          state.playerStats.power = teamStats.power;
          state.playerStats.defense = teamStats.defense;
          localStorage.setItem('battleState', JSON.stringify(state));
        }
      }
    };

    // Обновляем статистику при монтировании компонента
    updateStatsFromTeam();

    // Подписываемся на изменения карт
    const handleCardsUpdate = () => {
      updateStatsFromTeam();
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate);
    
    // Проверяем обновления каждую секунду
    const interval = setInterval(updateStatsFromTeam, 1000);

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <Card className="p-6 bg-game-surface border-game-primary">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-game-primary rounded-full">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-game-accent">Ваша команда</h3>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <Sword className="w-6 h-6 mx-auto mb-2 text-game-accent" />
              <p className="text-sm text-gray-400">Сила атаки</p>
              <p className="font-bold text-game-accent">{playerStats.power}</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-game-accent" />
              <p className="text-sm text-gray-400">Защита</p>
              <p className="font-bold text-game-accent">{playerStats.defense}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <div className="w-32 bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                ></div>
              </div>
              <span className="text-gray-400">
                {playerStats.health}/{playerStats.maxHealth}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};