import React, { useState, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sword, Shield, Skull, Coins, Heart } from "lucide-react";
import { dungeonNames, dungeonBackgrounds } from "@/constants/dungeons";
import { generateDungeonOpponents } from "@/dungeons/dungeonManager";
import { MonsterCardDisplay } from "./monsters/MonsterCardDisplay";

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

// Monster images mapping for display
const monsterImages: Record<string, string> = {
  "Паучок-скелет": spiderSkeleton,
  "Паук-скакун": spiderJumper,
  "Паук-прядильщик": spiderWeaver,
  "Паук-охотник": spiderHunter,
  "Паук-королева-личинка": spiderQueenLarva,
  "Паук-трупоед": spiderCorpseEater,
  "Паук-стража": spiderGuardian,
  "Паук-виверна": spiderWyvern,
  "Теневой паук-ловец": shadowSpiderCatcher,
  "Древний паук-отшельник": ancientSpiderHermit,
  "Паук-берсерк": spiderBerserker,
  "Паук-иллюзионист": spiderIllusionist,
  "Паук-мать-стража": spiderMotherGuardian,
  "Паук-паразит": spiderParasite,
  "Паук-титан": spiderTitan,
  "Арахнидный Архимаг": arachnidArchmage,
  "Арахна, Мать-Прародительница": arachnaProgenitor
};

// Monster descriptions
const monsterDescriptions: Record<string, string> = {
  "Паучок-скелет": "Останки древнего паука, оживленные темной магией. Хрупкий, но агрессивный противник для начинающих авантюристов.",
  "Паук-скакун": "Быстрый и подвижный паук с мощными задними лапами. Способен внезапно атаковать с большого расстояния.",
  "Паук-прядильщик": "Мастер паутины, создающий сложные ловушки. Его сети могут замедлить даже самых опытных воинов.",
  "Паук-охотник": "Свирепый хищник с острыми клыками и бронированным панцирем. Предпочитает прямые атаки.",
  "Паук-королева-личинка": "Молодая особь паучьей королевы. Несмотря на юный возраст, обладает значительной силой и магическими способностями.",
  "Паук-трупоед": "Мрачное создание, питающееся мертвечиной. Его укус ядовит и может ослабить даже сильнейших героев.",
  "Паук-стража": "Древний защитник паучьих сокровищ. Облачен в мистические доспехи и владеет боевой магией.",
  "Паук-виверна": "Редкий гибрид паука и дракона. Обладает крыльями и способностью к полету, что делает его крайне опасным.",
  "Теневой паук-ловец": "Мастер теней и иллюзий. Может становиться невидимым и атаковать из засады, используя темную магию.",
  "Древний паук-отшельник": "Легендарный паук-маг, живущий в глубинах подземелья уже несколько веков. Владеет мощнейшими заклинаниями.",
  "Паук-берсерк": "Неистовый воин с броней из темного металла и клинками вместо лап. В бою впадает в кровожадную ярость.",
  "Паук-иллюзионист": "Мастер обмана и магических иллюзий. Окружает себя мистическими символами и может создавать ложные образы.",
  "Паук-мать-стража": "Древняя паучиха-прародительница, защищающая свое потомство. Обладает материнской яростью и мощной магией.",
  "Паук-паразит": "Отвратительное создание с множественными паразитическими отростками. Питается жизненной силой своих жертв.",
  "Паук-титан": "Колоссальный паук с мистическим кристаллом в груди. Его размеры превосходят все разумные пределы.",
  "Арахнидный Архимаг": "Высший маг паучьего рода с множественными магическими сферами. Владеет запретными заклинаниями древности.",
  "Арахна, Мать-Прародительница": "Первородная мать всех пауков. Легендарное существо невообразимой силы, порождающее новую жизнь из тьмы."
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
  return (
    <MonsterCardDisplay
      name={name}
      health={health}
      power={power}
      isBoss={isBoss}
      image={image}
      specialAbilities={specialAbilities}
      description={description}
    />
  );
};

interface DungeonLevelProps {
  dungeonType: string;
  level: number;
}

const DungeonLevel = memo(({ dungeonType, level }: DungeonLevelProps) => {
  const enhancedOpponents = useMemo(() => {
    const opponents = generateDungeonOpponents(dungeonType as any, level);
    
    return opponents.map(opponent => ({
      ...opponent,
      image: monsterImages[opponent.name] || opponent.image,
      description: monsterDescriptions[opponent.name]
    }));
  }, [dungeonType, level]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent border-b border-game-accent/30 pb-2">
        Уровень {level}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
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
});

DungeonLevel.displayName = 'DungeonLevel';

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