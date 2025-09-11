import { useState, useCallback } from 'react';
import { Card } from '@/types/cards';
import { Ability, HERO_ABILITIES } from '@/types/abilities';
import { PlayerStats, Opponent } from '@/types/battle';
import { useToast } from '@/hooks/use-toast';

export interface TeamCard extends Card {
  currentMana: number;
  maxMana: number;
  abilities: Ability[];
}

export const useAbilities = (
  playerStats: PlayerStats,
  setPlayerStats: (stats: PlayerStats) => void,
  opponents: Opponent[],
  setOpponents: (opponents: Opponent[]) => void,
  teamCards: Card[]
) => {
  const [selectedCard, setSelectedCard] = useState<TeamCard | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);
  const { toast } = useToast();

  // Конвертируем карты команды в карты с способностями
  const convertToTeamCards = useCallback((cards: Card[]): TeamCard[] => {
    return cards.map(card => ({
      ...card,
      currentMana: card.magic, // Максимальная мана равна магии карты
      maxMana: card.magic,
      abilities: HERO_ABILITIES[card.name] || []
    }));
  }, []);

  const [enhancedTeamCards, setEnhancedTeamCards] = useState<TeamCard[]>(() => 
    convertToTeamCards(teamCards)
  );

  // Выбрать героя для использования способности
  const selectCardForAbility = useCallback((card: Card) => {
    const teamCard = enhancedTeamCards.find(c => c.id === card.id);
    if (!teamCard || teamCard.abilities.length === 0) {
      toast({
        title: "Нет способностей",
        description: `${card.name} не имеет доступных способностей`,
        variant: "destructive"
      });
      return;
    }

    setSelectedCard(teamCard);
    setShowAbilityMenu(true);
  }, [enhancedTeamCards, toast]);

  // Выбрать способность
  const selectAbility = useCallback((ability: Ability) => {
    if (!selectedCard) return;

    if (selectedCard.currentMana < ability.manaCost) {
      toast({
        title: "Недостаточно маны",
        description: `Требуется ${ability.manaCost} маны, доступно ${selectedCard.currentMana}`,
        variant: "destructive"
      });
      return;
    }

    setSelectedAbility(ability);
    setShowAbilityMenu(false);
    
    toast({
      title: "Способность выбрана",
      description: `${ability.name} готова к использованию. Выберите цель.`
    });
  }, [selectedCard, toast]);

  // Использовать способность на цели
  const useAbilityOnTarget = useCallback((targetId: number) => {
    if (!selectedCard || !selectedAbility) return;

    const ability = selectedAbility;
    
    // Обновляем ману героя
    setEnhancedTeamCards(prev => 
      prev.map(card => 
        card.id === selectedCard.id 
          ? { ...card, currentMana: card.currentMana - ability.manaCost }
          : card
      )
    );

    if (ability.type === 'damage' && ability.targetType === 'enemy') {
      // Атакующая способность
      const newOpponents = opponents.map(opponent => {
        if (opponent.id === targetId) {
          const newHealth = Math.max(0, opponent.health - ability.power);
          
          toast({
            title: `${ability.name}!`,
            description: `${selectedCard.name} использует ${ability.name} и наносит ${ability.power} урона ${opponent.name}!`,
          });

          return { ...opponent, health: newHealth };
        }
        return opponent;
      }).filter(opponent => opponent.health > 0);

      setOpponents(newOpponents);
    } else if (ability.type === 'heal' && ability.targetType === 'ally') {
      // Лечащая способность на союзника (игрока)
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + ability.power);
      
      setPlayerStats({
        ...playerStats,
        health: newHealth
      });

      toast({
        title: `${ability.name}!`,
        description: `${selectedCard.name} использует ${ability.name} и восстанавливает ${ability.power} здоровья!`,
      });
    }

    // Очищаем выбор
    setSelectedCard(null);
    setSelectedAbility(null);
  }, [selectedCard, selectedAbility, opponents, setOpponents, playerStats, setPlayerStats, toast]);

  // Отменить выбор способности
  const cancelAbility = useCallback(() => {
    setSelectedCard(null);
    setSelectedAbility(null);
    setShowAbilityMenu(false);
  }, []);

  // Восстановить ману всем героям (например, в начале боя или нового уровня)
  const restoreMana = useCallback(() => {
    setEnhancedTeamCards(prev => 
      prev.map(card => ({ ...card, currentMana: card.maxMana }))
    );
  }, []);

  return {
    enhancedTeamCards,
    selectedCard,
    selectedAbility,
    showAbilityMenu,
    selectCardForAbility,
    selectAbility,
    useAbilityOnTarget,
    cancelAbility,
    restoreMana
  };
};