import { motion } from 'framer-motion';

export const DamageNumber = ({ value, isCritical = false }: { value: number; isCritical?: boolean }) => (
  <motion.div
    initial={{ y: 0, opacity: 0, scale: 0.5 }}
    animate={{ 
      y: -50,
      opacity: [0, 1, 0],
      scale: isCritical ? [0.5, 1.5, 0.5] : [0.5, 1, 0.5]
    }}
    transition={{ 
      duration: 0.8,
      times: [0, 0.3, 1]
    }}
    className={`absolute pointer-events-none font-bold ${
      isCritical 
        ? 'text-red-500 text-2xl md:text-3xl' 
        : 'text-white text-xl md:text-2xl'
    }`}
  >
    {value}
  </motion.div>
);

export const AttackSwing = ({ active, direction = 'right' }: { active: boolean; direction?: 'left' | 'right' }) => (
  <motion.div
    animate={active ? 'attack' : 'idle'}
    variants={{
      attack: {
        rotate: direction === 'right' ? [-10, 30, -10] : [10, -30, 10],
        x: direction === 'right' ? [0, 20, 0] : [0, -20, 0],
        transition: { 
          duration: 0.3,
          ease: "easeInOut"
        }
      },
      idle: { 
        rotate: 0,
        x: 0,
        transition: {
          duration: 0.2
        }
      }
    }}
    className="relative"
  >
    <motion.div
      animate={active ? {
        opacity: [0, 1, 0],
        scale: [0.8, 1.2, 0.8]
      } : {}}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-game-accent/20 rounded-full blur-md"
    />
  </motion.div>
);