import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EnergyDisplay } from "./EnergyDisplay";
import { dungeonRoutes, DungeonType } from "@/constants/dungeons";
import { EnergyState } from "@/utils/energyManager";
import { ActiveDungeonButton } from "./components/ActiveDungeonButton";
import { DungeonControls } from "./components/DungeonControls";
import { DungeonWarnings } from "./components/DungeonWarnings";
import { usePlayerState } from "@/hooks/usePlayerState";

interface DungeonSearchDialogProps {
  onClose: () => void;
  balance: number;
  selectedDungeon: DungeonType | null;
  rolling: boolean;
  energyState: EnergyState;
  timeUntilNext: number;
  isHealthTooLow: boolean;
  onRollDice: () => void;
  hasActiveCards: boolean;
}

const dungeonLevelRequirements = {
  spider_nest: 0,
  bone_dungeon: 10,
  dark_mage: 30,
  forgotten_souls: 50,
  ice_throne: 70,
  sea_serpent: 90,
  dragon_lair: 100
};

const dungeonNames = {
  spider_nest: "Гнездо Гигантских Пауков",
  bone_dungeon: "Темница Костяных Демонов",
  dark_mage: "Лабиринт Темного Мага",
  forgotten_souls: "Пещеры Забытых Душ",
  ice_throne: "Трон Ледяного Короля",
  sea_serpent: "Логово Морского Змея",
  dragon_lair: "Логово Черного Дракона"
};

export const DungeonSearchDialog = ({
  onClose,
  balance,
  selectedDungeon,
  energyState,
  timeUntilNext,
  isHealthTooLow,
  hasActiveCards
}: DungeonSearchDialogProps) => {
  const navigate = useNavigate();
  const [activeDungeon, setActiveDungeon] = React.useState<string | null>(null);
  const { playerStats } = usePlayerState();

  React.useEffect(() => {
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      try {
        const state = JSON.parse(battleState);
        if (state?.selectedDungeon && state?.playerStats?.health > 0) {
          setActiveDungeon(state.selectedDungeon);
        }
      } catch (error) {
        console.error('Error parsing battleState:', error);
      }
    }
  }, []);

  const handleDungeonSelect = (dungeonType: DungeonType) => {
    const route = dungeonRoutes[dungeonType];
    navigate(route);
  };

  const canEnterDungeon = (requiredLevel: number) => {
    return !isHealthTooLow && hasActiveCards && energyState.current > 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"
    >
      <Card className="bg-game-surface border-game-accent p-8 max-w-md w-full relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-game-accent hover:text-game-accent/80"
          onClick={onClose}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-accent mb-6">
            {activeDungeon ? 'Активное подземелье' : 'Выбор подземелья'}
          </h2>
          
          {!activeDungeon && (
            <>
              <EnergyDisplay energyState={energyState} timeUntilNext={timeUntilNext} />
              
              <div className="mb-4">
                <p className="text-game-accent">Баланс: {balance} ELL</p>
              </div>

              <div className="space-y-2">
                {Object.entries(dungeonLevelRequirements).map(([dungeon, requiredLevel]) => (
                  <Button
                    key={dungeon}
                    onClick={() => handleDungeonSelect(dungeon as DungeonType)}
                    disabled={!canEnterDungeon(requiredLevel)}
                    className="w-full bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
                  >
                    {dungeonNames[dungeon as keyof typeof dungeonNames]}
                  </Button>
                ))}
              </div>
            </>
          )}

          {activeDungeon && (
            <ActiveDungeonButton activeDungeon={activeDungeon} />
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="border-game-accent text-game-accent mt-4"
          >
            Закрыть
          </Button>

          <DungeonWarnings
            isHealthTooLow={isHealthTooLow}
            hasActiveCards={hasActiveCards}
            activeDungeon={activeDungeon}
          />
        </div>
      </Card>
    </motion.div>
  );
};