
import { motion } from 'framer-motion';

interface ProjectileSpriteProps {
  x: number;
  y: number;
}

export const ProjectileSprite = ({ x, y }: ProjectileSpriteProps) => {
  return (
    <motion.div
      className="absolute w-4 h-4 bg-red-500 rounded-full"
      style={{
        left: x,
        bottom: y
      }}
      initial={{ scale: 0.8, opacity: 0.8 }}
      animate={{
        scale: [0.8, 1.2, 0.8],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity
      }}
    />
  );
};
