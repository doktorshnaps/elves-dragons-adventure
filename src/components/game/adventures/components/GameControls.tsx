import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sword } from "lucide-react";

interface GameControlsProps {
  onMoveLeft: (value: boolean) => void;
  onMoveRight: (value: boolean) => void;
  onJump: () => void;
  onAttack: () => void;
  isAttacking: boolean;
  hasTarget: boolean;
}

export const GameControls = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onAttack,
  isAttacking,
  hasTarget
}: GameControlsProps) => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
      <Button
        variant="default"
        size="lg"
        className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90"
        onMouseDown={() => onMoveLeft(true)}
        onMouseUp={() => onMoveLeft(false)}
        onMouseLeave={() => onMoveLeft(false)}
        onTouchStart={() => onMoveLeft(true)}
        onTouchEnd={() => onMoveLeft(false)}
      >
        <ArrowLeft className="h-8 w-8" />
      </Button>
      
      <Button
        variant="default"
        size="lg"
        className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90"
        onClick={onJump}
      >
        ⬆️
      </Button>

      <Button
        variant="default"
        size="lg"
        className={`h-16 w-16 rounded-full ${
          hasTarget ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500'
        }`}
        onClick={onAttack}
        disabled={!hasTarget || isAttacking}
      >
        <Sword className="h-8 w-8" />
      </Button>
      
      <Button
        variant="default"
        size="lg"
        className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90"
        onMouseDown={() => onMoveRight(true)}
        onMouseUp={() => onMoveRight(false)}
        onMouseLeave={() => onMoveRight(false)}
        onTouchStart={() => onMoveRight(true)}
        onTouchEnd={() => onMoveRight(false)}
      >
        <ArrowRight className="h-8 w-8" />
      </Button>
    </div>
  );
};