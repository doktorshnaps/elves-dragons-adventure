import { useMemo } from 'react';
import { useCardInstancesContext } from '@/providers/CardInstancesProvider';
import { Card, CardType } from '@/types/cards';
import { normalizeCardType } from '@/utils/cardTypeNormalization';

/**
 * ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ КАРТ
 * 
 * Все карты берутся ТОЛЬКО из card_instances таблицы.
 * НЕ используйте gameData.cards или gameStore.cards - они deprecated.
 * 
 * КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Убрана группировка по card_template_id,
 * которая приводила к потере дубликатов карт.
 * Теперь каждый card_instance отображается как отдельная карта.
 * 
 * Usage:
 * const { cards, getCardById, heroes, dragons, loading } = useCards();
 */
export const useCards = () => {
  const { cardInstances, loading } = useCardInstancesContext();

  // Преобразуем ВСЕ card_instances в Card[] без группировки
  // Каждый instance - это отдельная карта с уникальным instanceId
  const cards = useMemo((): Card[] => {
    if (!cardInstances?.length) return [];

    return cardInstances
      .filter(instance => {
        // Исключаем только рабочих
        const cardType = instance.card_type;
        const dataType = (instance.card_data as any)?.type as CardType;
        const isWorker = cardType === 'workers' || (cardType as string) === 'worker' || dataType === 'workers';
        return !isWorker;
      })
      .map(instance => {
        const rawCardData = instance.card_data as any;
        
        const rawType = rawCardData.type || instance.card_type || 'character';
        const normalizedType = normalizeCardType(rawType);
        
        return {
          id: rawCardData.id || instance.card_template_id,
          instanceId: instance.id, // UUID из card_instances - КРИТИЧНО для уникальной идентификации
          name: rawCardData.name || 'Unknown',
          type: normalizedType,
          power: instance.max_power || rawCardData.power || 0,
          defense: instance.max_defense || rawCardData.defense || 0,
          health: instance.max_health || rawCardData.health || 100,
          magic: instance.max_magic || rawCardData.magic || 0,
          rarity: rawCardData.rarity || 1,
          cardClass: rawCardData.cardClass,
          faction: rawCardData.faction,
          image: rawCardData.image,
          description: rawCardData.description,
          isNFT: rawCardData.isNFT,
          nftContractId: rawCardData.nftContractId,
          nftTokenId: rawCardData.nftTokenId,
          // Актуальные значения из card_instances (источник правды)
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: instance.last_heal_time ? new Date(instance.last_heal_time).getTime() : undefined,
          isInMedicalBay: instance.is_in_medical_bay || false,
          monsterKills: instance.monster_kills || 0,
        } as Card;
      });
  }, [cardInstances]);

  // Получить карту по ID (template_id или instance_id)
  const getCardById = useMemo(() => {
    return (cardId: string): Card | undefined => {
      return cards.find(c => c.id === cardId || c.instanceId === cardId);
    };
  }, [cards]);

  // Получить карту по instance UUID (приоритетный метод)
  const getCardByInstanceId = useMemo(() => {
    return (instanceId: string): Card | undefined => {
      return cards.find(c => c.instanceId === instanceId);
    };
  }, [cards]);

  // Получить только героев
  const heroes = useMemo(() => {
    return cards.filter(c => c.type === 'character');
  }, [cards]);

  // Получить только драконов
  const dragons = useMemo(() => {
    return cards.filter(c => c.type === 'pet');
  }, [cards]);

  // Получить живые карты (currentHealth > 0)
  const aliveCards = useMemo(() => {
    return cards.filter(c => (c.currentHealth ?? c.health) > 0);
  }, [cards]);

  // Получить мертвые карты (currentHealth === 0)
  const deadCards = useMemo(() => {
    return cards.filter(c => (c.currentHealth ?? c.health) <= 0);
  }, [cards]);

  // Получить карты в медпункте
  const cardsInMedicalBay = useMemo(() => {
    return cards.filter(c => c.isInMedicalBay);
  }, [cards]);

  // Проверка наличия карт
  const hasCards = cards.length > 0;
  const hasHeroes = heroes.length > 0;
  const hasDragons = dragons.length > 0;

  return {
    cards,
    heroes,
    dragons,
    aliveCards,
    deadCards,
    cardsInMedicalBay,
    hasCards,
    hasHeroes,
    hasDragons,
    loading,
    getCardById,
    getCardByInstanceId,
    // Для совместимости - количество
    cardsCount: cards.length,
    heroesCount: heroes.length,
    dragonsCount: dragons.length,
  };
};

/**
 * DEPRECATED: Используйте useCards() вместо этого
 * Оставлено для обратной совместимости
 */
export const useCardsWithHealth = useCards;
