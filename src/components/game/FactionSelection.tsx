import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { factions } from '@/data/factions';
import { useFactionState } from '@/hooks/useFactionState';
import { motion } from 'framer-motion';

export const FactionSelection = () => {
  const { selectFaction, selectedFaction } = useFactionState();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-game-accent mb-6">Выберите фракцию</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {factions.map((faction) => (
          <motion.div
            key={faction.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`p-4 cursor-pointer ${
                selectedFaction?.name === faction.name 
                  ? 'border-2 border-game-accent' 
                  : 'border border-game-accent/20'
              }`}
              onClick={() => selectFaction(faction)}
            >
              <h3 className="text-xl font-bold text-game-accent mb-2">{faction.name}</h3>
              <p className="text-sm text-gray-400 mb-2">{faction.description}</p>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-bold">Стихия:</span> {faction.element}</p>
                <p className="text-sm"><span className="font-bold">Дракон:</span> {faction.dragonType}</p>
                <p className="text-sm"><span className="font-bold">Способность:</span> {faction.specialAbility}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-bold">Сила</div>
                  <div>{faction.baseStats.power}</div>
                </div>
                <div>
                  <div className="font-bold">Защита</div>
                  <div>{faction.baseStats.defense}</div>
                </div>
                <div>
                  <div className="font-bold">Магия</div>
                  <div>{faction.baseStats.magic}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};