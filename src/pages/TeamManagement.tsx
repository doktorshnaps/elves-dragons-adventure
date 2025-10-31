import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Shield, Sword, Heart } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { Card as CardType } from '@/types/cards';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardDisplay } from '@/components/game/CardDisplay';

interface TeamPair {
  hero: CardType;
  dragon?: CardType;
}

export const TeamManagement = () => {
  const navigate = useNavigate();
  const { selectedTeam, setSelectedTeam } = useGameStore();
  const { cardsWithHealth, selectedTeamWithHealth } = useCardsWithHealth();
  const [showHeroDialog, setShowHeroDialog] = useState(false);
  const [showDragonDialog, setShowDragonDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const heroes = cardsWithHealth.filter(card => card.type === 'character' && !(card as any).isInMedicalBay);
  const dragons = cardsWithHealth.filter(card => card.type === 'pet' && !(card as any).isInMedicalBay);

  const getTeamStats = () => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    selectedTeamWithHealth.forEach((pair: any) => {
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

    return { power: totalPower, defense: totalDefense, health: totalHealth };
  };

  const teamStats = getTeamStats();

  const isHeroInTeam = (heroId: string) => {
    return selectedTeam.some((pair: TeamPair) => pair.hero?.id === heroId);
  };

  const isDragonInTeam = (dragonId: string) => {
    return selectedTeam.some((pair: TeamPair) => pair.dragon?.id === dragonId);
  };

  const addHeroToSlot = (hero: CardType, slotIndex: number) => {
    const newTeam = [...selectedTeam];
    if (slotIndex >= newTeam.length) {
      newTeam.push({ hero });
    } else {
      newTeam[slotIndex] = { ...newTeam[slotIndex], hero };
    }
    setSelectedTeam(newTeam);
    setShowHeroDialog(false);
    setEditingSlot(null);
  };

  const addDragonToSlot = (dragon: CardType, slotIndex: number) => {
    const newTeam = [...selectedTeam];
    if (newTeam[slotIndex]) {
      newTeam[slotIndex] = { ...newTeam[slotIndex], dragon };
      setSelectedTeam(newTeam);
    }
    setShowDragonDialog(false);
    setEditingSlot(null);
  };

  const removeFromSlot = (slotIndex: number) => {
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
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/menu')}
              className="p-2 hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold">Управление командой</h1>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)]">Наборочная команда:</span>
              <span className="font-medium">{selectedTeam.length}/5</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Team Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, index) => {
              const pair = selectedTeamWithHealth[index] as TeamPair | undefined;
              
              return (
                <div key={index} className="border border-[var(--color-card-border)] rounded-lg bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">Пара {index + 1}</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Hero Section */}
                    <div>
                      <div className="text-xs text-[var(--color-text-secondary)] mb-1">Герой</div>
                      {pair?.hero ? (
                        <div className="relative">
                          <CardDisplay 
                            card={pair.hero} 
                            showSellButton={false}
                            className="w-full"
                          />
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span>Здоровье: {pair.hero.currentHealth ?? pair.hero.health}/{pair.hero.health}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Sword className="w-3 h-3 text-orange-500" />
                              <span>Атака: {pair.hero.power}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-blue-500" />
                              <span>Защита: {pair.hero.defense}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSlot(index);
                            setShowHeroDialog(true);
                          }}
                          className="w-full h-32 border-2 border-dashed border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors flex items-center justify-center text-sm text-[var(--color-text-secondary)]"
                        >
                          + Добавить героя
                        </button>
                      )}
                    </div>

                    {/* Dragon Section */}
                    <div>
                      <div className="text-xs text-[var(--color-text-secondary)] mb-1">Дракон</div>
                      {pair?.dragon ? (
                        <div className="relative">
                          <CardDisplay 
                            card={pair.dragon} 
                            showSellButton={false}
                            className="w-full"
                          />
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span>Здоровье: {pair.dragon.currentHealth ?? pair.dragon.health}/{pair.dragon.health}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Sword className="w-3 h-3 text-orange-500" />
                              <span>Атака: {pair.dragon.power}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-blue-500" />
                              <span>Защита: {pair.dragon.defense}</span>
                            </div>
                          </div>
                        </div>
                      ) : pair?.hero ? (
                        <button
                          onClick={() => {
                            setEditingSlot(index);
                            setShowDragonDialog(true);
                          }}
                          className="w-full h-32 border-2 border-dashed border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors flex items-center justify-center text-sm text-[var(--color-text-secondary)]"
                        >
                          + Добавить дракона
                        </button>
                      ) : (
                        <div className="w-full h-32 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] opacity-50" />
                      )}
                    </div>

                    {/* Remove Button */}
                    {pair && (
                      <button
                        onClick={() => removeFromSlot(index)}
                        className="w-full py-2 px-3 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-hover)] rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => setShowHeroDialog(true)}
              className="group relative bg-[var(--color-surface)] border-2 border-[var(--color-card-border)] rounded-lg p-6 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xl font-bold mb-2">Колода героев</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Выбор</p>
              </div>
            </button>
            <button
              onClick={() => setShowDragonDialog(true)}
              className="group relative bg-[var(--color-surface)] border-2 border-[var(--color-card-border)] rounded-lg p-6 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xl font-bold mb-2">Колода драконов</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Выбор</p>
              </div>
            </button>
          </div>
        </section>

        {/* Team Statistics */}
        <section className="max-w-4xl mx-auto">
          <div className="border border-[var(--color-card-border)] rounded-lg bg-[var(--color-surface)] p-6">
            <h2 className="text-lg font-semibold mb-4">Статистика команды</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-primary)] mb-1">{teamStats.power}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Сила</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-primary)] mb-1">{teamStats.defense}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Защита</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-primary)] mb-1">{teamStats.health}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Здоровье</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Hero Selection Dialog */}
      <Dialog open={showHeroDialog} onOpenChange={setShowHeroDialog}>
        <DialogContent className="max-w-4xl h-[80vh] bg-[var(--color-surface)] border-[var(--color-card-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text)]">Выберите героя</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 overflow-y-auto p-4">
            {heroes.map(hero => (
              <div
                key={hero.id}
                className={`cursor-pointer transition-all ${
                  isHeroInTeam(hero.id) 
                    ? 'opacity-50 pointer-events-none' 
                    : 'hover:scale-105'
                }`}
                onClick={() => !isHeroInTeam(hero.id) && addHeroToSlot(hero, editingSlot ?? selectedTeam.length)}
              >
                <CardDisplay card={hero} showSellButton={false} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Selection Dialog */}
      <Dialog open={showDragonDialog} onOpenChange={setShowDragonDialog}>
        <DialogContent className="max-w-4xl h-[80vh] bg-[var(--color-surface)] border-[var(--color-card-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text)]">Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 overflow-y-auto p-4">
            {editingSlot !== null && selectedTeamWithHealth[editingSlot]?.hero ? (
              getAvailableDragons(selectedTeamWithHealth[editingSlot]?.hero?.faction).length > 0 ? (
                getAvailableDragons(selectedTeamWithHealth[editingSlot]?.hero?.faction).map(dragon => (
                  <div
                    key={dragon.id}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => addDragonToSlot(dragon, editingSlot)}
                  >
                    <CardDisplay card={dragon} showSellButton={false} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-[var(--color-text-secondary)] text-sm">
                  Нет доступных драконов для выбранного героя
                </div>
              )
            ) : (
              <div className="col-span-full text-center text-[var(--color-text-secondary)] text-sm">
                Сначала выберите героя
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};