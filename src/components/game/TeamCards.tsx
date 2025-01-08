import { Card as CardComponent } from "@/components/ui/card";
import { Card as CardType } from "@/types/cards";
import { Shield, Sword } from "lucide-react";

interface TeamCardsProps {
  cards: CardType[];
}

export const TeamCards = ({ cards }: TeamCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardComponent
          key={card.id}
          className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-game-accent">
              {card.name} ({card.type === 'character' ? 'Герой' : 'Питомец'})
            </h3>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Sword className="w-4 h-4" />
              <span>{card.power}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>{card.defense}</span>
            </div>
          </div>
        </CardComponent>
      ))}
    </div>
  );
};