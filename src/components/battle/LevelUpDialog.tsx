import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Sword, Heart } from "lucide-react";
import { StatUpgrade } from '@/types/battle';
import { motion } from "framer-motion";

interface LevelUpDialogProps {
  isOpen: boolean;
  onUpgradeSelect: (upgrade: StatUpgrade) => void;
}

export const LevelUpDialog = ({ isOpen, onUpgradeSelect }: LevelUpDialogProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-game-surface border-game-accent">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-game-accent text-center">
            Повышение уровня!
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 p-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center"
          >
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => onUpgradeSelect('health')}
            >
              <Heart className="w-8 h-8 text-red-500" />
              <span>+20 к здоровью</span>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center"
          >
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => onUpgradeSelect('power')}
            >
              <Sword className="w-8 h-8 text-yellow-500" />
              <span>+5 к силе</span>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center"
          >
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => onUpgradeSelect('defense')}
            >
              <Shield className="w-8 h-8 text-blue-500" />
              <span>+3 к защите</span>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};