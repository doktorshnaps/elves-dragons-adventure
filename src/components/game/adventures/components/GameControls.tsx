import React from 'react';

interface GameControlsProps {
  onMoveLeft: (active: boolean) => void;
  onMoveRight: (active: boolean) => void;
  onJump: () => void;
  onAttack: () => void;
  isAttacking: boolean;
}

export const GameControls = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onAttack,
  isAttacking
}: GameControlsProps) => {
  return (
    <>
      <div className="fixed bottom-20 left-4 flex gap-4 md:hidden z-50">
        <button
          className="w-16 h-16 bg-game-primary/80 rounded-full flex items-center justify-center text-white text-2xl shadow-lg backdrop-blur-sm"
          onTouchStart={() => onMoveLeft(true)}
          onTouchEnd={() => onMoveLeft(false)}
        >
          ←
        </button>
        <button
          className="w-16 h-16 bg-game-primary/80 rounded-full flex items-center justify-center text-white text-2xl shadow-lg backdrop-blur-sm"
          onTouchStart={() => onMoveRight(true)}
          onTouchEnd={() => onMoveRight(false)}
        >
          →
        </button>
      </div>
      
      <button
        className="fixed bottom-20 right-28 w-20 h-20 bg-game-accent/80 rounded-full flex items-center justify-center text-white text-3xl shadow-lg backdrop-blur-sm md:hidden z-50"
        onClick={onJump}
      >
        ↑
      </button>

      <button
        className="fixed bottom-20 right-8 w-20 h-20 bg-game-accent/80 rounded-full flex items-center justify-center text-white text-3xl shadow-lg backdrop-blur-sm md:hidden z-50"
        onClick={onAttack}
        disabled={isAttacking}
      >
        ⚔️
      </button>
    </>
  );
};