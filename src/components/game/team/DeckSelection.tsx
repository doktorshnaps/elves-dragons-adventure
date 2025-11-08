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
  console.log(`🎮 DeckSelection mounted: ${cards.length} cards received, ${selectedPairs.length} pairs selected`);
  console.log(`🎮 Cards breakdown: ${cards.filter(c => c.type === 'character').length} heroes, ${cards.filter(c => c.type === 'pet').length} dragons`);
  console.log(`🎮 NFT cards: ${cards.filter(c => c.isNFT).length} total`);
  
  const [showHeroDeck, setShowHeroDeck] = useState(false);
  const [showDragonDeck, setShowDragonDeck] = useState(false);
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null);
  const [previewCard, setPreviewCard] = useState<CardType | null>(null);
  const [heroSortBy, setHeroSortBy] = useState<'none' | 'power' | 'rarity'>('none');
  const [dragonSortBy, setDragonSortBy] = useState<'none' | 'power' | 'rarity'>('none');
  const [previewAction, setPreviewAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const [previewDeleteAction, setPreviewDeleteAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const [localCards, setLocalCards] = useState<CardType[]>(cards);
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

  // Создаем карты с актуальным здоровьем из card_instances
  const cardsWithHealthSync = useMemo(() => {
    const combinedCards = [...cards, ...nftCards];
    console.log(`🎮 DeckSelection: Total cards = ${cards.length}, NFT cards = ${nftCards.length}`);
    
    // Убираем дубликаты по ID
    const uniqueCards = combinedCards.filter((card, index, arr) => arr.findIndex(c => c.id === card.id) === index);
    console.log(`🎮 After dedup: ${uniqueCards.length} unique cards`);

    // Синхронизируем здоровье с card_instances
    const instancesMap = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    const result = uniqueCards.map(card => {
      const instance = instancesMap.get(card.id);
      if (instance) {
        return {
          ...card,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime()
        };
      }
      return card;
    });
    
    console.log(`🎮 Final cards: ${result.length} total, ${result.filter(c => c.isNFT).length} NFT`);
    console.log(`🎮 NFT breakdown: ${result.filter(c => c.isNFT && c.type === 'character').length} heroes, ${result.filter(c => c.isNFT && c.type === 'pet').length} dragons`);
    
    return result;
  }, [cards, nftCards, cardInstances]);

  // Обновляем локальные карты, исключаем только карты которые действительно в медпункте
  useEffect(() => {
    // НЕ фильтруем карты - показываем все доступные карты
    setLocalCards(cardsWithHealthSync);
    console.log('🎮 Updated local cards with health sync:', cardsWithHealthSync.length, 'total cards');
  }, [cardsWithHealthSync]);
  const heroes = useMemo(() => {
    const filtered = localCards.filter(card => {
      const isHero = card.type === 'character';
      if (card.isNFT) {
        console.log(`🎴 NFT Card filtering: ${card.name} type=${card.type} isHero=${isHero}`);
      }
      return isHero;
    });
    if (heroSortBy === 'power') {
      return [...filtered].sort((a, b) => b.power - a.power);
    }
    if (heroSortBy === 'rarity') {
      return [...filtered].sort((a, b) => b.rarity - a.rarity);
    }
    console.log(`✅ Filtered ${filtered.length} heroes (${filtered.filter(h => h.isNFT).length} NFT)`);
    return filtered;
  }, [localCards, heroSortBy]);

  const dragons = useMemo(() => {
    const filtered = localCards.filter(card => {
      const isDragon = card.type === 'pet';
      if (card.isNFT) {
        console.log(`🐉 NFT Card filtering: ${card.name} type=${card.type} isDragon=${isDragon}`);
      }
      return isDragon;
    });
    if (dragonSortBy === 'power') {
      return [...filtered].sort((a, b) => b.power - a.power);
    }
    if (dragonSortBy === 'rarity') {
      return [...filtered].sort((a, b) => b.rarity - a.rarity);
    }
    console.log(`✅ Filtered ${filtered.length} dragons (${filtered.filter(d => d.isNFT).length} NFT)`);
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
    
    console.log(`🔍 Finding dragons for hero: faction=${heroFaction}, rarity=${heroRarity}`);
    
    const availableDragons = dragons.filter(dragon => {
      const sameFaction = dragon.faction === heroFaction;
      const notSelected = !isDragonSelected(dragon);
      const rarityOk = !heroRarity || (dragon.rarity ?? 1) <= heroRarity;
      
      console.log(`  🐉 Dragon ${dragon.name} (${dragon.id}): faction=${dragon.faction} sameFaction=${sameFaction}, rarity=${dragon.rarity}, rarityOk=${rarityOk}, notSelected=${notSelected}, isNFT=${dragon.isNFT}`);
      
      return sameFaction && rarityOk && notSelected;
    });
    
    console.log(`✅ Found ${availableDragons.length} available dragons`);
    return availableDragons;
  };
  const handleHeroSelect = (hero: CardType) => {
    console.log('🎯 DeckSelection handleHeroSelect called for hero:', hero.name);
    console.log('🎯 selectedPairs.length:', selectedPairs.length);
    console.log('🎯 Is hero already selected in filtered pairs?', selectedPairs.some(pair => pair.hero.id === hero.id));
    
    // Note: We don't check selectedPairs.length here because the real limit check is in handlePairSelect
    console.log('🎯 Calling onPairSelect from DeckSelection');
    onPairSelect(hero);
    setShowHeroDeck(false);
  };
  const handleDragonSelect = (dragon: CardType) => {
    console.log(`🐉 handleDragonSelect called: ${dragon.name} (faction: ${dragon.faction}, rarity: ${dragon.rarity}, isNFT: ${dragon.isNFT})`);
    
    if (activePairIndex !== null) {
      const pair = selectedPairs[activePairIndex];
      if (pair) {
        console.log(`  👤 Selected hero: ${pair.hero.name} (faction: ${pair.hero.faction}, rarity: ${pair.hero.rarity}, isNFT: ${pair.hero.isNFT})`);
        
        if (pair.hero.faction !== dragon.faction) {
          console.log(`  ❌ Faction mismatch: ${pair.hero.faction} !== ${dragon.faction}`);
          toast({
            title: 'Неверная фракция',
            description: 'Дракон должен быть той же фракции, что и герой',
            variant: 'destructive'
          });
        } else if ((pair.hero.rarity ?? 1) < (dragon.rarity ?? 1)) {
          console.log(`  ❌ Rarity check failed: hero rarity ${pair.hero.rarity ?? 1} < dragon rarity ${dragon.rarity ?? 1}`);
          toast({
            title: 'Недостаточный ранг героя',
            description: 'Герой может управлять драконом своего ранга или ниже',
            variant: 'destructive'
          });
        } else {
          console.log(`  ✅ Assigning dragon to hero`);
          onPairAssignDragon(activePairIndex, dragon);
        }
      }
      setActivePairIndex(null);
      setShowDragonDeck(false);
      return;
    }

    // Fallback: assign to any available hero without a dragon of the same faction
    console.log(`  🔄 Fallback: finding hero with same faction without dragon`);
    const heroWithSameFaction = selectedPairs.find(pair => 
      pair.hero.faction === dragon.faction && 
      !pair.dragon && 
      (pair.hero.rarity ?? 1) >= (dragon.rarity ?? 1)
    );
    
    if (heroWithSameFaction) {
      const pairIndex = selectedPairs.findIndex(pair => pair === heroWithSameFaction);
      console.log(`  ✅ Found hero ${heroWithSameFaction.hero.name} at index ${pairIndex}`);
      onPairAssignDragon(pairIndex, dragon);
    } else {
      console.log(`  ❌ No suitable hero found for this dragon`);
    }
    setShowDragonDeck(false);
  };
  return <div className="h-full flex flex-col space-y-3">
      {/* Selected Pairs Display */}
      <section 
        className="bg-black/50 backdrop-blur-sm p-2 sm:p-4 rounded-3xl border-2 border-white flex-shrink-0" 
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        aria-label="Выбранная команда"
      >
        <h1 className="text-sm sm:text-lg font-bold text-white mb-2 sm:mb-4">
          Выбранная команда ({selectedPairs.length}/5)
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {Array.from({
          length: 5
        }, (_, index) => {
          const pair = selectedPairs[index];
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
                  </div> : <div className="h-full flex items-center justify-center text-white/40 text-xs sm:text-sm">
                    Пустой слот
                  </div>}
              </div>;
        })}
        </div>
      </section>

      {/* Deck Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0">
        <Button 
          onClick={() => setShowHeroDeck(true)} 
          className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-1 bg-white text-black backdrop-blur-sm border-2 border-white hover:bg-white/90 transition-all duration-300 group rounded-3xl"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="text-xs sm:text-sm font-bold text-black transition-colors">Колода героев</div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs bg-black/20 text-black border-black/30">{heroes.length} карт</Badge>
        </Button>

        <Button 
          onClick={() => {
            setActivePairIndex(null);
            setShowDragonDeck(true);
          }} 
          className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-1 bg-white text-black backdrop-blur-sm border-2 border-white hover:bg-white/90 transition-all duration-300 group rounded-3xl"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="text-xs sm:text-sm font-bold text-black transition-colors">Колода драконов</div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs bg-black/20 text-black border-black/30">{dragons.length} карт</Badge>
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
              variant={heroSortBy === 'power' ? 'default' : 'outline'}
              onClick={() => setHeroSortBy(heroSortBy === 'power' ? 'none' : 'power')}
              className="flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              По силе
              {heroSortBy === 'power' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={heroSortBy === 'rarity' ? 'default' : 'outline'}
              onClick={() => setHeroSortBy(heroSortBy === 'rarity' ? 'none' : 'rarity')}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              По редкости
              {heroSortBy === 'rarity' && <ArrowUpDown className="w-3 h-3" />}
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
              variant={dragonSortBy === 'power' ? 'default' : 'outline'}
              onClick={() => setDragonSortBy(dragonSortBy === 'power' ? 'none' : 'power')}
              className="flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              По силе
              {dragonSortBy === 'power' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={dragonSortBy === 'rarity' ? 'default' : 'outline'}
              onClick={() => setDragonSortBy(dragonSortBy === 'rarity' ? 'none' : 'rarity')}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              По редкости
              {dragonSortBy === 'rarity' && <ArrowUpDown className="w-3 h-3" />}
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