import { DeckSelection } from "./team/DeckSelection";
import { useTeamSelection } from "@/hooks/team/useTeamSelection";

// SEO: Team management page
if (typeof document !== 'undefined') {
  document.title = "Команда — колоды героев и драконов";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'Управляйте командой: выбирайте героев и драконов, улучшайте состав и смотрите статистику.');
}

export const TeamCards = () => {
  const {
    cards,
    selectedPairs,
    handlePairSelect,
    handlePairRemove,
    handleAssignDragon,
    handleRemoveDragon,
    getSelectedTeamStats
  } = useTeamSelection();

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4 min-h-0">
      {/* Team Selection Interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DeckSelection
          cards={cards}
          selectedPairs={selectedPairs}
          onPairSelect={handlePairSelect}
          onPairRemove={handlePairRemove}
          onPairAssignDragon={handleAssignDragon}
          onPairRemoveDragon={handleRemoveDragon}
        />
      </div>
      
      {/* Selected Team Stats */}
      {selectedPairs.length > 0 && (
        <section className="bg-game-surface/50 p-2 sm:p-3 rounded-lg border border-game-accent flex-shrink-0" aria-label="Статистика команды">
          <h1 className="text-sm sm:text-base font-bold text-game-accent mb-2">Статистика команды</h1>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(() => {
              const stats = getSelectedTeamStats();
              return (
                <>
                  <article className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-400">{stats.power}</div>
                    <div className="text-xs sm:text-sm text-game-accent">Сила</div>
                  </article>
                  <article className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.defense}</div>
                    <div className="text-xs sm:text-sm text-game-accent">Защита</div>
                  </article>
                  <article className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-green-400">{stats.health}</div>
                    <div className="text-xs sm:text-sm text-game-accent">Здоровье</div>
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