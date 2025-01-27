import React from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sword, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerStats } from "@/types/battle";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatBar } from "@/components/ui/stat-bar";

interface PlayerCardProps {
  playerStats: PlayerStats;
}

export const PlayerCard = ({ playerStats }: PlayerCardProps) => {
  const isMobile = useIsMobile();

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
              <StatBar
                value={playerStats.health}
                max={playerStats.maxHealth}
                color="#ef4444"
                height="h-1.5 md:h-2.5"
                className="w-full md:w-32"
                showText
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};