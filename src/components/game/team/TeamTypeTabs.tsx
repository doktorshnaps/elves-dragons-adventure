import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, Crown } from 'lucide-react';

export type TeamType = 'dungeon' | 'pvp';

interface TeamTypeTabsProps {
  activeType: TeamType;
  activeTier: number | null;
  onTypeChange: (type: TeamType, tier: number | null) => void;
}

const RARITY_NAMES = [
  'Обычный',
  'Необычный', 
  'Редкий',
  'Эпический',
  'Легендарный',
  'Мифический',
  'Божественный',
  'Трансцендентный'
];

export const TeamTypeTabs: React.FC<TeamTypeTabsProps> = ({
  activeType,
  activeTier,
  onTypeChange
}) => {
  const getTabValue = () => {
    if (activeType === 'dungeon') return 'dungeon';
    return `pvp-${activeTier}`;
  };

  const handleTabChange = (value: string) => {
    if (value === 'dungeon') {
      onTypeChange('dungeon', null);
    } else {
      const tier = parseInt(value.replace('pvp-', ''));
      onTypeChange('pvp', tier);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <Tabs value={getTabValue()} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-auto p-1 bg-black/60 border-2 border-white/30 rounded-xl gap-1 min-w-max">
          {/* Dungeon Tab */}
          <TabsTrigger
            value="dungeon"
            className="flex items-center gap-2 px-3 py-2 text-sm data-[state=active]:bg-amber-600/80 data-[state=active]:text-white rounded-lg whitespace-nowrap"
          >
            <Crown className="w-4 h-4" />
            <span>Подземелье</span>
          </TabsTrigger>
          
          {/* PvP Tier Tabs */}
          {Array.from({ length: 8 }, (_, i) => i + 1).map((tier) => (
            <TabsTrigger
              key={tier}
              value={`pvp-${tier}`}
              className="flex items-center gap-1.5 px-2 py-2 text-xs data-[state=active]:bg-red-600/80 data-[state=active]:text-white rounded-lg whitespace-nowrap"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Лига {tier}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* Active team description */}
      <div className="mt-2 text-xs text-white/70">
        {activeType === 'dungeon' ? (
          <span>Команда для прохождения подземелий</span>
        ) : (
          <span>
            PvP Лига {activeTier}: только карты редкости {RARITY_NAMES[(activeTier || 1) - 1]} и ниже
          </span>
        )}
      </div>
    </div>
  );
};
