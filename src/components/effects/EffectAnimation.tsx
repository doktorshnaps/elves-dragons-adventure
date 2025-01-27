import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Effect } from '@/types/effects';
import { Shield, Flame, Heart, Swords, Skull } from 'lucide-react';

const effectVariants = {
  initial: { 
    scale: 0,
    opacity: 0,
    y: 20
  },
  active: { 
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  exit: { 
    scale: 0,
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
};

const getEffectIcon = (type: Effect['type']) => {
  switch (type) {
    case 'defense':
      return Shield;
    case 'burn':
      return Flame;
    case 'heal':
      return Heart;
    case 'strength':
      return Swords;
    case 'poison':
      return Skull;
    default:
      return Shield;
  }
};

const getEffectColor = (type: Effect['type']) => {
  switch (type) {
    case 'defense':
      return 'bg-blue-500';
    case 'burn':
      return 'bg-orange-500';
    case 'heal':
      return 'bg-green-500';
    case 'strength':
      return 'bg-purple-500';
    case 'poison':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
};

const BaseEffectIndicator = ({ effect }: { effect: Effect }) => {
  const Icon = getEffectIcon(effect.type);
  const bgColor = getEffectColor(effect.type);

  return (
    <motion.div
      key={effect.id}
      variants={effectVariants}
      initial="initial"
      animate="active"
      exit="exit"
      className={`relative flex items-center justify-center p-2 rounded-full ${bgColor} shadow-lg`}
    >
      <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
      {effect.remaining > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center"
        >
          {effect.remaining}
        </motion.span>
      )}
    </motion.div>
  );
};

export const EffectIndicator = memo(BaseEffectIndicator);