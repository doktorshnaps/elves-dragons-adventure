import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DungeonSearch } from "./DungeonSearch";

export const GameInterface = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState("0");
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
            onClick={() => setIsConnected(!isConnected)}
          >
            <Wallet2 className="mr-2 h-4 w-4" />
            {isConnected ? "Connected" : "Connect Wallet"}
          </Button>
          
          <Card className="bg-game-surface border-game-accent p-4">
            <p className="text-game-accent">Balance: {balance} TOKENS</p>
          </Card>
        </div>

        <Button
          className="bg-game-primary hover:bg-game-primary/80 text-white"
          onClick={() => setShowDungeonSearch(true)}
        >
          Search Dungeon
        </Button>
      </div>

      <Card className="bg-game-surface border-game-accent p-6">
        <h2 className="text-2xl font-bold text-game-accent mb-4">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-[3/4] flex items-center justify-center">
                <p className="text-gray-400">Card Slot {i}</p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {showDungeonSearch && (
        <DungeonSearch onClose={() => setShowDungeonSearch(false)} />
      )}
    </motion.div>
  );
};