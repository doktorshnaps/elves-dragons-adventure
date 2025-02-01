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
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="bg-game-surface border-game-accent fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-h-[90vh] w-[95vw] md:w-[600px] overflow-hidden"
        style={{
          backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Полупрозрачный оверлей для лучшей читаемости */}
        <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
        
        {/* Контент поверх оверлея */}
        <div className="relative z-10 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Статистика команды</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 px-2">
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