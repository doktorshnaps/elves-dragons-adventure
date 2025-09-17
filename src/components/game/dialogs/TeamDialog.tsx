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
        className="bg-game-surface border-game-accent max-w-[95vw] max-h-[95vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Ваша команда</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 p-4">
          <TeamCards />
        </div>
      </DialogContent>
    </Dialog>
  );
};