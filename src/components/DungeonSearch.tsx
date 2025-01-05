import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dice6 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";

export const DungeonSearch = ({ onClose }: { onClose: () => void }) => {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const navigate = useNavigate();

  const rollDice = () => {
    setRolling(true);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setResult(roll);
      setRolling(false);
      setTimeout(() => {
        navigate("/battle");
      }, 2000);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
    >
      <Card className="bg-game-surface border-game-accent p-8 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-accent mb-6">Поиск подземелья</h2>
          
          <motion.div
            animate={{ rotate: rolling ? 360 : 0 }}
            transition={{ duration: 1, repeat: rolling ? Infinity : 0 }}
            className="mb-6"
          >
            <Dice6 className="w-20 h-20 mx-auto text-game-accent" />
          </motion.div>

          {result && (
            <p className="text-xl text-game-accent mb-6">
              Выпало число: {result}
            </p>
          )}

          <div className="space-x-4">
            <Button
              onClick={rollDice}
              disabled={rolling}
              className="bg-game-primary hover:bg-game-primary/80"
            >
              {rolling ? "Бросаем кубик..." : "Бросить кубик"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-game-accent text-game-accent"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};