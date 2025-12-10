import React from 'react';
import { MedicalBayComponent } from '@/components/game/medical/MedicalBayComponent';
import { usePageMeta } from '@/hooks/usePageTitle';

export const MedicalBay = () => {
  usePageMeta({ 
    title: 'Медпункт', 
    description: 'Восстанавливай здоровье героев и драконов. Воскрешай павших карточек для продолжения битвы!' 
  });
  
  return (
    <div className="container mx-auto p-4">
      <MedicalBayComponent />
    </div>
  );
};