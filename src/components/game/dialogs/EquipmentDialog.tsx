import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EquipmentTab } from "../equipment/EquipmentTab";

interface EquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EquipmentDialog = ({ isOpen, onClose }: EquipmentDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Снаряжение</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="p-4">
            <EquipmentTab />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};