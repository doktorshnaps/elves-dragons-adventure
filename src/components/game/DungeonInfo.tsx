import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sword, Shield, Skull, Coins, Heart } from "lucide-react";
import { dungeonNames, dungeonBackgrounds } from "@/constants/dungeons";
import { generateDungeonOpponents } from "@/dungeons/dungeonManager";
import { generateLootTable, formatDropChance } from "@/utils/lootUtils";

interface MonsterCardProps {
  name: string;
  health: number;
  power: number;
  isBoss?: boolean;
  image?: string;
  specialAbilities?: any[];
}

const MonsterCard = ({ name, health, power, isBoss, image, specialAbilities }: MonsterCardProps) => {
  const lootTable = generateLootTable(isBoss || false);
  
  return (
    <Card className="bg-game-surface/50 border-game-accent/30 hover:border-game-accent/60 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-game-accent flex items-center gap-2">
            {isBoss && <Skull className="w-5 h-5 text-orange-400" />}
            {name}
          </CardTitle>
          {isBoss && <Badge variant="destructive" className="bg-orange-600">Босс</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {image && (
          <div className="w-full h-32 bg-cover bg-center rounded-md border border-game-accent/20"
               style={{ backgroundImage: `url(${image})` }} />
        )}
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-red-400">
            <Heart className="w-4 h-4" />
            <span>{health} HP</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Sword className="w-4 h-4" />
            <span>{power} Урон</span>
          </div>
        </div>

        {specialAbilities && specialAbilities.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-game-accent">Способности:</h4>
            <div className="flex flex-wrap gap-1">
              {specialAbilities.map((ability, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-purple-900/20 text-purple-300 border-purple-400/30">
                  {ability.type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-game-accent/20">
          <h4 className="text-sm font-medium text-game-accent flex items-center gap-1">
            <Coins className="w-4 h-4" />
            Возможный дроп:
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Монеты ({lootTable.coins.min}-{lootTable.coins.max})</span>
              <span className="text-green-400">{formatDropChance(lootTable.coins.chance)}</span>
            </div>
            {lootTable.healthPotion && (
              <div className="flex justify-between">
                <span>Зелье здоровья</span>
                <span className="text-green-400">{formatDropChance(lootTable.healthPotion.chance)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DungeonLevelProps {
  dungeonType: string;
  level: number;
}

const DungeonLevel = ({ dungeonType, level }: DungeonLevelProps) => {
  const opponents = generateDungeonOpponents(dungeonType as any, level);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent border-b border-game-accent/30 pb-2">
        Уровень {level}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opponents.map((opponent) => (
          <MonsterCard
            key={opponent.id}
            name={opponent.name}
            health={opponent.health}
            power={opponent.power}
            isBoss={opponent.isBoss}
            image={opponent.image}
            specialAbilities={opponent.specialAbilities}
          />
        ))}
      </div>
    </div>
  );
};

interface DungeonDetailProps {
  dungeonType: string;
  dungeonName: string;
}

const DungeonDetail = ({ dungeonType, dungeonName }: DungeonDetailProps) => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const backgroundImage = dungeonBackgrounds[dungeonType as keyof typeof dungeonBackgrounds];
  
  return (
    <div className="space-y-6">
      <Card className="bg-game-surface/50 border-game-accent">
        <CardHeader>
          <CardTitle className="text-xl text-game-accent">{dungeonName}</CardTitle>
        </CardHeader>
        <CardContent>
          {backgroundImage && (
            <div 
              className="w-full h-48 bg-cover bg-center rounded-md border border-game-accent/30 mb-4"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
          <p className="text-game-text mb-4">
            Исследуйте это подземелье и сражайтесь с различными монстрами на каждом уровне.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-game-surface/50 border-game-accent">
        <CardHeader>
          <CardTitle className="text-lg text-game-accent">Выберите уровень</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-6">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`p-2 rounded text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? 'bg-game-accent text-black'
                    : 'bg-game-surface/30 text-game-text hover:bg-game-accent/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          
          <DungeonLevel dungeonType={dungeonType} level={selectedLevel} />
        </CardContent>
      </Card>
    </div>
  );
};

export const DungeonInfo = () => {
  const availableDungeons = [
    { key: 'spider_nest', name: dungeonNames.spider_nest }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-game-accent mb-2">Гайд по подземельям</h2>
        <p className="text-game-text">
          Изучите монстров, их способности и возможный дроп в каждом подземелье
        </p>
      </div>

      <Tabs defaultValue={availableDungeons[0]?.key} className="w-full">
        <TabsList className="grid w-full grid-cols-1 bg-game-surface/50 border border-game-accent/30">
          {availableDungeons.map(dungeon => (
            <TabsTrigger 
              key={dungeon.key} 
              value={dungeon.key}
              className="data-[state=active]:bg-game-accent data-[state=active]:text-black"
            >
              {dungeon.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableDungeons.map(dungeon => (
          <TabsContent key={dungeon.key} value={dungeon.key} className="mt-6">
            <DungeonDetail 
              dungeonType={dungeon.key}
              dungeonName={dungeon.name}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};