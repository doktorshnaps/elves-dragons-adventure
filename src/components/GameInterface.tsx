import { useState, useEffect } from "react";
import { useBalanceState } from "@/hooks/useBalanceState";
import { calculateTeamStats } from "@/utils/cardUtils";
import { GameButtons } from "./game/GameButtons";
import { GameModeDialog } from "./game/dialogs/GameModeDialog";
import { EquipmentDialog } from "./game/dialogs/EquipmentDialog";
import { TeamDialog } from "./game/dialogs/TeamDialog";
import { Shop } from "./Shop";
import { DungeonSearch } from "./DungeonSearch";
import { TeamStatsModal } from "./game/TeamStatsModal";

export const GameInterface = () => {
  const [showShop, setShowShop] = useState(false);
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showGameModeDialog, setShowGameModeDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [hasCards, setHasCards] = useState(false);
  const { balance, updateBalance } = useBalanceState();

  useEffect(() => {
    const checkCards = () => {
      const savedCards = localStorage.getItem('gameCards');
      const cards = savedCards ? JSON.parse(savedCards) : [];
      setHasCards(cards.length > 0);
    };

    checkCards();
    window.addEventListener('cardsUpdate', checkCards);
    return () => window.removeEventListener('cardsUpdate', checkCards);
  }, []);

  const getTeamStats = () => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    return calculateTeamStats(cards);
  };

  return (
    <div className="min-h-screen p-1 sm:p-4 relative">
      <GameButtons
        onGameModeClick={() => setShowGameModeDialog(true)}
        onShopClick={() => setShowShop(true)}
        onStatsClick={() => setShowStats(true)}
        onEquipmentClick={() => setShowEquipment(true)}
        onTeamClick={() => setShowTeam(true)}
      />

      <GameModeDialog
        isOpen={showGameModeDialog}
        onClose={() => setShowGameModeDialog(false)}
        onDungeonSearch={() => setShowDungeonSearch(true)}
      />

      <EquipmentDialog
        isOpen={showEquipment}
        onClose={() => setShowEquipment(false)}
      />

      <TeamDialog
        isOpen={showTeam}
        onClose={() => setShowTeam(false)}
      />

      {showShop && (
        <Shop
          onClose={() => setShowShop(false)}
          balance={balance}
          onBalanceChange={updateBalance}
        />
      )}

      <TeamStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        teamStats={getTeamStats()}
        balance={balance}
      />

      {showDungeonSearch && (
        <DungeonSearch
          onClose={() => setShowDungeonSearch(false)}
          balance={balance}
          onBalanceChange={updateBalance}
        />
      )}
    </div>
  );
};