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
      variant="menu"
      className="w-full text-lg py-6"
      style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
    >
      {playerHealth <= 0 ? "Герой обессилен" : "Начать приключение"}
    </Button>
  );
};