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
        className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-4xl h-[90vh]"
        style={{
          touchAction: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Снаряжение</DialogTitle>
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
            <EquipmentTab />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};