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
  const [editingType, setEditingType] = useState<'hero' | 'dragon' | null>(null);

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
    <div className="min-h-screen" style={{ 
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-family-base)'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-16) 0'
      }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/menu')}
              style={{
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-base)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color var(--duration-fast) var(--ease-standard)',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Назад"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ 
              fontSize: 'var(--font-size-3xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              margin: 0
            }}>
              Управление командой
            </h1>
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)'
          }}>
            Наборочная команда ({selectedTeam.length}/5)
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4" style={{ padding: 'var(--space-24) var(--space-16)' }}>
        {/* Team Grid */}
        <section style={{ marginBottom: 'var(--space-32)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, index) => {
              const pair = selectedTeamWithHealth[index] as TeamPair | undefined;
              
              return (
                <div 
                  key={index} 
                  style={{
                    border: '1px solid var(--color-card-border)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface)',
                    padding: 'var(--space-12)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-12)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    <span>Пара {index + 1}</span>
                    {pair && (
                      <button
                        onClick={() => removeFromSlot(index)}
                        style={{
                          padding: 'var(--space-4)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-error)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'background-color var(--duration-fast) var(--ease-standard)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--color-error-rgb), 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
                    {/* Hero Section */}
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)', 
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--space-4)'
                      }}>
                        Герой
                      </div>
                      {pair?.hero ? (
                        <div>
                          <CardDisplay 
                            card={pair.hero} 
                            showSellButton={false}
                            className="w-full"
                          />
                          <div style={{ 
                            marginTop: 'var(--space-6)',
                            fontSize: 'var(--font-size-xs)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <Heart size={10} style={{ color: 'var(--color-error)' }} />
                              <span>Здоровье</span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              {pair.hero.currentHealth ?? pair.hero.health}/{pair.hero.health}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <Sword size={10} style={{ color: 'var(--color-warning)' }} />
                              <span>Атака</span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              {pair.hero.power}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <Shield size={10} style={{ color: 'var(--color-primary)' }} />
                              <span>Защита</span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              {pair.hero.defense}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSlot(index);
                            setEditingType('hero');
                            setShowHeroDialog(true);
                          }}
                          style={{
                            width: '100%',
                            height: '140px',
                            border: '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-base)',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                            transition: 'all var(--duration-fast) var(--ease-standard)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          + Герой
                        </button>
                      )}
                    </div>

                    {/* Dragon Section */}
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)', 
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--space-4)'
                      }}>
                        Дракон
                      </div>
                      {pair?.dragon ? (
                        <div>
                          <CardDisplay 
                            card={pair.dragon} 
                            showSellButton={false}
                            className="w-full"
                          />
                          <div style={{ 
                            marginTop: 'var(--space-6)',
                            fontSize: 'var(--font-size-xs)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <Heart size={10} style={{ color: 'var(--color-error)' }} />
                              <span>Здоровье</span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              {pair.dragon.currentHealth ?? pair.dragon.health}/{pair.dragon.health}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <Sword size={10} style={{ color: 'var(--color-warning)' }} />
                              <span>Атака</span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              {pair.dragon.power}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <Shield size={10} style={{ color: 'var(--color-primary)' }} />
                              <span>Защита</span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              {pair.dragon.defense}
                            </div>
                          </div>
                        </div>
                      ) : pair?.hero ? (
                        <button
                          onClick={() => {
                            setEditingSlot(index);
                            setEditingType('dragon');
                            setShowDragonDialog(true);
                          }}
                          style={{
                            width: '100%',
                            height: '140px',
                            border: '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-base)',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                            transition: 'all var(--duration-fast) var(--ease-standard)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          + Дракон
                        </button>
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '140px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-base)',
                          backgroundColor: 'var(--color-background)',
                          opacity: 0.3
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <section style={{ marginBottom: 'var(--space-32)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => {
                setEditingSlot(null);
                setEditingType('hero');
                setShowHeroDialog(true);
              }}
              style={{
                backgroundColor: 'rgba(var(--color-teal-500-rgb), 0.08)',
                border: '2px solid rgba(var(--color-teal-500-rgb), 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-24)',
                cursor: 'pointer',
                transition: 'all var(--duration-normal) var(--ease-standard)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(var(--color-teal-500-rgb), 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(var(--color-teal-500-rgb), 0.3)';
                e.currentTarget.style.backgroundColor = 'rgba(var(--color-teal-500-rgb), 0.08)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center' 
              }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--space-8)',
                  color: 'var(--color-text)'
                }}>
                  Колода героев
                </h3>
                <p style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--color-text-secondary)' 
                }}>
                  Выбор
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                setEditingSlot(null);
                setEditingType('dragon');
                setShowDragonDialog(true);
              }}
              style={{
                backgroundColor: 'rgba(var(--color-teal-500-rgb), 0.08)',
                border: '2px solid rgba(var(--color-teal-500-rgb), 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-24)',
                cursor: 'pointer',
                transition: 'all var(--duration-normal) var(--ease-standard)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(var(--color-teal-500-rgb), 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(var(--color-teal-500-rgb), 0.3)';
                e.currentTarget.style.backgroundColor = 'rgba(var(--color-teal-500-rgb), 0.08)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center' 
              }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--space-8)',
                  color: 'var(--color-text)'
                }}>
                  Колода драконов
                </h3>
                <p style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--color-text-secondary)' 
                }}>
                  Выбор
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Team Statistics */}
        <section className="max-w-4xl mx-auto">
          <div style={{
            border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--space-24)'
          }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-16)'
            }}>
              Статистика команды
            </h2>
            <div className="grid grid-cols-3 gap-8">
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'var(--font-size-4xl)', 
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-4)'
                }}>
                  {teamStats.power}
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--color-text-secondary)' 
                }}>
                  Сила
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'var(--font-size-4xl)', 
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-4)'
                }}>
                  {teamStats.defense}
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--color-text-secondary)' 
                }}>
                  Защита
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'var(--font-size-4xl)', 
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-4)'
                }}>
                  {teamStats.health}
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--color-text-secondary)' 
                }}>
                  Здоровье
                </div>
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