import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface PurchaseEffectProps {
  onComplete?: () => void;
}

// Simple confetti-like burst using framer-motion
export const PurchaseEffect: React.FC<PurchaseEffectProps> = ({ onComplete }) => {
  const controls = useAnimation();

  useEffect(() => {
    const run = async () => {
      await controls.start(i => ({
        x: Math.cos(i) * (80 + Math.random() * 120),
        y: Math.sin(i) * (80 + Math.random() * 120),
        scale: 0.8 + Math.random() * 0.6,
        opacity: 0,
        rotate: 90 + Math.random() * 180,
        transition: { duration: 0.9, ease: 'easeOut' }
      }));
      onComplete?.();
    };
    run();
  }, [controls, onComplete]);

  const particles = Array.from({ length: 22 }).map((_, idx) => idx);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={p}
          custom={(i / particles.length) * Math.PI * 2}
          animate={controls}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
          className="absolute rounded-full shadow-lg"
          style={{
            width: 8 + Math.random() * 10,
            height: 8 + Math.random() * 10,
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-foreground)))',
            boxShadow: '0 6px 16px hsl(var(--primary) / 0.4)'
          }}
        />
      ))}
      {/* subtle flash */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)/0.25), transparent 70%)'
        }}
      />
    </div>
  );
};
