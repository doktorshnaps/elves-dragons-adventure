import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";
import { PlayerStatsSection } from "./stats/PlayerStatsSection";

interface TeamStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamStats: TeamStatsType;
  balance: number;
}

export const TeamStatsModal = ({ isOpen, onClose, teamStats, balance }: TeamStatsModalProps) => {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            onClose();
          }, 0);
        }
      }}
    >
      <DialogContent 
        className="bg-game-surface border-game-accent max-w-md w-full fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 max-h-[90vh]"
        style={{
          backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm rounded-lg" />
        
        <ScrollArea className="relative z-10 max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Статистика команды</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Просмотр характеристик вашей команды
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4 p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-extrabold text-game-accent">{balance} монет</span>
            </div>
            
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-game-accent mb-4">Характеристики команды</h3>
                <HealthBar health={teamStats.health} maxHealth={teamStats.health} />
                <CombatStats power={teamStats.power} defense={teamStats.defense} />
              </div>

              <PlayerStatsSection 
                playerStats={{
                  health: teamStats.health,
                  maxHealth: teamStats.health,
                  power: teamStats.power,
                  defense: teamStats.defense,
                  experience: 0,
                  level: 1,
                  requiredExperience: 100
                }} 
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};