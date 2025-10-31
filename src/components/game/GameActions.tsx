
interface GameActionsProps {
  onOpenShop: () => void;
  onOpenStats: () => void;
}

export const GameActions = ({ onOpenShop, onOpenStats }: GameActionsProps) => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <button
        onClick={onOpenShop}
        className="group relative bg-game-surface/30 border-2 border-game-accent/50 rounded-lg p-6 text-left transition-all hover:border-game-accent hover:bg-game-surface/50"
      >
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-white mb-2">Колода героев</h3>
          <p className="text-sm text-game-accent/70">Выбор</p>
        </div>
      </button>
      <button
        onClick={onOpenStats}
        className="group relative bg-game-surface/30 border-2 border-game-accent/50 rounded-lg p-6 text-left transition-all hover:border-game-accent hover:bg-game-surface/50"
      >
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-white mb-2">Колода драконов</h3>
          <p className="text-sm text-game-accent/70">Выбор</p>
        </div>
      </button>
    </div>
  );
};