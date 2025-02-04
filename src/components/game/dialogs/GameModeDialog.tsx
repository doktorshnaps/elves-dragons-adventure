import { Button } from "@/components/ui/button";
import { DungeonsList } from "@/components/game/DungeonsList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDungeonSearch: () => void;
}

export const GameModeDialog = ({ isOpen, onClose, onDungeonSearch }: GameModeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Выберите режим игры</DialogTitle>
          <DialogDescription>
            Выберите режим игры для продолжения
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-8rem)]">
          <div className="grid grid-cols-1 gap-4 p-4">
            <Button
              variant="outline"
              className="h-16 sm:h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
              onClick={() => {
                onClose();
                onDungeonSearch();
              }}
            >
              Поиск подземелья
            </Button>
            <DungeonsList />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};