import React, { useState, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sword, Shield, Skull, Coins, Heart } from "lucide-react";
import { dungeonNames, dungeonBackgrounds } from "@/constants/dungeons";
import { generateDungeonOpponents } from "@/dungeons/dungeonManager";
import { MonsterCardDisplay } from "./monsters/MonsterCardDisplay";
import { monsterImagesByName } from "@/constants/monsterImages";
import { useLanguage } from "@/hooks/useLanguage";
import { translateMonsterName, translateMonsterDescription, translateMonsterText } from "@/utils/monsterTranslations";

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
const MonsterCard = ({
  name,
  health,
  power,
  isBoss,
  image,
  specialAbilities,
  description
}: MonsterCardProps) => {
  return <MonsterCardDisplay name={name} health={health} power={power} isBoss={isBoss} image={image} specialAbilities={specialAbilities} description={description} />;
};
interface DungeonLevelProps {
  dungeonType: string;
  level: number;
}
const DungeonLevel = memo(({
  dungeonType,
  level
}: DungeonLevelProps) => {
  const { language } = useLanguage();
  
  const [opponents, setOpponents] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadOpponents = async () => {
      const baseOpponents = await generateDungeonOpponents(dungeonType as any, level);
      const enhanced = baseOpponents.map(opponent => ({
        ...opponent,
        image: monsterImagesByName[opponent.name] || opponent.image,
        description: monsterDescriptions[opponent.name],
        translatedName: translateMonsterName(language, opponent.name),
        translatedDescription: translateMonsterDescription(language, monsterDescriptions[opponent.name] || '')
      }));
      setOpponents(enhanced);
    };
    loadOpponents();
  }, [dungeonType, level, language]);

  return <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white border-b border-white/30 pb-2">
        {translateMonsterText(language, 'Уровень')} {level}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
        {opponents.map(opponent => <MonsterCard key={opponent.id} name={opponent.translatedName} health={opponent.health} power={opponent.power} isBoss={opponent.isBoss} image={opponent.image} specialAbilities={opponent.specialAbilities} description={opponent.translatedDescription} />)}
      </div>
    </div>;
});
DungeonLevel.displayName = 'DungeonLevel';
interface DungeonDetailProps {
  dungeonType: string;
  dungeonName: string;
}
const DungeonDetail = ({
  dungeonType,
  dungeonName
}: DungeonDetailProps) => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const { language } = useLanguage();
  const backgroundImage = dungeonBackgrounds[dungeonType as keyof typeof dungeonBackgrounds];
  return <div className="space-y-6">
      

      <Card variant="menu" className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-white">{translateMonsterText(language, 'Выберите уровень')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-6">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`p-2 rounded-3xl text-sm font-medium transition-colors ${selectedLevel === level ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {level}
              </button>
            ))}
          </div>
          
          <DungeonLevel dungeonType={dungeonType} level={selectedLevel} />
        </CardContent>
      </Card>
    </div>;
};
export const DungeonInfo = () => {
  const { language } = useLanguage();
  
  const availableDungeons = [{
    key: 'spider_nest',
    name: dungeonNames.spider_nest
  }];
  return <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{translateMonsterText(language, 'Гайд по подземельям')}</h2>
        <p className="text-white/80">
          {translateMonsterText(language, 'Изучите монстров, их способности и возможный дроп в каждом подземелье')}
        </p>
      </div>

      <Tabs defaultValue={availableDungeons[0]?.key} className="w-full">
        <TabsList className="grid w-full grid-cols-1 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl">
          {availableDungeons.map(dungeon => <TabsTrigger key={dungeon.key} value={dungeon.key} className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl">
              {dungeon.name}
            </TabsTrigger>)}
        </TabsList>

        {availableDungeons.map(dungeon => <TabsContent key={dungeon.key} value={dungeon.key} className="mt-6">
            <DungeonDetail dungeonType={dungeon.key} dungeonName={dungeon.name} />
          </TabsContent>)}
      </Tabs>
    </div>;
};