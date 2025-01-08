import React from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sword } from "lucide-react";

interface PlayerCard {
  id: number;
  name: string;
  power: number;
  defense: number;
}

interface PlayerCardsProps {
  cards: PlayerCard[];
}

export const PlayerCards = ({ cards }: PlayerCardsProps) => {
  const totalPower = cards.reduce((sum, card) => sum + card.power, 0);
  const totalDefense = cards.reduce((sum, card) => sum + card.defense, 0);

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold text-game-accent mb-4">Ваши карты</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.id} className="p-4 bg-game-surface border-game-accent">
            <h4 className="font-bold text-game-accent mb-2">{card.name}</h4>
            <div className="flex justify-between text-gray-400">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4" />
                <span>+{card.power}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>+{card.defense}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">Общая сила</p>
          <p className="font-bold text-game-accent">+{totalPower}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Общая защита</p>
          <p className="font-bold text-game-accent">+{totalDefense}</p>
        </div>
      </div>
    </div>
  );
};