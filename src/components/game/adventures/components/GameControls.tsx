
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
  disabled?: boolean;
}

export const GameControls = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onAttack,
  isAttacking,
  hasTarget,
  disabled = false
}: GameControlsProps) => {
  return (
    <>
      {/* Movement Controls - Left Side */}
      <div 
        className="fixed"
        style={{
          left: 'env(safe-area-inset-left, 1rem)',
          bottom: 'env(safe-area-inset-bottom, 4rem)',
          zIndex: 50
        }}
      >
        <div className="flex flex-col gap-4">
          <Button
            variant="default"
            size="lg"
            className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90 disabled:opacity-50"
            onMouseDown={() => !disabled && onMoveLeft(true)}
            onMouseUp={() => !disabled && onMoveLeft(false)}
            onMouseLeave={() => !disabled && onMoveLeft(false)}
            onTouchStart={() => !disabled && onMoveLeft(true)}
            onTouchEnd={() => !disabled && onMoveLeft(false)}
            disabled={disabled}
          >
            <ArrowLeft className="h-8 w-8" />
          </Button>
          
          <Button
            variant="default"
            size="lg"
            className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90 disabled:opacity-50"
            onMouseDown={() => !disabled && onMoveRight(true)}
            onMouseUp={() => !disabled && onMoveRight(false)}
            onMouseLeave={() => !disabled && onMoveRight(false)}
            onTouchStart={() => !disabled && onMoveRight(true)}
            onTouchEnd={() => !disabled && onMoveRight(false)}
            disabled={disabled}
          >
            <ArrowRight className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Action Controls - Right Side */}
      <div 
        className="fixed"
        style={{
          right: 'env(safe-area-inset-right, 1rem)',
          bottom: 'env(safe-area-inset-bottom, 4rem)',
          zIndex: 50
        }}
      >
        <div className="flex flex-col gap-4">
          <Button
            variant="default"
            size="lg"
            className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90 disabled:opacity-50"
            onClick={onJump}
            disabled={disabled}
          >
            ⬆️
          </Button>

          <Button
            variant="default"
            size="lg"
            className={`h-16 w-16 rounded-full ${
              hasTarget ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500'
            } disabled:opacity-50`}
            onClick={onAttack}
            disabled={!hasTarget || isAttacking || disabled}
          >
            <Sword className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </>
  );
};
