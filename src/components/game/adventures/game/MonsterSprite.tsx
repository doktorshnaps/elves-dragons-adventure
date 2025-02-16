
import React from 'react';
import { motion } from 'framer-motion';
import { Monster } from '../types';
import { useToast } from '@/hooks/use-toast';
import { HealthBar } from './components/HealthBar';

interface MonsterSpriteProps {
  monster: Monster;
  position: number;
  onSelect: (monster: Monster) => void;
  isTargeted: boolean;
}

export const MonsterSprite = ({ 
  monster, 
  position, 
  onSelect,
  isTargeted 
}: MonsterSpriteProps) => {
  const { toast } = useToast();
  
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Monster clicked:", monster);
    onSelect(monster);
    toast({
      title: "Цель выбрана",
      description: `${monster.name} выбран целью для атаки`
    });
  };

  return (
    <motion.div
      className={`absolute bottom-[50px] cursor-pointer z-20 ${
        isTargeted ? 'ring-4 ring-game-accent ring-offset-2 rounded-lg' : ''
      }`}
      style={{ left: position }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="px-2 py-1 bg-game-surface/80 rounded text-sm text-white backdrop-blur-sm space-y-1">
            <div>{monster.name}</div>
            <div className="text-xs">
              ⚔️ {monster.power}
            </div>
          </div>
        </div>

        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20">
          <HealthBar 
            current={monster.health}
            max={monster.maxHealth}
            className="bg-red-900"
            indicatorClassName="bg-red-500"
            showValue={true}
          />
        </div>

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
