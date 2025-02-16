import { useState, useEffect } from 'react';
import { Monster } from '../../types';

export const usePlayerMovement = (updateCameraOffset: (pos: number) => number) => {
  const [playerPosition, setPlayerPosition] = useState(100);
  const [playerY, setPlayerY] = useState(0);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [cameraOffset, setCameraOffset] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(true);
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(true);
      }
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !isJumping) {
        setIsJumping(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(false);
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isJumping]);

  useEffect(() => {
    let animationFrame: number;
    
    const updatePosition = () => {
      if (isMovingRight) {
        setPlayerPosition(prev => {
          const newPosition = prev + 5;
          const newOffset = updateCameraOffset(newPosition);
          setCameraOffset(newOffset);
          return newPosition;
        });
      }
      if (isMovingLeft) {
        setPlayerPosition(prev => {
          const newPosition = Math.max(prev - 5, 0);
          const newOffset = updateCameraOffset(newPosition);
          setCameraOffset(newOffset);
          return newPosition;
        });
      }
      animationFrame = requestAnimationFrame(updatePosition);
    };

    if (isMovingRight || isMovingLeft) {
      animationFrame = requestAnimationFrame(updatePosition);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isMovingRight, isMovingLeft, updateCameraOffset]);

  useEffect(() => {
    if (isJumping) {
      const gravity = 0.5;
      let velocity = 19.5;
      let jumpAnimationFrame: number;
      
      const jumpAnimation = () => {
        setPlayerY(prev => {
          const newY = prev + velocity;
          velocity -= gravity;
          
          if (newY <= 0) {
            setIsJumping(false);
            return 0;
          }
          
          return newY;
        });
        
        if (velocity > -19.5) {
          jumpAnimationFrame = requestAnimationFrame(jumpAnimation);
        }
      };
      
      jumpAnimationFrame = requestAnimationFrame(jumpAnimation);
      
      return () => {
        if (jumpAnimationFrame) {
          cancelAnimationFrame(jumpAnimationFrame);
        }
      };
    }
  }, [isJumping]);

  const handleJump = () => {
    if (!isJumping) {
      setIsJumping(true);
    }
  };

  const handleSelectTarget = (monster: Monster) => {
    if (!monster.position) return;
    return {
      id: monster.id,
      position: monster.position
    };
  };

  return {
    playerPosition,
    playerY,
    isMovingRight,
    isMovingLeft,
    isJumping,
    setIsMovingRight,
    setIsMovingLeft,
    handleJump,
    cameraOffset,
    handleSelectTarget
  };
};