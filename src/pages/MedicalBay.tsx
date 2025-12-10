import React from 'react';
import { MedicalBayComponent } from '@/components/game/medical/MedicalBayComponent';
import { usePageTitle } from '@/hooks/usePageTitle';

export const MedicalBay = () => {
  usePageTitle('Медпункт - Лечение героев');
  
  return (
    <div className="container mx-auto p-4">
      <MedicalBayComponent />
    </div>
  );
};