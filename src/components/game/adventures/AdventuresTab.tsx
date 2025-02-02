import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sword, ArrowRight, Coins, Shield, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { ExperienceBar } from "../stats/ExperienceBar";
import { Item } from "@/types/inventory";

interface Monster {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  reward: number;
  experienceReward: number;
  type: 'normal' | 'elite' | 'boss';
}

interface Equipment {
  weapon?: Item;
  armor?: Item;
  accessory?: Item;
}

export const AdventuresTab = () => {
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [requiredExperience, setRequiredExperience] = useState(100);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [equipment, setEquipment] = useState<Equipment>({});
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();

  const calculatePlayerStats = () => {
    let totalPower = 10;
    let totalDefense = 5;
    let totalHealth = 100;

    if (equipment.weapon?.stats) {
      totalPower += equipment.weapon.stats.power || 0;
    }
    if (equipment.armor?.stats) {
      totalDefense += equipment.armor.stats.defense || 0;
      totalHealth += equipment.armor.stats.health || 0;
    }
    if (equipment.accessory?.stats) {
      totalPower += equipment.accessory.stats.power || 0;
      totalDefense += equipment.accessory.stats.defense || 0;
      totalHealth += equipment.accessory.stats.health || 0;
    }

    return { power: totalPower, defense: totalDefense, maxHealth: totalHealth };
  };

  const generateMonster = (): Monster => {
    const powerMultiplier = 1 + (level - 1) * 0.5;
    const healthMultiplier = 1 + (level - 1) * 0.3;
    const rewardMultiplier = 1 + (level - 1) * 0.7;

    const monsterTypes: Array<{ type: 'normal' | 'elite' | 'boss', chance: number, expReward: number }> = [
      { type: 'normal', chance: 0.7, expReward: 30 },
      { type: 'elite', chance: 0.25, expReward: 60 },
      { type: 'boss', chance: 0.05, expReward: 100 }
    ];

    const roll = Math.random();
    let cumulativeChance = 0;
    let selectedType = monsterTypes[0];

    for (const type of monsterTypes) {
      cumulativeChance += type.chance;
      if (roll <= cumulativeChance) {
        selectedType = type;
        break;
      }
    }

    const monsters = [
      "Дикий волк",
      "Горный тролль",
      "Лесной разбойник",
      "Древний голем",
      "Темный маг"
    ];

    const monsterName = monsters[Math.floor(Math.random() * monsters.length)];
    const baseHealth = selectedType.type === 'boss' ? 100 : selectedType.type === 'elite' ? 75 : 50;
    const basePower = selectedType.type === 'boss' ? 20 : selectedType.type === 'elite' ? 15 : 10;
    
    return {
      id: Date.now(),
      name: `${selectedType.type === 'boss' ? 'Босс: ' : selectedType.type === 'elite' ? 'Элитный: ' : ''}${monsterName}`,
      power: Math.floor(basePower * powerMultiplier),
      health: Math.floor(baseHealth * healthMultiplier),
      maxHealth: Math.floor(baseHealth * healthMultiplier),
      reward: Math.floor(20 * rewardMultiplier),
      experienceReward: selectedType.expReward,
      type: selectedType.type
    };
  };

  const gainExperience = (amount: number) => {
    const newExperience = experience + amount;
    if (newExperience >= requiredExperience) {
      // Level up!
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setExperience(newExperience - requiredExperience);
      setRequiredExperience(Math.floor(requiredExperience * 1.5));
      
      toast({
        title: "Уровень повышен!",
        description: `Достигнут ${nextLevel} уровень!`,
        variant: "default"
      });
    } else {
      setExperience(newExperience);
    }
  };

  const startAdventure = () => {
    if (playerHealth <= 0) {
      toast({
        title: "Невозможно начать приключение",
        description: "Ваш герой слишком слаб. Восстановите здоровье!",
        variant: "destructive"
      });
      return;
    }
    
    const newMonster = generateMonster();
    setCurrentMonster(newMonster);
  };

  const attackMonster = () => {
    if (!currentMonster) return;

    const stats = calculatePlayerStats();
    
    const playerDamage = Math.floor(Math.random() * stats.power) + Math.floor(stats.power * 0.5);
    const newMonsterHealth = currentMonster.health - playerDamage;

    const monsterDamage = Math.floor(Math.random() * currentMonster.power);
    const reducedDamage = Math.max(0, monsterDamage - Math.floor(stats.defense * 0.5));
    const newPlayerHealth = playerHealth - reducedDamage;

    toast({
      title: "Битва!",
      description: `Вы нанесли ${playerDamage} урона! Монстр нанес ${reducedDamage} урона!`
    });

    if (newMonsterHealth <= 0) {
      updateBalance(balance + currentMonster.reward);
      gainExperience(currentMonster.experienceReward);
      
      toast({
        title: "Победа!",
        description: `Вы получили ${currentMonster.reward} монет и ${currentMonster.experienceReward} опыта!`
      });
      
      setCurrentMonster(null);
      return;
    }

    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы проиграли битву...",
        variant: "destructive"
      });
      setPlayerHealth(0);
      setCurrentMonster(null);
      return;
    }

    setPlayerHealth(newPlayerHealth);
    setCurrentMonster({
      ...currentMonster,
      health: newMonsterHealth
    });
  };

  const restoreHealth = () => {
    if (balance < 50) {
      toast({
        title: "Недостаточно монет",
        description: "Нужно 50 монет для восстановления здоровья",
        variant: "destructive"
      });
      return;
    }

    const stats = calculatePlayerStats();
    updateBalance(balance - 50);
    setPlayerHealth(stats.maxHealth);
    toast({
      title: "Здоровье восстановлено",
      description: "Ваш герой готов к новым приключениям!"
    });
  };

  const stats = calculatePlayerStats();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-game-accent">Приключения</h2>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-400">Уровень: {level}</span>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={restoreHealth}
            disabled={playerHealth >= stats.maxHealth}
          >
            Восстановить здоровье (50 монет)
          </Button>
          <Button onClick={startAdventure} disabled={!!currentMonster || playerHealth <= 0}>
            {playerHealth <= 0 ? "Герой обессилен" : "Начать приключение"}
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-game-surface border-game-accent">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Sword className="w-5 h-5 text-game-accent" />
            <span className="text-sm">Сила: {stats.power}</span>
          </div>
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-game-accent" />
            <span className="text-sm">Защита: {stats.defense}</span>
          </div>
          <ExperienceBar experience={experience} requiredExperience={requiredExperience} />
        </div>
      </Card>

      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
        <div
          className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${(playerHealth / stats.maxHealth) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentMonster && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 bg-game-surface border-game-accent">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-game-accent">{currentMonster.name}</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <span>{currentMonster.reward}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Сила: {currentMonster.power}</span>
                    <span>HP: {currentMonster.health}/{currentMonster.maxHealth}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(currentMonster.health / currentMonster.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={attackMonster}
                  disabled={playerHealth <= 0}
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Атаковать
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdventuresTab = AdventuresTab;
