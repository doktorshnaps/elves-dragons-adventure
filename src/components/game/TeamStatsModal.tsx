import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";

interface TeamStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamStats: TeamStatsType;
  balance: number;
}

export const TeamStatsModal = ({ isOpen, onClose, teamStats, balance }: TeamStatsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-accent">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Статистика команды</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-extrabold text-game-accent">{balance} монет</span>
          </div>
          
          <div className="space-y-4">
            <HealthBar health={teamStats.health} maxHealth={teamStats.health} />
            <CombatStats power={teamStats.power} defense={teamStats.defense} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};