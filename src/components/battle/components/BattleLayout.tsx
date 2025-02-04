import React from 'react';
import { motion } from "framer-motion";

interface BattleLayoutProps {
  children: React.ReactNode;
  backgroundImage?: string;
}

export const BattleLayout = ({ children, backgroundImage }: BattleLayoutProps) => {
  return (
    <div 
      className="min-h-screen bg-game-background p-2 md:p-6 relative"
      style={{
        backgroundImage: backgroundImage ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth'
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};