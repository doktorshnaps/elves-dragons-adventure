import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EquipmentTab } from "../equipment/EquipmentTab";

interface EquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EquipmentDialog = ({ isOpen, onClose }: EquipmentDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-game-surface border-game-accent max-w-[95vw] max-h-[95vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Снаряжение</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 p-4">
          <EquipmentTab />
        </div>
      </DialogContent>
    </Dialog>
  );
};