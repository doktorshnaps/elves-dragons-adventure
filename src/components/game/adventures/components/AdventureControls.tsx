import { Button } from "@/components/ui/button";

interface AdventureControlsProps {
  onStartAdventure: () => void;
  isDisabled: boolean;
  playerHealth: number;
}

export const AdventureControls = ({ 
  onStartAdventure, 
  isDisabled, 
  playerHealth 
}: AdventureControlsProps) => {
  return (
    <Button 
      onClick={onStartAdventure} 
      disabled={isDisabled || playerHealth <= 0}
      className="w-full bg-game-primary hover:bg-game-secondary text-lg py-6"
    >
      {playerHealth <= 0 ? "Герой обессилен" : "Начать приключение"}
    </Button>
  );
};