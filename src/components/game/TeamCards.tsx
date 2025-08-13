import { DeckSelection } from "./team/DeckSelection";
import { useTeamSelection } from "@/hooks/team/useTeamSelection";

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
    <div className="space-y-6">
      {/* Team Selection Interface */}
      <DeckSelection
        cards={cards}
        selectedPairs={selectedPairs}
        onPairSelect={handlePairSelect}
        onPairRemove={handlePairRemove}
        onPairAssignDragon={handleAssignDragon}
        onPairRemoveDragon={handleRemoveDragon}
      />
      
      {/* Selected Team Stats */}
      {selectedPairs.length > 0 && (
        <div className="bg-game-surface/50 p-4 rounded-lg border border-game-accent">
          <h3 className="text-lg font-bold text-game-accent mb-3">Статистика команды</h3>
          <div className="grid grid-cols-3 gap-4">
            {(() => {
              const stats = getSelectedTeamStats();
              return (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.power}</div>
                    <div className="text-sm text-game-accent">Сила</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.defense}</div>
                    <div className="text-sm text-game-accent">Защита</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.health}</div>
                    <div className="text-sm text-game-accent">Здоровье</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};