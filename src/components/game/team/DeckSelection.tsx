import { useState, useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardDisplay } from "../CardDisplay";
import { CardPreviewModal } from "../cards/CardPreviewModal";
import { NFTTransferModal } from "./NFTTransferModal";
import { useToast } from "@/hooks/use-toast";
import { useCardInstances } from "@/hooks/useCardInstances";
import { useNFTCardIntegration } from "@/hooks/useNFTCardIntegration";
import { ArrowUpDown, Sparkles, Swords } from "lucide-react";
interface DeckSelectionProps {
  cards: CardType[];
  selectedPairs: TeamPair[];
  onPairSelect: (hero: CardType, dragon?: CardType) => void;
  onPairRemove: (index: number) => void;
  onPairAssignDragon: (index: number, dragon: CardType) => void;
  onPairRemoveDragon: (index: number) => void;
}
export interface TeamPair {
  hero: CardType;
  dragon?: CardType;
}
export const DeckSelection = ({
  cards,
  selectedPairs,
  onPairSelect,
  onPairRemove,
  onPairAssignDragon,
  onPairRemoveDragon
}: DeckSelectionProps) => {
  // Remove excessive logging in production
  if (import.meta.env.DEV) {
    console.log(`🎮 DeckSelection: ${cards.length} cards, ${selectedPairs.length} pairs`);
  }
  
  const [showHeroDeck, setShowHeroDeck] = useState(false);
  const [showDragonDeck, setShowDragonDeck] = useState(false);
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null);
  const [previewCard, setPreviewCard] = useState<CardType | null>(null);
  const [heroSortBy, setHeroSortBy] = useState<'none' | 'defense' | 'rarity'>('none');
  const [dragonSortBy, setDragonSortBy] = useState<'none' | 'defense' | 'rarity'>('none');

  // Debug: track sort state changes
  useEffect(() => {
    console.log('🔄 Hero sort changed to:', heroSortBy);
  }, [heroSortBy]);

  useEffect(() => {
    console.log('🔄 Dragon sort changed to:', dragonSortBy);
  }, [dragonSortBy]);
  const [previewAction, setPreviewAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const [previewDeleteAction, setPreviewDeleteAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const {
    toast
  } = useToast();

  // Интеграция NFT карт
  const {
    nftCards,
    isLoading: nftLoading
  } = useNFTCardIntegration();

  // Получаем актуальные card instances для отображения здоровья
  const {
    cardInstances
  } = useCardInstances();

  // Создаем карты НАПРЯМУЮ из card_instances - каждый instance = уникальная карта
  const localCards = useMemo(() => {
    // Карты из cardInstances (каждый instance - отдельная карта с уникальным id)
    const instanceCards = cardInstances
      .filter(ci => ci.card_type === 'hero' || ci.card_type === 'dragon')
      .map(instance => {
        const card = {
          // Используем instance.id как уникальный ID карты
          id: instance.id,
          instanceId: instance.id,
          templateId: instance.card_template_id,
          // Данные карты из card_data
          ...(instance.card_data as any),
          // Актуальное здоровье и броня из instance (КРИТИЧНО: не использовать ?? оператор!)
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          monster_kills: instance.monster_kills
        };
        
        // Детальное логирование для отладки
        if (card.name?.includes('Рекрут')) {
          console.log(`🔍 Recruit card created:`, {
            id: card.id,
            name: card.name,
            currentHealth: card.currentHealth,
            maxHealth: card.health,
            currentDefense: card.currentDefense,
            maxDefense: card.maxDefense,
            isDead: card.currentHealth === 0
          });
        }
        
        return card;
      });
    
    // Добавляем NFT карты (если есть)
    const result = [...instanceCards, ...nftCards];
    
    console.log(`🎴 DeckSelection: Created ${result.length} cards from ${cardInstances.length} instances`);
    
    // Детальное логирование для Рекрутов
    const recruits = result.filter(c => c.name?.includes('Рекрут'));
    console.log(`🔍 РЕКРУТЫ (всего ${recruits.length}):`, recruits.map(r => ({
      id: r.id.substring(0, 8),
      name: r.name,
      currentHealth: r.currentHealth,
      health: r.health,
      isDead: r.currentHealth === 0
    })));
    
    return result;
  }, [cardInstances, nftCards]);
  const heroes = useMemo(() => {
    console.log('🎯 Heroes useMemo triggered, sortBy:', heroSortBy);
    // ФИЛЬТРУЕМ мертвые карты (currentHealth <= 0) из списка доступных героев
    const filtered = localCards.filter(card => 
      card.type === 'character' && (card.currentHealth ?? card.health) > 0
    );
    console.log('📊 Filtered heroes (alive only):', filtered.length);
    
    // Детальное логирование отфильтрованных Рекрутов
    const filteredRecruits = filtered.filter(h => h.name?.includes('Рекрут'));
    console.log(`✅ Живые РЕКРУТЫ (${filteredRecruits.length}):`, filteredRecruits.map(r => ({
      id: r.id.substring(0, 8),
      currentHealth: r.currentHealth,
      health: r.health
    })));
    
    if (heroSortBy === 'defense') {
      console.log('🛡️ Sorting by max defense...');
      const sorted = [...filtered].sort((a, b) => {
        // Используем maxDefense, если доступна, иначе defense из card_data или базовое значение
        const defenseA = typeof a.maxDefense === 'number' && a.maxDefense > 0 
          ? a.maxDefense 
          : (typeof a.defense === 'number' ? a.defense : 0);
        const defenseB = typeof b.maxDefense === 'number' && b.maxDefense > 0 
          ? b.maxDefense 
          : (typeof b.defense === 'number' ? b.defense : 0);
        
        console.log(`Comparing: ${a.name} (${defenseA}) vs ${b.name} (${defenseB})`);
        return defenseB - defenseA;
      });
      console.log('✅ Sorted heroes:', sorted.slice(0, 10).map(h => `${h.name}: maxDef=${h.maxDefense}, def=${h.defense}`));
      return sorted;
    }
    
    if (heroSortBy === 'rarity') {
      console.log('✨ Sorting by rarity...');
      const sorted = [...filtered].sort((a, b) => {
        const rarityA = typeof a.rarity === 'number' ? a.rarity : 1;
        const rarityB = typeof b.rarity === 'number' ? b.rarity : 1;
        return rarityB - rarityA;
      });
      return sorted;
    }
    
    console.log('📋 No sorting applied');
    return filtered;
  }, [localCards, heroSortBy]);

  const dragons = useMemo(() => {
    // ФИЛЬТРУЕМ мертвые карты (currentHealth <= 0) из списка доступных драконов
    const filtered = localCards.filter(card => 
      card.type === 'pet' && (card.currentHealth ?? card.health) > 0
    );
    
    if (dragonSortBy === 'defense') {
      const sorted = [...filtered].sort((a, b) => {
        // Используем maxDefense, если доступна, иначе defense из card_data или базовое значение
        const defenseA = typeof a.maxDefense === 'number' && a.maxDefense > 0 
          ? a.maxDefense 
          : (typeof a.defense === 'number' ? a.defense : 0);
        const defenseB = typeof b.maxDefense === 'number' && b.maxDefense > 0 
          ? b.maxDefense 
          : (typeof b.defense === 'number' ? b.defense : 0);
        return defenseB - defenseA; // От большего к меньшему
      });
      return sorted;
    }
    if (dragonSortBy === 'rarity') {
      const sorted = [...filtered].sort((a, b) => {
        const rarityA = typeof a.rarity === 'number' ? a.rarity : 1;
        const rarityB = typeof b.rarity === 'number' ? b.rarity : 1;
        return rarityB - rarityA; // От большего к меньшему
      });
      return sorted;
    }
    return filtered;
  }, [localCards, dragonSortBy]);
  const isHeroSelected = (hero: CardType) => {
    // Для NFT карт сравниваем как по ID, так и по контракту/токену
    return selectedPairs.some(pair => {
      if (pair.hero.id === hero.id) return true;
      // Дополнительная проверка для NFT карт
      if (hero.isNFT && pair.hero.isNFT && 
          hero.nftContractId === pair.hero.nftContractId && 
          hero.nftTokenId === pair.hero.nftTokenId) {
        return true;
      }
      return false;
    });
  };
  const isDragonSelected = (dragon: CardType) => {
    return selectedPairs.some(pair => {
      if (pair.dragon?.id === dragon.id) return true;
      // Дополнительная проверка для NFT карт
      if (dragon.isNFT && pair.dragon?.isNFT && 
          dragon.nftContractId === pair.dragon.nftContractId && 
          dragon.nftTokenId === pair.dragon.nftTokenId) {
        return true;
      }
      return false;
    });
  };
  const getAvailableDragons = (heroFaction?: string, heroRarity?: number) => {
    if (!heroFaction) return [];
    
    return dragons.filter(dragon => {
      const sameFaction = dragon.faction === heroFaction;
      const notSelected = !isDragonSelected(dragon);
      const rarityOk = !heroRarity || (dragon.rarity ?? 1) <= heroRarity;
      
      return sameFaction && rarityOk && notSelected;
    });
  };
  const handleHeroSelect = (hero: CardType) => {
    onPairSelect(hero);
    setShowHeroDeck(false);
  };
  const handleDragonSelect = (dragon: CardType) => {
    if (activePairIndex !== null) {
      const pair = selectedPairs[activePairIndex];
      if (pair) {
        if (pair.hero.faction !== dragon.faction) {
          toast({
            title: 'Неверная фракция',
            description: 'Дракон должен быть той же фракции, что и герой',
            variant: 'destructive'
          });
        } else if ((pair.hero.rarity ?? 1) < (dragon.rarity ?? 1)) {
          toast({
            title: 'Недостаточный ранг героя',
            description: 'Герой может управлять драконом своего ранга или ниже',
            variant: 'destructive'
          });
        } else {
          onPairAssignDragon(activePairIndex, dragon);
        }
      }
      setActivePairIndex(null);
      setShowDragonDeck(false);
      return;
    }

    // Fallback: assign to any available hero without a dragon of the same faction
    const heroWithSameFaction = selectedPairs.find(pair => 
      pair.hero.faction === dragon.faction && 
      !pair.dragon && 
      (pair.hero.rarity ?? 1) >= (dragon.rarity ?? 1)
    );
    
    if (heroWithSameFaction) {
      const pairIndex = selectedPairs.findIndex(pair => pair === heroWithSameFaction);
      onPairAssignDragon(pairIndex, dragon);
    }
    setShowDragonDeck(false);
  };
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Синхронизируем selectedPairs с актуальными данными из localCards
  // УЧИТЫВАЕМ ФРАКЦИЮ при поиске карточки!
  const syncedSelectedPairs = useMemo(() => {
    return selectedPairs.map(pair => {
      // Находим актуальные данные героя по instanceId/id + faction (для различения одноименных карт разных фракций)
      const updatedHero = localCards.find(c => 
        (c.id === pair.hero.id || 
         (c as any).instanceId === pair.hero.id || 
         c.id === (pair.hero as any).instanceId) &&
        c.faction === pair.hero.faction
      );
      
      // Находим актуальные данные дракона (если есть) - также с учетом фракции
      const updatedDragon = pair.dragon ? localCards.find(c => 
        (c.id === pair.dragon!.id || 
         (c as any).instanceId === pair.dragon!.id || 
         c.id === (pair.dragon as any).instanceId) &&
        c.faction === pair.dragon!.faction
      ) : undefined;
      
      // Логирование для отладки
      if (pair.hero.name?.includes('Рекрут')) {
        console.log(`🔄 Syncing ${pair.hero.name} (${pair.hero.faction}) in team:`, {
          originalId: pair.hero.id,
          originalHealth: pair.hero.currentHealth,
          foundMatch: !!updatedHero,
          updatedId: updatedHero?.id,
          updatedHealth: updatedHero?.currentHealth,
          updatedFaction: updatedHero?.faction
        });
      }
      
      return {
        hero: updatedHero || pair.hero, // Используем обновленные данные или оригинал
        dragon: updatedDragon || pair.dragon
      };
    });
  }, [selectedPairs, localCards]);
  
  return <div className="h-full flex flex-col space-y-3">
      {/* Selected Pairs Display */}
      <section
        className="bg-black/50 backdrop-blur-sm p-2 sm:p-4 rounded-3xl border-2 border-white flex-shrink-0" 
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        aria-label="Выбранная команда"
      >
        <h1 className="text-sm sm:text-lg font-bold text-white mb-2 sm:mb-4">
          Выбранная команда ({syncedSelectedPairs.length}/5)
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {Array.from({
          length: 5
        }, (_, index) => {
          const pair = syncedSelectedPairs[index];
          return <div key={index} className="relative overflow-hidden border-2 border-white rounded-3xl p-2 sm:p-3 min-h-[160px] sm:min-h-[200px] bg-black/40 hover:border-white/80 transition-all duration-300">
                {pair ? <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-white font-medium">Пара {index + 1}</div>
                    <div className="grid grid-cols-2 gap-2 items-start justify-items-center">
                      <div className="space-y-1">
                        <div className="text-xs text-white/80 font-medium">Герой</div>
                        <CardDisplay card={pair.hero} showSellButton={false} className="w-[60px] h-[120px] sm:w-[80px] sm:h-[160px] md:w-[90px] md:h-[180px] lg:w-[100px] lg:h-[200px]" onClick={e => {
                    e.stopPropagation();
                    setPreviewCard(pair.hero);
                    setPreviewAction(null);
                    setPreviewDeleteAction({
                      label: 'Удалить героя из команды',
                      action: () => onPairRemove(index)
                    });
                  }} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-white/80 font-medium">Дракон</div>
                        {pair.dragon ? <CardDisplay card={pair.dragon} showSellButton={false} className="w-[60px] h-[120px] sm:w-[80px] sm:h-[160px] md:w-[90px] md:h-[180px] lg:w-[100px] lg:h-[200px]" onClick={e => {
                    e.stopPropagation();
                    setPreviewCard(pair.dragon!);
                    setPreviewAction(null);
                    setPreviewDeleteAction({
                      label: 'Удалить дракона из команды',
                      action: () => onPairRemoveDragon(index)
                    });
                   }} /> : <button type="button" onClick={() => {
                    setActivePairIndex(index);
                    setShowDragonDeck(true);
                  }} className="w-8 h-10 sm:w-12 sm:h-14 border-2 border-dashed border-white/40 rounded-lg flex items-center justify-center text-xs text-white/70 hover:text-white hover:border-white transition-all duration-300">
                            Выбрать дракона
                          </button>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onPairRemove(index)} className="w-full text-xs border-white text-white hover:bg-white hover:text-black">
                      Удалить
                    </Button>
                  </div> : <button 
                    type="button"
                    onClick={() => setShowHeroDeck(true)}
                    className="h-full w-full flex items-center justify-center text-white/40 text-xs sm:text-sm hover:text-white hover:bg-white/5 transition-all duration-300 rounded-xl cursor-pointer border-2 border-dashed border-white/20 hover:border-white/50"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>Пустой слот</span>
                      <span className="text-[10px] text-white/60">Нажмите для выбора героя</span>
                    </div>
                  </button>}
              </div>;
        })}
        </div>
      </section>

      {/* Deck Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0">
        <Button 
          onClick={() => setShowHeroDeck(true)} 
          className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-0.5 bg-white text-black backdrop-blur-sm border-2 border-white hover:bg-white/90 transition-all duration-300 group rounded-3xl overflow-hidden px-2"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="text-xs sm:text-sm font-bold text-black transition-colors">Колода героев</div>
          <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-black/20 text-black border-black/30 px-1.5 whitespace-nowrap leading-tight">{heroes.length} карт</Badge>
        </Button>

        <Button 
          onClick={() => {
            setActivePairIndex(null);
            setShowDragonDeck(true);
          }} 
          className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-0.5 bg-white text-black backdrop-blur-sm border-2 border-white hover:bg-white/90 transition-all duration-300 group rounded-3xl overflow-hidden px-2"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="text-xs sm:text-sm font-bold text-black transition-colors">Колода драконов</div>
          <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-black/20 text-black border-black/30 px-1.5 whitespace-nowrap leading-tight">{dragons.length} карт</Badge>
        </Button>
      </div>

      {/* Hero Deck Dialog */}
      <Dialog open={showHeroDeck} onOpenChange={setShowHeroDeck}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[80vh] bg-black/50 backdrop-blur-md border-2 border-white overflow-hidden flex flex-col rounded-3xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-white">Выберите героя</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
            <Button
              size="sm"
              variant={heroSortBy === 'defense' ? 'default' : 'outline'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 CLICKED Defense button! Current state:', heroSortBy);
                setHeroSortBy('defense');
                console.log('🔘 Called setHeroSortBy("defense")');
              }}
              className="flex items-center gap-2"
              type="button"
            >
              <Swords className="w-4 h-4" />
              По броне
              {heroSortBy === 'defense' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={heroSortBy === 'rarity' ? 'default' : 'outline'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 CLICKED Rarity button! Current state:', heroSortBy);
                setHeroSortBy('rarity');
                console.log('🔘 Called setHeroSortBy("rarity")');
              }}
              className="flex items-center gap-2"
              type="button"
            >
              <Sparkles className="w-4 h-4" />
              По редкости
              {heroSortBy === 'rarity' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={heroSortBy === 'none' ? 'default' : 'outline'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 CLICKED Reset button! Current state:', heroSortBy);
                setHeroSortBy('none');
                console.log('🔘 Called setHeroSortBy("none")');
              }}
              className="flex items-center gap-2"
              type="button"
            >
              Сбросить
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center w-full">
            {heroes.map(hero => {
            const isSelected = isHeroSelected(hero);
            const teamFull = selectedPairs.length >= 5;
            const canSelect = !isSelected && !teamFull;
            return <div key={hero.id} className={`cursor-pointer transition-all ${isSelected ? 'opacity-50' : 'hover:scale-105'}`} onClick={() => canSelect && handleHeroSelect(hero)}>
                  <CardDisplay card={hero} showSellButton={false} onClick={e => {
                e.stopPropagation();
                setPreviewCard(hero);
                setPreviewAction(canSelect ? {
                  label: 'Выбрать героя',
                  action: () => handleHeroSelect(hero)
                } : null);
                setPreviewDeleteAction(null);
                  }} />
                  <div className="text-center text-xs text-white font-medium mt-1">
                    {isSelected ? 'Выбран' : teamFull ? 'Просмотр' : ''}
                  </div>
                 </div>;
          })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Deck Dialog */}
      <Dialog open={showDragonDeck} onOpenChange={open => {
      setShowDragonDeck(open);
      if (!open) setActivePairIndex(null);
    }}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[80vh] bg-black/50 backdrop-blur-md border-2 border-white overflow-hidden flex flex-col rounded-3xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-white">Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
            <Button
              size="sm"
              variant={dragonSortBy === 'defense' ? 'default' : 'outline'}
              onClick={() => {
                console.log('🔘 Dragon sort button clicked, current:', dragonSortBy, '→ setting to: defense');
                setDragonSortBy('defense');
              }}
              className="flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              По броне
              {dragonSortBy === 'defense' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={dragonSortBy === 'rarity' ? 'default' : 'outline'}
              onClick={() => {
                console.log('🔘 Dragon sort button clicked, current:', dragonSortBy, '→ setting to: rarity');
                setDragonSortBy('rarity');
              }}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              По редкости
              {dragonSortBy === 'rarity' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={dragonSortBy === 'none' ? 'default' : 'outline'}
              onClick={() => {
                console.log('🔘 Dragon sort button clicked, current:', dragonSortBy, '→ setting to: none');
                setDragonSortBy('none');
              }}
              className="flex items-center gap-2"
            >
              Сбросить
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center w-full">
            {(activePairIndex !== null ? getAvailableDragons(selectedPairs[activePairIndex]?.hero.faction, selectedPairs[activePairIndex]?.hero.rarity) : dragons).map(dragon => {
            const isSelected = isDragonSelected(dragon);
            const canAssign = activePairIndex !== null ? !!selectedPairs[activePairIndex] && !selectedPairs[activePairIndex]?.dragon && selectedPairs[activePairIndex]?.hero.faction === dragon.faction && (selectedPairs[activePairIndex]?.hero.rarity ?? 0) >= dragon.rarity && !isSelected : false;
            return <div key={dragon.id} className={`cursor-pointer transition-all ${activePairIndex !== null ? !canAssign ? 'opacity-50 pointer-events-none' : 'hover:scale-105' : 'hover:scale-105'}`} onClick={() => canAssign && handleDragonSelect(dragon)}>
                  <CardDisplay card={dragon} showSellButton={false} onClick={e => {
                e.stopPropagation();
                setPreviewCard(dragon);
                const canAssignHere = activePairIndex !== null && !!selectedPairs[activePairIndex] && !selectedPairs[activePairIndex]?.dragon && selectedPairs[activePairIndex]?.hero.faction === dragon.faction && (selectedPairs[activePairIndex]?.hero.rarity ?? 0) >= dragon.rarity && !isSelected;
                setPreviewAction(canAssignHere ? {
                  label: 'Назначить дракона',
                  action: () => handleDragonSelect(dragon)
                } : null);
                setPreviewDeleteAction(null);
              }} />
                  <div className="text-center text-xs text-white font-medium mt-1">
                    {isSelected ? 'Выбран' : activePairIndex !== null ? selectedPairs[activePairIndex]?.hero.faction : 'Просмотр'}
                  </div>
                </div>;
          })}
             {activePairIndex !== null && getAvailableDragons(selectedPairs[activePairIndex]?.hero.faction, selectedPairs[activePairIndex]?.hero.rarity).length === 0 && <div className="col-span-full text-center text-white/60 text-sm">
                 Нет доступных драконов для выбранного героя
               </div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Preview Modal */}
      {/* NFT Transfer Warning Modal */}
      <NFTTransferModal />

      <CardPreviewModal card={previewCard} open={!!previewCard} onClose={() => {
      setPreviewCard(null);
      setPreviewAction(null);
      setPreviewDeleteAction(null);
    }} actionLabel={previewAction?.label} onAction={previewAction ? () => {
      previewAction.action();
      setPreviewCard(null);
      setPreviewAction(null);
      setPreviewDeleteAction(null);
    } : undefined} deleteLabel={previewDeleteAction?.label} onDelete={previewDeleteAction ? () => {
      previewDeleteAction.action();
      setPreviewCard(null);
      setPreviewDeleteAction(null);
      setPreviewAction(null);
    } : undefined} />
    </div>;
};