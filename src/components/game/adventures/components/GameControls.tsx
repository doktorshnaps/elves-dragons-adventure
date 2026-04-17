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

/**
 * Use Pointer Events instead of separate mouse+touch handlers.
 * On iOS WKWebView the dual mouse/touch handlers cause first-tap to be
 * "swallowed" — Pointer Events unify both inputs and fire reliably on
 * the first interaction.
 */
export const GameControls = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onAttack,
  isAttacking,
  hasTarget,
  disabled = false
}: GameControlsProps) => {
  const makeHoldHandlers = (setter: (v: boolean) => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled) return;
      // preventDefault on iOS suppresses the synthetic 300ms click + the
      // double-fire that swallows the first tap inside WKWebView.
      e.preventDefault();
      try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch {}
      setter(true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch {}
      setter(false);
    },
    onPointerCancel: () => {
      if (disabled) return;
      setter(false);
    },
    onPointerLeave: () => {
      if (disabled) return;
      setter(false);
    },
  });

  return (
    <>
      {/* Movement Controls - Left Side */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        <Button
          variant="default"
          size="lg"
          className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90 disabled:opacity-50 touch-manipulation"
          {...makeHoldHandlers(onMoveLeft)}
          disabled={disabled}
        >
          <ArrowLeft className="h-8 w-8" />
        </Button>
        
        <Button
          variant="default"
          size="lg"
          className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90 disabled:opacity-50 touch-manipulation"
          {...makeHoldHandlers(onMoveRight)}
          disabled={disabled}
        >
          <ArrowRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Action Controls - Right Side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        <Button
          variant="default"
          size="lg"
          className="h-16 w-16 rounded-full bg-game-accent hover:bg-game-accent/90 disabled:opacity-50 touch-manipulation"
          onClick={onJump}
          disabled={disabled}
        >
          ⬆️
        </Button>

        <Button
          variant="default"
          size="lg"
          className={`h-16 w-16 rounded-full touch-manipulation ${
            hasTarget ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500'
          } disabled:opacity-50`}
          onClick={onAttack}
          disabled={!hasTarget || isAttacking || disabled}
        >
          <Sword className="h-8 w-8" />
        </Button>
      </div>
    </>
  );
};
