import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Battle = () => {
  const navigate = useNavigate();
  const opponents = [
    { id: 1, name: "Дракон", power: 5 },
    { id: 2, name: "Тролль", power: 3 },
    { id: 3, name: "Гоблин", power: 2 },
  ];

  return (
    <div className="min-h-screen bg-game-background p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-game-accent hover:text-game-accent/80"
              onClick={() => navigate("/game")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-game-accent">Битва</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opponents.map((opponent) => (
            <motion.div
              key={opponent.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: opponent.id * 0.2 }}
            >
              <Card className="p-6 bg-game-surface border-game-accent hover:border-game-primary transition-colors">
                <h3 className="text-xl font-bold text-game-accent mb-4">
                  {opponent.name}
                </h3>
                <p className="text-gray-400">Сила: {opponent.power}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Battle;