import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { Card as CardType } from '@/types/cards';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardDisplay } from '@/components/game/CardDisplay';
import './TeamManagement.css';

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
    <div className="team-management-page">
      {/* Header */}
      <header className="team-header">
        <div className="container-fluid">
          <div className="header-content">
            <button
              onClick={() => navigate('/menu')}
              className="btn-back"
              aria-label="Назад"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="header-info">
              <h1 className="page-title">Управление командой</h1>
              <div className="team-count">
                Наборочная команда ({selectedTeam.length}/5)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid">
        <div className="main-content">
          {/* Pairs Section */}
          <section className="pairs-section">
            <div className="section-header">
              <h2 className="section-title">⚔️ Управление Парами Герой+Дракон</h2>
              <div className="pair-actions">
                <button 
                  className="btn btn--primary"
                  onClick={() => {
                    if (selectedTeam.length >= 5) {
                      alert('Максимум 5 пар в команде!');
                      return;
                    }
                    setEditingSlot(selectedTeam.length);
                    setShowHeroDialog(true);
                  }}
                >
                  ➕ Добавить Пару
                </button>
                <button 
                  className="btn btn--outline"
                  onClick={() => {
                    if (confirm('Сбросить все пары?')) {
                      setSelectedTeam([]);
                    }
                  }}
                >
                  🔄 Сбросить Всё
                </button>
              </div>
            </div>

            <div className="pairs-container">
              {selectedTeam.length === 0 ? (
                <div className="empty-pairs">
                  <h3>Команда пар пуста</h3>
                  <p>Добавьте пары герой+дракон для битвы</p>
                </div>
              ) : (
                selectedTeamWithHealth.map((pair: any, index: number) => (
                  <div key={index} className="pair-card">
                    <div className="pair-header">
                      <div className="pair-title">⚔️ Пара {index + 1}</div>
                      <button
                        className="pair-remove-btn"
                        onClick={() => removeFromSlot(index)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="pair-units">
                      {/* Hero */}
                      <div className="unit-in-pair">
                        <div className="unit-type-header">👤 Герой</div>
                        {pair.hero ? (
                          <>
                            <div className="unit-card-display">
                              <CardDisplay 
                                card={pair.hero} 
                                showSellButton={false}
                              />
                            </div>
                            <div className="unit-stats-grid">
                              <div className="unit-stat-item">
                                <span className="unit-stat-value">{pair.hero.currentHealth ?? pair.hero.health}</span>
                                <span className="unit-stat-label">❤️ HP</span>
                              </div>
                              <div className="unit-stat-item">
                                <span className="unit-stat-value">{pair.hero.defense}</span>
                                <span className="unit-stat-label">🛡️ Armor</span>
                              </div>
                              <div className="unit-stat-item">
                                <span className="unit-stat-value">{pair.hero.power}</span>
                                <span className="unit-stat-label">⚔️ ATK</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <button
                            className="btn-add-unit"
                            onClick={() => {
                              setEditingSlot(index);
                              setShowHeroDialog(true);
                            }}
                          >
                            + Добавить героя
                          </button>
                        )}
                      </div>

                      {/* Dragon */}
                      <div className="unit-in-pair">
                        <div className="unit-type-header">🐉 Дракон</div>
                        {pair.dragon ? (
                          <>
                            <div className="unit-card-display">
                              <CardDisplay 
                                card={pair.dragon} 
                                showSellButton={false}
                              />
                            </div>
                            <div className="unit-stats-grid">
                              <div className="unit-stat-item">
                                <span className="unit-stat-value">{pair.dragon.currentHealth ?? pair.dragon.health}</span>
                                <span className="unit-stat-label">❤️ HP</span>
                              </div>
                              <div className="unit-stat-item">
                                <span className="unit-stat-value">{pair.dragon.defense}</span>
                                <span className="unit-stat-label">🛡️ Armor</span>
                              </div>
                              <div className="unit-stat-item">
                                <span className="unit-stat-value">{pair.dragon.power}</span>
                                <span className="unit-stat-label">⚔️ ATK</span>
                              </div>
                            </div>
                          </>
                        ) : pair.hero ? (
                          <button
                            className="btn-add-unit"
                            onClick={() => {
                              setEditingSlot(index);
                              setShowDragonDialog(true);
                            }}
                          >
                            + Добавить дракона
                          </button>
                        ) : (
                          <div className="unit-placeholder">Сначала выберите героя</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Team Summary */}
            {selectedTeam.length > 0 && (
              <div className="team-summary">
                <div className="summary-stats">
                  <div className="summary-row">
                    <div className="summary-stat">
                      <span className="stat-label">Общие Характеристики Команды:</span>
                      <div className="stat-group">
                        <span className="stat-item">❤️ <span id="total-team-hp">{teamStats.health}</span></span>
                        <span className="stat-item">🛡️ <span id="total-team-armor">{teamStats.defense}</span></span>
                        <span className="stat-item">⚔️ <span id="total-team-attack">{teamStats.power}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <section className="deck-buttons-section">
            <button
              className="deck-button"
              onClick={() => {
                setEditingSlot(null);
                setShowHeroDialog(true);
              }}
            >
              <div className="deck-button-content">
                <h3 className="deck-button-title">Колода героев</h3>
                <p className="deck-button-subtitle">Выбор</p>
              </div>
            </button>
            <button
              className="deck-button"
              onClick={() => {
                setEditingSlot(null);
                setShowDragonDialog(true);
              }}
            >
              <div className="deck-button-content">
                <h3 className="deck-button-title">Колода драконов</h3>
                <p className="deck-button-subtitle">Выбор</p>
              </div>
            </button>
          </section>
        </div>
      </main>

      {/* Hero Selection Dialog */}
      <Dialog open={showHeroDialog} onOpenChange={setShowHeroDialog}>
        <DialogContent className="selection-dialog">
          <DialogHeader>
            <DialogTitle>Выберите героя</DialogTitle>
          </DialogHeader>
          <div className="cards-grid">
            {heroes.map(hero => (
              <div
                key={hero.id}
                className={`card-item ${isHeroInTeam(hero.id) ? 'disabled' : ''}`}
                onClick={() => !isHeroInTeam(hero.id) && addHeroToSlot(hero, editingSlot ?? selectedTeam.length)}
              >
                <CardDisplay card={hero} showSellButton={false} />
                {isHeroInTeam(hero.id) && <div className="card-badge">Выбран</div>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Selection Dialog */}
      <Dialog open={showDragonDialog} onOpenChange={setShowDragonDialog}>
        <DialogContent className="selection-dialog">
          <DialogHeader>
            <DialogTitle>Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="cards-grid">
            {editingSlot !== null && selectedTeamWithHealth[editingSlot]?.hero ? (
              getAvailableDragons(selectedTeamWithHealth[editingSlot]?.hero?.faction).length > 0 ? (
                getAvailableDragons(selectedTeamWithHealth[editingSlot]?.hero?.faction).map(dragon => (
                  <div
                    key={dragon.id}
                    className="card-item"
                    onClick={() => addDragonToSlot(dragon, editingSlot)}
                  >
                    <CardDisplay card={dragon} showSellButton={false} />
                  </div>
                ))
              ) : (
                <div className="empty-message">
                  Нет доступных драконов для выбранного героя
                </div>
              )
            ) : editingSlot === null ? (
              dragons.filter(d => !isDragonInTeam(d.id)).map(dragon => (
                <div
                  key={dragon.id}
                  className="card-item"
                  onClick={() => {
                    alert('Сначала выберите пару, к которой хотите добавить дракона');
                  }}
                >
                  <CardDisplay card={dragon} showSellButton={false} />
                </div>
              ))
            ) : (
              <div className="empty-message">
                Сначала выберите героя для этой пары
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};