import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card as CardType } from "@/types/cards";
import { getRarityLabel, calculateCardStats } from "@/utils/cardUtils";
import { Sparkles, Target } from "lucide-react";
import { CardImage } from "./CardImage";
import { useMemo } from "react";
import { useCardInstances } from "@/hooks/useCardInstances";

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
  const { cardInstances } = useCardInstances();
  
  if (!card) return null;

  // Пересчитываем характеристики с учётом класса и редкости
  const stats = useMemo(() => 
    calculateCardStats(card.name, card.rarity, card.type), 
    [card.name, card.rarity, card.type]
  );

  // Найти экземпляр карты для получения статистики убийств
  const cardInstance = cardInstances.find(ci => ci.card_template_id === card.id);
  const monsterKills = cardInstance?.monster_kills || 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent 
        className="z-[60] max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-game-surface/95 via-game-background/90 to-game-surface/95 backdrop-blur-md border-2 border-game-primary/40 shadow-[0_0_30px_rgba(155,135,245,0.2)]"
        aria-describedby="card-details"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-bold bg-gradient-to-r from-game-primary via-game-accent to-game-primary bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">{card.name}</DialogTitle>
        </DialogHeader>
        <div id="card-details" className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto flex-1">
          <div className="w-full flex items-center justify-center">
            <div className="w-full h-[40vh] md:h-[50vh] max-w-full rounded-lg border-2 border-game-primary/40 shadow-[0_0_20px_rgba(155,135,245,0.15)] overflow-hidden">
              <CardImage image={card.image || "/placeholder.svg"} name={`${card.name} полное изображение`} card={card} />
            </div>
          </div>


          {/* Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-gradient-to-r from-game-surface/60 to-game-surface/40 border border-game-primary/30 rounded-lg p-1.5">
              <span className="text-xs font-semibold text-game-primary">{card.type === 'character' ? 'Герой' : 'Питомец'}</span>
              <span className="text-xs text-yellow-400 font-medium">{getRarityLabel(card.rarity)}</span>
            </div>
            {card.faction && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-400/20 rounded-lg p-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-purple-300">{card.faction}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-gradient-to-br from-red-500/15 to-red-600/5 border border-red-400/25 rounded-lg p-1.5 text-center hover:shadow-[0_0_12px_rgba(248,113,113,0.3)] transition-shadow">
                <div className="text-[10px] text-game-primary/80 mb-0.5">Сила</div>
                <div className="text-lg font-bold text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]">{stats.power}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/5 border border-blue-400/25 rounded-lg p-1.5 text-center hover:shadow-[0_0_12px_rgba(96,165,250,0.3)] transition-shadow">
                <div className="text-[10px] text-game-primary/80 mb-0.5">Защита</div>
                <div className="text-lg font-bold text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]">{stats.defense}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/15 to-green-600/5 border border-green-400/25 rounded-lg p-1.5 text-center hover:shadow-[0_0_12px_rgba(74,222,128,0.3)] transition-shadow">
                <div className="text-[10px] text-game-primary/80 mb-0.5">Здоровье</div>
                <div className="text-lg font-bold text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]">{stats.health}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-400/25 rounded-lg p-1.5 hover:shadow-[0_0_12px_rgba(192,132,252,0.3)] transition-shadow">
              <div className="text-[10px] text-game-primary/80 mb-0.5">Магия</div>
              <div className="text-base font-semibold text-purple-300 drop-shadow-[0_0_6px_rgba(216,180,254,0.5)]">{stats.magic}</div>
            </div>

            {card.magicResistance && (
              <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/5 border border-blue-400/25 rounded-lg p-1.5 hover:shadow-[0_0_12px_rgba(96,165,250,0.3)] transition-shadow">
                <div className="text-[10px] text-game-primary/80 mb-0.5">Сопротивление магии</div>
                <div className="text-xs text-blue-300">{card.magicResistance.type}: {card.magicResistance.value}%</div>
              </div>
            )}

            {/* Monster Kills Stats */}
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/10 backdrop-blur-sm border-2 border-red-500/40 rounded-lg p-2 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-medium text-game-text">Убито монстров</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  {monsterKills}
                </span>
              </div>
            </div>

            {actionLabel && onAction && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Hero selection button clicked');
                  onAction();
                }}
                className="w-full mt-1.5 bg-gradient-to-br from-game-surface/90 to-game-surface/60 border-2 border-game-primary/40 hover:border-game-accent/60 hover:shadow-[0_0_15px_rgba(217,70,239,0.3)] text-game-primary hover:text-game-accent rounded-lg px-3 py-1.5 transition-all duration-300 font-medium text-sm"
              >
                {actionLabel}
              </button>
            )}

            {deleteLabel && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full mt-1.5 bg-gradient-to-br from-red-500/15 to-red-600/5 border-2 border-red-500/40 hover:border-red-400/60 hover:bg-red-500/25 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-300 hover:text-red-200 rounded-lg px-3 py-1.5 transition-all duration-300 font-medium text-sm"
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
