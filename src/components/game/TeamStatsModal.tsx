import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="bg-game-surface border-game-accent max-w-md w-full"
        style={{
          backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm rounded-lg" />
        
        <div className="relative z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Статистика команды</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Просмотр характеристик вашей команды
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-extrabold text-game-accent">{balance} монет</span>
            </div>
            
            <div className="space-y-4">
              <HealthBar health={teamStats.health} maxHealth={teamStats.health} />
              <CombatStats power={teamStats.power} defense={teamStats.defense} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};