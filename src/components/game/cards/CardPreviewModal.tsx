import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card as CardType } from "@/types/cards";
import { getRarityLabel } from "@/utils/cardUtils";
import { Sparkles } from "lucide-react";
import { CardImage } from "./CardImage";

interface CardPreviewModalProps {
  card: CardType | null;
  open: boolean;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  deleteLabel?: string;
  onDelete?: () => void;
}

export const CardPreviewModal = ({ card, open, onClose, actionLabel, onAction, deleteLabel, onDelete }: CardPreviewModalProps) => {
  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent 
        className="z-[60] max-w-3xl max-h-[90vh] overflow-y-auto bg-game-surface border-game-accent"
        aria-describedby="card-details"
      >
        <DialogHeader>
          <DialogTitle className="text-game-accent">{card.name}</DialogTitle>
        </DialogHeader>
        <div id="card-details" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full flex items-center justify-center">
            <div className="w-full h-[60vh] md:h-[80vh] max-w-full rounded-lg border border-game-accent shadow-lg overflow-hidden">
              <CardImage image={card.image || "/placeholder.svg"} name={`${card.name} полное изображение`} card={card} />
            </div>
          </div>


          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-game-accent font-semibold">{card.type === 'character' ? 'Герой' : 'Питомец'}</span>
              <span className="text-yellow-500">{getRarityLabel(card.rarity)}</span>
            </div>
            {card.faction && (
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span>{card.faction}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-game-surface/60 border border-game-accent rounded p-3 text-center">
                <div className="text-sm text-game-accent">Сила</div>
                <div className="text-2xl font-bold text-red-400">{card.power}</div>
              </div>
              <div className="bg-game-surface/60 border border-game-accent rounded p-3 text-center">
                <div className="text-sm text-game-accent">Защита</div>
                <div className="text-2xl font-bold text-blue-400">{card.defense}</div>
              </div>
              <div className="bg-game-surface/60 border border-game-accent rounded p-3 text-center">
                <div className="text-sm text-game-accent">Здоровье</div>
                <div className="text-2xl font-bold text-green-400">{card.health}</div>
              </div>
            </div>

            <div className="bg-game-surface/60 border border-game-accent rounded p-3">
              <div className="text-sm text-game-accent">Магия</div>
              <div className="text-lg font-semibold text-purple-300">{card.magic}</div>
            </div>

            {card.magicResistance && (
              <div className="bg-game-surface/60 border border-game-accent rounded p-3">
                <div className="text-sm text-game-accent">Сопротивление магии</div>
                <div className="text-lg text-blue-400">{card.magicResistance.type}: {card.magicResistance.value}%</div>
              </div>
            )}

            {actionLabel && onAction && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Hero selection button clicked');
                  onAction();
                }}
                className="w-full mt-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80 text-game-accent rounded px-4 py-2 transition"
              >
                {actionLabel}
              </button>
            )}

            {deleteLabel && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full mt-2 bg-red-500/10 border-2 border-red-500/60 hover:bg-red-500/20 text-red-300 rounded px-4 py-2 transition"
              >
                {deleteLabel}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
