import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DeckSelection, TeamPair } from './DeckSelection';
import { TeamTypeTabs, TeamType } from './TeamTypeTabs';
import { ActiveBattleWarning } from './ActiveBattleWarning';
import { usePlayerTeams } from '@/hooks/usePlayerTeams';
import { useCardInstancesContext } from '@/providers/CardInstancesProvider';
import { Card as CardType } from '@/types/cards';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const MultiTeamCards: React.FC = () => {
  const { toast } = useToast();
  const { cardInstances } = useCardInstancesContext();
  
  const {
    activeTeam,
    activeTeamType,
    activeTier,
    loading: teamsLoading,
    updateActiveTeam,
    switchTeam
  } = usePlayerTeams();

  // Build cards from card instances
  const cards = useMemo(() => {
    return cardInstances
      .filter(ci => ci.card_type === 'hero' || ci.card_type === 'dragon')
      .map(instance => {
        const cardData = instance.card_data as any;
        // Normalize DB types (hero/dragon) to app types (character/pet)
        const rawType = cardData.type || instance.card_type || 'character';
        const normalizedType = rawType === 'hero' ? 'character' : rawType === 'dragon' ? 'pet' : rawType;
        return {
          id: instance.id,
          instanceId: instance.id,
          templateId: instance.card_template_id,
          name: cardData.name,
          type: normalizedType,
          faction: cardData.faction,
          rarity: cardData.rarity,
          image: cardData.image,
          power: instance.max_power,
          defense: instance.max_defense,
          health: instance.max_health,
          magic: instance.max_magic,
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time || Date.now()).getTime(),
          monster_kills: instance.monster_kills,
          isInMedicalBay: instance.is_in_medical_bay || false
        };
      });
  }, [cardInstances]);

  // Filter cards by rarity for PvP tiers
  const filteredCards = useMemo(() => {
    if (activeTeamType === 'dungeon') {
      return cards;
    }
    // PvP: only cards with rarity <= tier
    const maxRarity = activeTier || 1;
    return cards.filter(card => (card.rarity || 1) <= maxRarity);
  }, [cards, activeTeamType, activeTier]);

  // Convert stored team data to TeamPair format with fresh card data
  const selectedPairs = useMemo((): TeamPair[] => {
    return (activeTeam || []).map(pair => {
      const freshHero = cards.find(c => c.id === pair.hero?.id || c.id === pair.hero?.instanceId);
      const freshDragon = pair.dragon 
        ? cards.find(c => c.id === pair.dragon?.id || c.id === pair.dragon?.instanceId)
        : undefined;
      
      return {
        hero: freshHero || pair.hero,
        dragon: freshDragon || pair.dragon
      };
    }).filter(pair => pair.hero);
  }, [activeTeam, cards]);

  // Handlers
  const handlePairSelect = useCallback(async (hero: CardType, dragon?: CardType) => {
    // Check rarity for PvP
    if (activeTeamType === 'pvp' && activeTier) {
      if ((hero.rarity || 1) > activeTier) {
        toast({
          title: 'Недопустимая редкость',
          description: `В лиге ${activeTier} можно использовать только карты редкости ${activeTier} и ниже`,
          variant: 'destructive'
        });
        return;
      }
      if (dragon && (dragon.rarity || 1) > activeTier) {
        toast({
          title: 'Недопустимая редкость дракона',
          description: `В лиге ${activeTier} можно использовать только драконов редкости ${activeTier} и ниже`,
          variant: 'destructive'
        });
        return;
      }
    }

    // Check team size
    if (selectedPairs.length >= 5) {
      toast({
        title: 'Команда заполнена',
        description: 'Максимум 5 пар в команде',
        variant: 'destructive'
      });
      return;
    }

    // Check if hero already in team
    if (selectedPairs.some(p => p.hero?.id === hero.id)) {
      toast({
        title: 'Герой уже в команде',
        description: `${hero.name} уже добавлен`,
        variant: 'destructive'
      });
      return;
    }

    const newPair: TeamPair = { hero, dragon };
    const newTeam = [...selectedPairs, newPair];
    await updateActiveTeam(newTeam);
  }, [selectedPairs, updateActiveTeam, activeTeamType, activeTier, toast]);

  const handlePairRemove = useCallback(async (index: number) => {
    const newTeam = selectedPairs.filter((_, i) => i !== index);
    await updateActiveTeam(newTeam);
  }, [selectedPairs, updateActiveTeam]);

  const handleAssignDragon = useCallback(async (index: number, dragon: CardType) => {
    // Check rarity for PvP
    if (activeTeamType === 'pvp' && activeTier) {
      if ((dragon.rarity || 1) > activeTier) {
        toast({
          title: 'Недопустимая редкость',
          description: `В лиге ${activeTier} можно использовать только драконов редкости ${activeTier} и ниже`,
          variant: 'destructive'
        });
        return;
      }
    }

    const pair = selectedPairs[index];
    if (!pair) return;

    // Check faction
    if (pair.hero.faction !== dragon.faction) {
      toast({
        title: 'Неверная фракция',
        description: 'Дракон должен быть той же фракции, что и герой',
        variant: 'destructive'
      });
      return;
    }

    // Check rarity rule
    if ((dragon.rarity || 1) > (pair.hero.rarity || 1)) {
      toast({
        title: 'Недостаточный ранг героя',
        description: 'Герой может управлять драконом своего ранга или ниже',
        variant: 'destructive'
      });
      return;
    }

    const newTeam = selectedPairs.map((p, i) => 
      i === index ? { ...p, dragon } : p
    );
    await updateActiveTeam(newTeam);
  }, [selectedPairs, updateActiveTeam, activeTeamType, activeTier, toast]);

  const handleRemoveDragon = useCallback(async (index: number) => {
    const newTeam = selectedPairs.map((p, i) => 
      i === index ? { ...p, dragon: undefined } : p
    );
    await updateActiveTeam(newTeam);
  }, [selectedPairs, updateActiveTeam]);

  const handleTypeChange = useCallback((type: TeamType, tier: number | null) => {
    switchTeam(type, tier);
  }, [switchTeam]);

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="ml-2 text-white">Загрузка команд...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Active Battle Warning */}
      <ActiveBattleWarning />
      
      {/* Team Type Selector */}
      <TeamTypeTabs
        activeType={activeTeamType}
        activeTier={activeTier}
        onTypeChange={handleTypeChange}
      />
      
      {/* Team Selection Interface */}
      <DeckSelection
        cards={filteredCards as CardType[]}
        selectedPairs={selectedPairs}
        onPairSelect={handlePairSelect}
        onPairRemove={handlePairRemove}
        onPairAssignDragon={handleAssignDragon}
        onPairRemoveDragon={handleRemoveDragon}
      />
      
      {/* Team Stats */}
      {selectedPairs.length > 0 && (
        <section 
          className="bg-black/50 backdrop-blur-sm p-2 sm:p-3 rounded-3xl border-2 border-white" 
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <h2 className="text-sm sm:text-lg font-bold text-white mb-2 sm:mb-3">
            Статистика команды ({activeTeamType === 'dungeon' ? 'Подземелье' : `PvP Лига ${activeTier}`})
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(() => {
              let power = 0, defense = 0, health = 0;
              selectedPairs.forEach(pair => {
                power += pair.hero?.power || 0;
                defense += pair.hero?.currentDefense || pair.hero?.defense || 0;
                health += pair.hero?.currentHealth || pair.hero?.health || 0;
                if (pair.dragon) {
                  power += pair.dragon.power || 0;
                  defense += pair.dragon.currentDefense || pair.dragon.defense || 0;
                  health += pair.dragon.currentHealth || pair.dragon.health || 0;
                }
              });
              return (
                <>
                  <article className="text-center p-2 sm:p-3 rounded-2xl bg-black/40 border-2 border-white/30">
                    <div className="text-lg sm:text-2xl font-bold text-red-400">{power}</div>
                    <div className="text-xs sm:text-sm text-white/80">Сила</div>
                  </article>
                  <article className="text-center p-2 sm:p-3 rounded-2xl bg-black/40 border-2 border-white/30">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">{defense}</div>
                    <div className="text-xs sm:text-sm text-white/80">Защита</div>
                  </article>
                  <article className="text-center p-2 sm:p-3 rounded-2xl bg-black/40 border-2 border-white/30">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{health}</div>
                    <div className="text-xs sm:text-sm text-white/80">Здоровье</div>
                  </article>
                </>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
};
