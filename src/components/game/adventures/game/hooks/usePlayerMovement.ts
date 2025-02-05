import { useState, useEffect } from 'react';

export const usePlayerMovement = (updateCameraOffset: (pos: number) => void) => {
  const [playerPosition, setPlayerPosition] = useState(100);
  const [playerY, setPlayerY] = useState(0);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    let animationFrame: number;
    
    const updatePosition = () => {
      if (isMovingRight) {
        setPlayerPosition(prev => {
          const newPosition = Math.min(prev + 5, 2000);
          updateCameraOffset(newPosition);
          return newPosition;
        });
      }
      if (isMovingLeft) {
        setPlayerPosition(prev => {
          const newPosition = Math.max(prev - 5, 0);
          updateCameraOffset(newPosition);
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
      let velocity = 20;
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
        
        if (velocity > -20) { // Продолжаем анимацию пока скорость не станет слишком низкой
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

  return {
    playerPosition,
    playerY,
    isMovingRight,
    isMovingLeft,
    isJumping,
    setIsMovingRight,
    setIsMovingLeft,
    handleJump
  };
};