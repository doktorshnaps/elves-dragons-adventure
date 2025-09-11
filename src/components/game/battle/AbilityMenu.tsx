import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ability } from "@/types/abilities";
import { TeamCard } from "@/hooks/useAbilities";

interface AbilityMenuProps {
  card: TeamCard;
  abilities: Ability[];
  onSelectAbility: (ability: Ability) => void;
  onCancel: () => void;
}

export const AbilityMenu = ({ card, abilities, onSelectAbility, onCancel }: AbilityMenuProps) => {
  return (
    <Card className="absolute z-50 bg-game-surface border-game-accent shadow-lg">
      <CardHeader>
        <CardTitle className="text-game-accent">
          {card.name} - Способности
        </CardTitle>
        <div className="text-sm text-game-text">
          Мана: {card.currentMana}/{card.maxMana}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {abilities.map((ability) => {
          const canUse = card.currentMana >= ability.manaCost;
          
          return (
            <Button
              key={ability.id}
              variant={canUse ? "default" : "secondary"}
              className="w-full justify-start text-left"
              disabled={!canUse}
              onClick={() => onSelectAbility(ability)}
            >
              <div className="flex flex-col items-start">
                <div className="font-medium">{ability.name}</div>
                <div className="text-xs opacity-70">
                  {ability.description} (Мана: {ability.manaCost})
                </div>
              </div>
            </Button>
          );
        })}
        
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={onCancel}
        >
          Отмена
        </Button>
      </CardContent>
    </Card>
  );
};