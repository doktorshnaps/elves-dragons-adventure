import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">Выберите режим игры</DialogTitle>
          <DialogDescription>
            Выберите режим игры для продолжения
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-4rem)] sm:h-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
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
            <Button
              variant="outline"
              className="h-16 sm:h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
              onClick={() => {
                onClose();
                navigate('/adventure');
              }}
            >
              Приключение
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};