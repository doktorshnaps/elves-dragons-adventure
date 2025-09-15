import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sword, Shield, Skull, Coins, Heart } from "lucide-react";
import { dungeonNames, dungeonBackgrounds } from "@/constants/dungeons";
import { generateDungeonOpponents } from "@/dungeons/dungeonManager";
import { generateLootTable, formatDropChance } from "@/utils/lootUtils";

// Import monster images
import spiderSkeleton from "@/assets/monsters/spider-skeleton.png";
import spiderJumper from "@/assets/monsters/spider-jumper.png";
import spiderWeaver from "@/assets/monsters/spider-weaver.png";
import spiderHunter from "@/assets/monsters/spider-hunter.png";
import spiderQueenLarva from "@/assets/monsters/spider-queen-larva.png";
import spiderCorpseEater from "@/assets/monsters/spider-corpse-eater.png";
import spiderGuardian from "@/assets/monsters/spider-guardian.png";
import spiderWyvern from "@/assets/monsters/spider-wyvern.png";
import shadowSpiderCatcher from "@/assets/monsters/shadow-spider-catcher.png";
import ancientSpiderHermit from "@/assets/monsters/ancient-spider-hermit.png";
import spiderBerserker from "@/assets/monsters/spider-berserker.png";
import spiderIllusionist from "@/assets/monsters/spider-illusionist.png";
import spiderMotherGuardian from "@/assets/monsters/spider-mother-guardian.png";
import spiderParasite from "@/assets/monsters/spider-parasite.png";
import spiderTitan from "@/assets/monsters/spider-titan.png";
import arachnidArchmage from "@/assets/monsters/arachnid-archmage.png";
import arachnaProgenitor from "@/assets/monsters/arachna-progenitor.png";

// Monster data with images and descriptions
const monsterData: Record<number, { name: string; image: string; description: string }> = {
  1: {
    name: "Паучок-скелет",
    image: spiderSkeleton,
    description: "Останки древнего паука, оживленные темной магией. Хрупкий, но агрессивный противник для начинающих авантюристов."
  },
  2: {
    name: "Паук-скакун",
    image: spiderJumper,
    description: "Быстрый и подвижный паук с мощными задними лапами. Способен внезапно атаковать с большого расстояния."
  },
  3: {
    name: "Паук-прядильщик",
    image: spiderWeaver,
    description: "Мастер паутины, создающий сложные ловушки. Его сети могут замедлить даже самых опытных воинов."
  },
  4: {
    name: "Паук-охотник",
    image: spiderHunter,
    description: "Свирепый хищник с острыми клыками и бронированным панцирем. Предпочитает прямые атаки."
  },
  5: {
    name: "Паук-королева-личинка",
    image: spiderQueenLarva,
    description: "Молодая особь паучьей королевы. Несмотря на юный возраст, обладает значительной силой и магическими способностями."
  },
  6: {
    name: "Паук-трупоед",
    image: spiderCorpseEater,
    description: "Мрачное создание, питающееся мертвечиной. Его укус ядовит и может ослабить даже сильнейших героев."
  },
  7: {
    name: "Паук-стража",
    image: spiderGuardian,
    description: "Древний защитник паучьих сокровищ. Облачен в мистические доспехи и владеет боевой магией."
  },
  8: {
    name: "Паук-виверна",
    image: spiderWyvern,
    description: "Редкий гибрид паука и дракона. Обладает крыльями и способностью к полету, что делает его крайне опасным."
  },
  9: {
    name: "Теневой паук-ловец",
    image: shadowSpiderCatcher,
    description: "Мастер теней и иллюзий. Может становиться невидимым и атаковать из засады, используя темную магию."
  },
  10: {
    name: "Древний паук-отшельник",
    image: ancientSpiderHermit,
    description: "Легендарный паук-маг, живущий в глубинах подземелья уже несколько веков. Владеет мощнейшими заклинаниями."
  },
  11: {
    name: "Паук-берсерк",
    image: spiderBerserker,
    description: "Неистовый воин с броней из темного металла и клинками вместо лап. В бою впадает в кровожадную ярость."
  },
  12: {
    name: "Паук-иллюзионист",
    image: spiderIllusionist,
    description: "Мастер обмана и магических иллюзий. Окружает себя мистическими символами и может создавать ложные образы."
  },
  13: {
    name: "Паук-мать-стража",
    image: spiderMotherGuardian,
    description: "Древняя паучиха-прародительница, защищающая свое потомство. Обладает материнской яростью и мощной магией."
  },
  14: {
    name: "Паук-паразит",
    image: spiderParasite,
    description: "Отвратительное создание с множественными паразитическими отростками. Питается жизненной силой своих жертв."
  },
  15: {
    name: "Паук-титан",
    image: spiderTitan,
    description: "Колоссальный паук с мистическим кристаллом в груди. Его размеры превосходят все разумные пределы."
  },
  16: {
    name: "Арахнидный Архимаг",
    image: arachnidArchmage,
    description: "Высший маг паучьего рода с множественными магическими сферами. Владеет запретными заклинаниями древности."
  },
  17: {
    name: "Арахна, Мать-Прародительница",
    image: arachnaProgenitor,
    description: "Первородная мать всех пауков. Легендарное существо невообразимой силы, порождающее новую жизнь из тьмы."
  }
};

interface MonsterCardProps {
  name: string;
  health: number;
  power: number;
  isBoss?: boolean;
  image?: string;
  specialAbilities?: any[];
  description?: string;
}

const MonsterCard = ({ name, health, power, isBoss, image, specialAbilities, description }: MonsterCardProps) => {
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
        
        {description && (
          <p className="text-sm text-game-text/80 leading-relaxed">{description}</p>
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
  
  // Enhance opponents with monster data
  const enhancedOpponents = opponents.map(opponent => {
    const levelBasedMonsterIndex = ((level - 1) % 17) + 1;
    const monsterInfo = monsterData[levelBasedMonsterIndex];
    
    return {
      ...opponent,
      name: monsterInfo?.name || opponent.name,
      image: monsterInfo?.image || opponent.image,
      description: monsterInfo?.description
    };
  });
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent border-b border-game-accent/30 pb-2">
        Уровень {level}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enhancedOpponents.map((opponent) => (
          <MonsterCard
            key={opponent.id}
            name={opponent.name}
            health={opponent.health}
            power={opponent.power}
            isBoss={opponent.isBoss}
            image={opponent.image}
            specialAbilities={opponent.specialAbilities}
            description={opponent.description}
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