import React from 'react';
import { ForgeBayComponent } from '@/components/game/forge/ForgeBayComponent';
import { useShelterState } from '@/hooks/shelter/useShelterState';

export const Forge = () => {
  const { buildingLevels } = useShelterState();
  
  return (
    <div className="container mx-auto p-4">
      <ForgeBayComponent forgeLevel={buildingLevels.forge || 1} />
    </div>
  );
};
