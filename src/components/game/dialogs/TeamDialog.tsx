import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamCards } from "../TeamCards";

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamDialog = ({ isOpen, onClose }: TeamDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-4xl h-[90vh]"
        style={{
          touchAction: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Ваша команда</DialogTitle>
        </DialogHeader>
        <div 
          className="h-[calc(90vh-8rem)] overflow-y-auto"
          style={{ 
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            msOverflowStyle: '-ms-autohiding-scrollbar',
            scrollBehavior: 'smooth',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <div className="p-4">
            <TeamCards />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};