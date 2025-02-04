import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface NextLevelButtonProps {
  show: boolean;
  onClick: () => void;
}

export const NextLevelButton = ({ show, onClick }: NextLevelButtonProps) => {
  const isMobile = useIsMobile();

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center mb-4 md:mb-8"
    >
      <Button
        variant="default"
        size={isMobile ? "default" : "lg"}
        onClick={onClick}
        className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm md:text-base"
      >
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
        {isMobile ? "Следующий уровень" : "Перейти на следующий уровень"}
      </Button>
    </motion.div>
  );
};