import { DeckSelection } from "./team/DeckSelection";
import { useTeamSelection } from "@/hooks/team/useTeamSelection";
import { ActiveBattleWarning } from "./team/ActiveBattleWarning";
import { useCardStatsMigration } from "@/hooks/useCardStatsMigration";

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

  // Автоматическая миграция характеристик карт
  useCardStatsMigration();

  return (
    <div className="flex flex-col space-y-3">
      {/* Active Battle Warning */}
      <ActiveBattleWarning />
      
      {/* Team Selection Interface */}
      <div className="w-full">
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
        <section 
          className="bg-gradient-to-br from-game-surface/90 via-game-surface/70 to-game-surface/90 backdrop-blur-sm p-2 sm:p-4 rounded-xl border-2 border-game-primary/40 shadow-[0_0_20px_rgba(155,135,245,0.15)]" 
          aria-label="Статистика команды"
        >
          <h1 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-game-primary via-game-accent to-game-primary bg-clip-text text-transparent mb-2 sm:mb-3 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
            Статистика команды
          </h1>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {(() => {
              const stats = getSelectedTeamStats();
              return (
                <>
                  <article className="text-center p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-400/20">
                    <div className="text-base sm:text-2xl font-bold text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]">{stats.power}</div>
                    <div className="text-xs sm:text-sm text-game-primary">Сила</div>
                  </article>
                  <article className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-400/20">
                    <div className="text-base sm:text-2xl font-bold text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]">{stats.defense}</div>
                    <div className="text-xs sm:text-sm text-game-primary">Защита</div>
                  </article>
                  <article className="text-center p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-400/20">
                    <div className="text-base sm:text-2xl font-bold text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]">{stats.health}</div>
                    <div className="text-xs sm:text-sm text-game-primary">Здоровье</div>
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