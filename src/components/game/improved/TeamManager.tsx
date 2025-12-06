import { useState, useEffect } from 'react';
import { Card as CardType } from '@/types/cards';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardDisplay } from '@/components/game/CardDisplay';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, X } from 'lucide-react';
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';

interface TeamPair {
  hero: CardType;
  dragon?: CardType;
}

export const TeamManager = () => {
  const { selectedTeam, setSelectedTeam } = useGameStore();
  const { cardsWithHealth, selectedTeamWithHealth } = useCardsWithHealth();
  const [showHeroSelection, setShowHeroSelection] = useState(false);
  const [showDragonSelection, setShowDragonSelection] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const heroes = cardsWithHealth.filter(card => card.type === 'character' && !(card as any).isInMedicalBay);
  const dragons = cardsWithHealth.filter(card => card.type === 'pet' && !(card as any).isInMedicalBay);
  const getTeamStatsWithHealth = (team: TeamPair[]) => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    team.forEach((pair: any) => {
      if (pair.hero) {
        totalPower += pair.hero.power;
        totalDefense += pair.hero.defense;
        totalHealth += pair.hero.currentHealth ?? pair.hero.health;
      }
      if (pair.dragon && pair.dragon.faction === pair.hero?.faction) {
        totalPower += pair.dragon.power;
        totalDefense += pair.dragon.defense;
        totalHealth += pair.dragon.currentHealth ?? pair.dragon.health;
      }
    });

    return {
      power: totalPower,
      defense: totalDefense,
      health: totalHealth,
      maxHealth: totalHealth
    };
  };
  
  const teamStats = getTeamStatsWithHealth(selectedTeamWithHealth);

  const isHeroInTeam = (heroId: string) => {
    return selectedTeam.some((pair: TeamPair) => pair.hero?.id === heroId);
  };

  const isDragonInTeam = (dragonId: string) => {
    return selectedTeam.some((pair: TeamPair) => pair.dragon?.id === dragonId);
  };

  const addHeroToTeam = (hero: CardType) => {
    if (selectedTeam.length >= 5) return;
    
    const newTeam = [...selectedTeam, { hero }];
    setSelectedTeam(newTeam);
    setShowHeroSelection(false);
  };

  const addDragonToSlot = (dragon: CardType, slotIndex: number) => {
    const newTeam = selectedTeam.map((pair: TeamPair, index) => {
      if (index === slotIndex) {
        return { ...pair, dragon };
      }
      return pair;
    });
    setSelectedTeam(newTeam);
    setShowDragonSelection(false);
    setEditingSlot(null);
  };

  const removeFromTeam = (slotIndex: number) => {
    const newTeam = selectedTeam.filter((_, index) => index !== slotIndex);
    setSelectedTeam(newTeam);
  };

  const getAvailableDragons = (heroFaction?: string) => {
    if (!heroFaction) return [];
    return dragons.filter(dragon => 
      dragon.faction === heroFaction && !isDragonInTeam(dragon.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="bg-game-surface/50 p-4 rounded-lg border border-game-accent">
        <h3 className="text-lg font-bold text-game-accent mb-3">Статистика команды</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{teamStats.power}</div>
            <div className="text-sm text-game-accent">Сила</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{teamStats.defense}</div>
            <div className="text-sm text-game-accent">Защита</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{teamStats.health}</div>
            <div className="text-sm text-game-accent">Здоровье</div>
          </div>
        </div>
      </div>

      {/* Team Slots */}
      <div className="bg-game-surface/50 p-4 rounded-lg border border-game-accent">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-game-accent">
            Команда ({selectedTeam.length}/5)
          </h3>
          {selectedTeam.length < 5 && (
            <Button
              onClick={() => setShowHeroSelection(true)}
              className="bg-game-accent hover:bg-game-accent/80"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить героя
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, index) => {
            const pair = selectedTeamWithHealth[index] as TeamPair | undefined;
            
            return (
              <div key={index} className="border border-game-accent/30 rounded-lg p-3 min-h-[200px]">
                {pair ? (
                  <div className="space-y-2">
                    <div className="text-sm text-game-accent font-medium">Слот {index + 1}</div>
                    
                    {/* Hero */}
                    <div className="space-y-1">
                      <div className="text-xs text-game-accent/70">Герой</div>
                      <CardDisplay 
                        card={pair.hero} 
                        showSellButton={false} 
                        className="w-full max-w-[120px] mx-auto"
                      />
                    </div>

                    {/* Dragon */}
                    <div className="space-y-1">
                      <div className="text-xs text-game-accent/70">Дракон</div>
                      {pair.dragon ? (
                        <CardDisplay 
                          card={pair.dragon} 
                          showSellButton={false} 
                          className="w-full max-w-[120px] mx-auto"
                        />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-16 border-dashed"
                          onClick={() => {
                            setEditingSlot(index);
                            setShowDragonSelection(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => removeFromTeam(index)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-game-accent/50 text-sm">
                    Пустой слот
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Selection Dialog */}
      <Dialog open={showHeroSelection} onOpenChange={setShowHeroSelection}>
        <DialogContent className="max-w-4xl h-[80vh] bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-game-accent flex items-center gap-2">
              <Users className="w-5 h-5" />
              Выберите героя
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto p-4">
            {heroes.map(hero => (
              <div
                key={hero.id}
                className={`cursor-pointer transition-all ${
                  isHeroInTeam(hero.id) 
                    ? 'opacity-50 pointer-events-none' 
                    : 'hover:scale-105'
                }`}
                onClick={() => !isHeroInTeam(hero.id) && addHeroToTeam(hero)}
              >
                <CardDisplay card={hero} showSellButton={false} />
                {isHeroInTeam(hero.id) && (
                  <Badge className="w-full mt-1 bg-gray-500">Выбран</Badge>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Selection Dialog */}
      <Dialog open={showDragonSelection} onOpenChange={setShowDragonSelection}>
        <DialogContent className="max-w-4xl h-[80vh] bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-game-accent">Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto p-4">
            {editingSlot !== null && 
              getAvailableDragons(selectedTeamWithHealth[editingSlot]?.hero?.faction).map(dragon => (
                <div
                  key={dragon.id}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => addDragonToSlot(dragon, editingSlot)}
                >
                  <CardDisplay card={dragon} showSellButton={false} />
                </div>
              ))
            }
            {editingSlot !== null && 
              getAvailableDragons(selectedTeamWithHealth[editingSlot]?.hero?.faction).length === 0 && (
                <div className="col-span-full text-center text-game-accent/60 text-sm">
                  Нет доступных драконов для выбранного героя
                </div>
              )
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};