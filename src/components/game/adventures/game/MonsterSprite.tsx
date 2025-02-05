import React from 'react';
import { motion } from 'framer-motion';
import { Monster } from '../types';

interface MonsterSpriteProps {
  monster: Monster;
  position: number;
}

export const MonsterSprite = ({ monster, position }: MonsterSpriteProps) => {
  const getMonsterEmoji = (type: string) => {
    switch (type) {
      case 'boss':
        return '👿';
      case 'elite':
        return '👹';
      default:
        return '👾';
    }
  };

  return (
    <motion.div
      className="absolute bottom-[50px]"
      style={{ left: position }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="relative">
        {/* Monster name */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="px-2 py-1 bg-game-surface/80 rounded text-sm text-white backdrop-blur-sm">
            {monster.name}
          </span>
        </div>

        {/* Health bar */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20">
          <div className="h-2 bg-red-900 rounded-full">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-300"
              style={{ width: `${(monster.health / monster.maxHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Monster sprite */}
        <div 
          className={`w-12 h-16 ${
            monster.type === 'boss' ? 'bg-red-600' : 
            monster.type === 'elite' ? 'bg-purple-600' : 
            'bg-blue-600'
          } rounded-lg flex items-center justify-center text-2xl`}
        >
          {getMonsterEmoji(monster.type)}
        </div>
      </div>
    </motion.div>
  );
};