import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ability } from "@/types/abilities";
import { TeamPair } from "@/types/teamBattle";
import { HERO_ABILITIES } from "@/types/abilities";
import { Zap } from "lucide-react";

interface AbilitiesPanelProps {
  selectedPair: TeamPair | null;
  selectedAbility: Ability | null;
  onSelectAbility: (ability: Ability) => void;
  onCancelAbility: () => void;
}

export const AbilitiesPanel = ({ 
  selectedPair, 
  selectedAbility, 
  onSelectAbility, 
  onCancelAbility 
}: AbilitiesPanelProps) => {
  if (!selectedPair) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/20 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-5 h-5" />
            Способности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm">
            Выберите персонажа для просмотра способностей
          </div>
        </CardContent>
      </Card>
    );
  }

  const heroAbilities = HERO_ABILITIES[selectedPair.hero.name] || [];
  const currentMana = selectedPair.mana || 0;
  const maxMana = selectedPair.maxMana || selectedPair.hero.magic || 0;

  if (heroAbilities.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/20 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-5 h-5" />
            Способности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm">
            У {selectedPair.hero.name} нет способностей
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-blue-400/30 h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-400">
          <Zap className="w-5 h-5" />
          Способности: {selectedPair.hero.name}
        </CardTitle>
        
        {/* Мана-бар */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3 h-3 text-blue-400" />
            <Progress 
              value={(currentMana / maxMana) * 100} 
              className="flex-1 h-2"
            />
            <span className="text-blue-400">{currentMana}/{maxMana}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {heroAbilities.map((ability) => {
          const canUse = currentMana >= ability.manaCost;
          const isSelected = selectedAbility?.id === ability.id;
          
          return (
            <Button
              key={ability.id}
              variant={isSelected ? "default" : canUse ? "secondary" : "outline"}
              className={`w-full justify-start text-left h-auto p-3 ${
                isSelected ? 'bg-blue-600 hover:bg-blue-700 border-blue-400' : 
                canUse ? 'hover:bg-blue-500/20 border-blue-500/30' : 
                'opacity-50 cursor-not-allowed'
              }`}
              disabled={!canUse}
              onClick={() => {
                if (isSelected) {
                  onCancelAbility();
                } else {
                  onSelectAbility(ability);
                }
              }}
            >
              <div className="flex flex-col items-start w-full">
                <div className="font-medium text-sm">{ability.name}</div>
                <div className="text-xs opacity-80 mt-1">
                  {ability.description}
                </div>
                <div className="flex justify-between w-full mt-2 text-xs">
                  <span>Мана: {ability.manaCost}</span>
                  <span>Сила: {ability.power}</span>
                </div>
                {isSelected && (
                  <div className="text-xs text-yellow-300 mt-1 font-medium">
                    ⚡ Выберите цель для использования
                  </div>
                )}
              </div>
            </Button>
          );
        })}
        
        {selectedAbility && (
          <Button 
            variant="outline" 
            className="w-full mt-4 border-red-400 text-red-400 hover:bg-red-500/20"
            onClick={onCancelAbility}
          >
            Отменить способность
          </Button>
        )}
      </CardContent>
    </Card>
  );
};