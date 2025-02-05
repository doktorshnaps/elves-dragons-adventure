import { useState, useEffect } from 'react';
import { Faction } from '@/types/factions';
import { getFactionByName } from '@/data/factions';
import { useToast } from '@/hooks/use-toast';

export const useFactionState = () => {
  const { toast } = useToast();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(() => {
    const savedFaction = localStorage.getItem('selectedFaction');
    if (savedFaction) {
      const faction = getFactionByName(savedFaction);
      return faction || null;
    }
    return null;
  });

  const selectFaction = (faction: Faction) => {
    setSelectedFaction(faction);
    localStorage.setItem('selectedFaction', faction.name);
    toast({
      title: "Фракция выбрана",
      description: `Вы присоединились к фракции ${faction.name}`,
    });
  };

  useEffect(() => {
    const savedFaction = localStorage.getItem('selectedFaction');
    if (savedFaction && !selectedFaction) {
      const faction = getFactionByName(savedFaction);
      if (faction) {
        setSelectedFaction(faction);
      }
    }
  }, [selectedFaction]);

  return {
    selectedFaction,
    selectFaction
  };
};