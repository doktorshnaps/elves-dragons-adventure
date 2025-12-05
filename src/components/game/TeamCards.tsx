import { DeckSelection } from "./team/DeckSelection";
import { useTeamSelection } from "@/hooks/team/useTeamSelection";
import { ActiveBattleWarning } from "./team/ActiveBattleWarning";

// SEO: Team management page
if (typeof document !== 'undefined') {
  document.title = "Команда — колоды героев и драконов";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'Управляйте командой: выбирайте героев и драконов, улучшайте состав и смотрите статистику.');
}

export const TeamCards = () => {
  const {
    cardsWithHealth: cards,
    selectedPairs,
    handlePairSelect,
    handlePairRemove,
    handleAssignDragon,
    handleRemoveDragon,
    getSelectedTeamStats
  } = useTeamSelection();

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
          className="bg-black/50 backdrop-blur-sm p-2 sm:p-3 rounded-3xl border-2 border-white" 
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          aria-label="Статистика команды"
        >
          <h1 className="text-sm sm:text-lg font-bold text-white mb-2 sm:mb-3">
            Статистика команды
          </h1>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(() => {
              const stats = getSelectedTeamStats();
              return (
                <>
                  <article className="text-center p-2 sm:p-3 rounded-2xl bg-black/40 border-2 border-white/30 hover:border-white/50 transition-all">
                    <div className="text-lg sm:text-2xl font-bold text-red-400">{stats.power}</div>
                    <div className="text-xs sm:text-sm text-white/80">Сила</div>
                  </article>
                  <article className="text-center p-2 sm:p-3 rounded-2xl bg-black/40 border-2 border-white/30 hover:border-white/50 transition-all">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">{stats.defense}</div>
                    <div className="text-xs sm:text-sm text-white/80">Защита</div>
                  </article>
                  <article className="text-center p-2 sm:p-3 rounded-2xl bg-black/40 border-2 border-white/30 hover:border-white/50 transition-all">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{stats.health}</div>
                    <div className="text-xs sm:text-sm text-white/80">Здоровье</div>
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