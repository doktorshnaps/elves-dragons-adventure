import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sword, Shield, FlaskConical } from "lucide-react";

const dungeonInfo = [
  {
    name: "Логово Черного Дракона",
    description: "Древнее логово могущественного дракона, окутанное тьмой и опасностью.",
    enemies: [
      { name: "Черный дракон", description: "Могущественный босс с высоким уроном" },
      { name: "Драконий страж", description: "Элитный враг с повышенной защитой" },
      { name: "Драконид", description: "Обычный враг с средними характеристиками" }
    ],
    loot: [
      "Драконья чешуя (Редкая броня)",
      "Драконий клык (Редкое оружие)",
      "Большое зелье здоровья"
    ]
  },
  {
    name: "Пещеры Забытых Душ",
    description: "Мрачные пещеры, где блуждают души павших воинов.",
    enemies: [
      { name: "Призрачный лорд", description: "Босс с магическими атаками" },
      { name: "Потерянная душа", description: "Враг с высокой скоростью" },
      { name: "Скелет-воин", description: "Базовый враг ближнего боя" }
    ],
    loot: [
      "Призрачный клинок (Магическое оружие)",
      "Эфирная мантия (Магическая броня)",
      "Зелье защиты"
    ]
  },
  {
    name: "Трон Ледяного Короля",
    description: "Замерзший замок, где правит вечная мерзлота.",
    enemies: [
      { name: "Ледяной король", description: "Босс с замораживающими атаками" },
      { name: "Ледяной голем", description: "Элитный враг с высокой защитой" },
      { name: "Ледяной элементаль", description: "Магический враг дальнего боя" }
    ],
    loot: [
      "Корона льда (Редкий шлем)",
      "Морозный меч (Ледяное оружие)",
      "Зелье тепла"
    ]
  },
  {
    name: "Лабиринт Темного Мага",
    description: "Запутанный лабиринт, наполненный магическими ловушками.",
    enemies: [
      { name: "Темный маг", description: "Босс с мощными заклинаниями" },
      { name: "Чародей-ученик", description: "Маг среднего уровня" },
      { name: "Живая книга", description: "Летающий враг с магическими атаками" }
    ],
    loot: [
      "Посох мага (Магическое оружие)",
      "Мантия мудреца (Магическая броня)",
      "Свиток телепортации"
    ]
  },
  {
    name: "Гнездо Гигантских Пауков",
    description: "Огромная паутина, где обитают гигантские пауки.",
    enemies: [
      { name: "Королева пауков", description: "Босс с ядовитыми атаками" },
      { name: "Паук-охотник", description: "Быстрый враг с прыжками" },
      { name: "Паук-ткач", description: "Враг, создающий ловушки" }
    ],
    loot: [
      "Паучий шелк (Легкая броня)",
      "Ядовитый клинок (Отравленное оружие)",
      "Противоядие"
    ]
  },
  {
    name: "Темница Костяных Демонов",
    description: "Древняя темница, где заточены демонические существа.",
    enemies: [
      { name: "Костяной демон", description: "Босс с некромантией" },
      { name: "Демон-страж", description: "Элитный враг с высоким уроном" },
      { name: "Скелет-маг", description: "Враг с темной магией" }
    ],
    loot: [
      "Демоническая броня (Тяжелая броня)",
      "Костяной меч (Проклятое оружие)",
      "Зелье силы"
    ]
  },
  {
    name: "Логово Морского Змея",
    description: "Затопленные пещеры, где обитает древний морской змей.",
    enemies: [
      { name: "Морской змей", description: "Босс с водными атаками" },
      { name: "Сирена", description: "Магический враг с очарованием" },
      { name: "Глубинный охотник", description: "Быстрый подводный враг" }
    ],
    loot: [
      "Чешуя змея (Водная броня)",
      "Трезубец (Водное оружие)",
      "Зелье подводного дыхания"
    ]
  }
];

export const DungeonsList = () => {
  return (
    <Card 
      className="p-6 bg-game-surface border-game-accent mt-8 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/lovable-uploads/3f06ddee-c81d-4ca7-acdb-82145cff46ec.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Добавляем полупрозрачный оверлей для лучшей читаемости текста */}
      <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
      
      {/* Контент поверх оверлея */}
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-game-accent mb-4">Подземелья</h2>
        <Accordion type="single" collapsible className="w-full">
          {dungeonInfo.map((dungeon, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-game-accent hover:text-game-accent/80">
                {dungeon.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4">
                  <p className="text-gray-400">{dungeon.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-game-accent flex items-center gap-2">
                      <Sword className="w-4 h-4" />
                      Враги:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      {dungeon.enemies.map((enemy, i) => (
                        <li key={i}>
                          <span className="font-semibold">{enemy.name}</span> - {enemy.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-game-accent flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Добыча:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      {dungeon.loot.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Card>
  );
};