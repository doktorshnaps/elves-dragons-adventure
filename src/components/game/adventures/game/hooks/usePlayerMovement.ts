
import { useState, useEffect } from 'react';
import { Monster } from '../../types';

export const usePlayerMovement = (updateCameraOffset: (pos: number) => number) => {
  const [playerPosition, setPlayerPosition] = useState(100);
  const [playerY, setPlayerY] = useState(0);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [velocityY, setVelocityY] = useState(0);
  const [cameraOffset, setCameraOffset] = useState(0);

  const GRAVITY = 0.8;
  const JUMP_FORCE = 15;
  const MOVE_SPEED = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(true);
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(true);
      }
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !isJumping) {
        handleJump();
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

  // Горизонтальное движение
  useEffect(() => {
    let animationFrame: number;
    
    const updatePosition = () => {
      setPlayerPosition(prev => {
        let newPosition = prev;
        
        if (isMovingRight) {
          newPosition += MOVE_SPEED;
        }
        if (isMovingLeft) {
          newPosition = Math.max(0, prev - MOVE_SPEED);
        }
        
        const newOffset = updateCameraOffset(newPosition);
        setCameraOffset(newOffset);
        return newPosition;
      });

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

  // Вертикальное движение (прыжок и гравитация)
  useEffect(() => {
    let jumpFrame: number;

    const updateJump = () => {
      setPlayerY(prev => {
        const nextY = prev + velocityY;
        
        if (nextY <= 0) {
          setVelocityY(0);
          setIsJumping(false);
          return 0;
        }

        setVelocityY(prev => prev - GRAVITY);
        return nextY;
      });

      jumpFrame = requestAnimationFrame(updateJump);
    };

    if (isJumping || playerY > 0) {
      jumpFrame = requestAnimationFrame(updateJump);
    }

    return () => {
      if (jumpFrame) {
        cancelAnimationFrame(jumpFrame);
      }
    };
  }, [isJumping, playerY, velocityY]);

  const handleJump = () => {
    if (!isJumping && playerY === 0) {
      setIsJumping(true);
      setVelocityY(JUMP_FORCE);
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
