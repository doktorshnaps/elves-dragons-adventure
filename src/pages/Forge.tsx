import React from 'react';
import { ForgeBayComponent } from '@/components/game/forge/ForgeBayComponent';
import { useShelterState } from '@/hooks/shelter/useShelterState';
import { usePageMeta } from '@/hooks/usePageTitle';

export const Forge = () => {
  usePageMeta({ 
    title: 'Кузница', 
    description: 'Ремонтируй броню героев и драконов в кузнице. Восстанавливай защиту для следующих сражений!' 
  });
  const { buildingLevels } = useShelterState();
  
  return (
    <div className="container mx-auto p-4">
      <ForgeBayComponent forgeLevel={buildingLevels.forge || 1} />
    </div>
  );
};
