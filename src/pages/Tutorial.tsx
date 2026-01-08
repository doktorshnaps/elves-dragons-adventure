import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Swords,
  Shield,
  Hammer,
  MapPin,
  Users,
  Package,
  Crown,
  Heart,
  Sparkles,
  Gem,
  Building2,
  FlaskConical,
  ScrollText,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrightness } from "@/hooks/useBrightness";
import { usePageMeta } from "@/hooks/usePageTitle";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type TutorialSection =
  | "overview"
  | "cards"
  | "combat"
  | "dungeons"
  | "shelter"
  | "crafting"
  | "equipment"
  | "quests"
  | "resources";

interface SectionData {
  id: TutorialSection;
  icon: React.ReactNode;
  titleRu: string;
  titleEn: string;
  contentRu: React.ReactNode;
  contentEn: React.ReactNode;
}

export const Tutorial = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { brightness, backgroundBrightness } = useBrightness();
  const [activeSection, setActiveSection] = useState<TutorialSection>("overview");

  usePageMeta({
    title: language === "ru" ? "Обучение" : "Tutorial",
    description: language === "ru" ? "Полное руководство по игровым механикам" : "Complete guide to game mechanics",
  });

  const sections: SectionData[] = [
    {
      id: "overview",
      icon: <ScrollText className="w-5 h-5" />,
      titleRu: "Обзор игры",
      titleEn: "Game Overview",
      contentRu: (
        <div className="space-y-4">
          <p>
            Добро пожаловать в мир фэнтезийных карточных сражений! Эта игра сочетает в себе коллекционирование карт,
            стратегические бои и развитие базы.
          </p>

          <h4 className="font-bold text-yellow-400">Основные механики:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Карты:</strong> Собирайте героев и драконов разной редкости
            </li>
            <li>
              <strong>Подземелья:</strong> Проходите уровни и побеждайте монстров
            </li>
            <li>
              <strong>Убежище:</strong> Развивайте здания и производите ресурсы
            </li>
            <li>
              <strong>Крафт:</strong> Создавайте предметы и зелья
            </li>
            <li>
              <strong>Квесты:</strong> Выполняйте задания за награды
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Ресурсы:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>ELL:</strong> Основная игровая валюта
            </li>
            <li>
              <strong>Дерево, Камень:</strong> Ресурсы для строительства и крафта
            </li>
            <li>
              <strong>Предметы:</strong> Выпадают из монстров и создаются через крафт
            </li>
          </ul>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <p>
            Welcome to the world of fantasy card battles! This game combines card collecting, strategic combat, and base
            building.
          </p>

          <h4 className="font-bold text-yellow-400">Core Mechanics:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Cards:</strong> Collect heroes and dragons of different rarities
            </li>
            <li>
              <strong>Dungeons:</strong> Clear levels and defeat monsters
            </li>
            <li>
              <strong>Shelter:</strong> Develop buildings and produce resources
            </li>
            <li>
              <strong>Crafting:</strong> Create items and potions
            </li>
            <li>
              <strong>Quests:</strong> Complete tasks for rewards
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Resources:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>ELL:</strong> Main game currency
            </li>
            <li>
              <strong>Wood, Stone:</strong> Resources for building and crafting
            </li>
            <li>
              <strong>Items:</strong> Drop from monsters and created through crafting
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "cards",
      icon: <Crown className="w-5 h-5" />,
      titleRu: "Система карт",
      titleEn: "Card System",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Типы карт:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Герои:</strong> Основные боевые единицы. Каждый герой имеет класс и редкость, определяющие его силу.
            </li>
            <li>
              <strong>Драконы:</strong> Мощные питомцы с собственной системой классов.
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Редкость (1-8 звёзд):</h4>
          <p className="text-sm text-gray-300 mb-2">Редкость определяет базовый множитель характеристик карты:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li>⭐ 1 звезда (x1.0)</li>
            <li>⭐⭐ 2 звезды (x1.6)</li>
            <li>⭐⭐⭐ 3 звезды (x2.4)</li>
            <li>⭐⭐⭐⭐ 4 звезды (x3.4)</li>
            <li>⭐⭐⭐⭐⭐ 5 звёзд (x4.8)</li>
            <li>⭐⭐⭐⭐⭐⭐ 6 звёзд (x6.9)</li>
            <li>⭐⭐⭐⭐⭐⭐⭐ 7 звёзд (x10.0)</li>
            <li>⭐⭐⭐⭐⭐⭐⭐⭐ 8 звёзд (x8.0)</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Классы героев:</h4>
          <p className="text-sm text-gray-300 mb-2">Класс даёт дополнительный множитель ко всем характеристикам:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><strong>Рекрут</strong> (x1.0) — начальный класс</li>
            <li><strong>Страж</strong> (x1.2)</li>
            <li><strong>Ветеран</strong> (x1.5)</li>
            <li><strong>Чародей</strong> (x1.8)</li>
            <li><strong>Мастер Целитель</strong> (x2.0)</li>
            <li><strong>Защитник</strong> (x2.3)</li>
            <li><strong>Ветеран Защитник</strong> (x2.6)</li>
            <li><strong>Стратег</strong> (x3.0)</li>
            <li><strong>Верховный Стратег</strong> (x3.5)</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Классы драконов:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><strong>Обычный</strong> (x1.0)</li>
            <li><strong>Необычный</strong> (x1.2)</li>
            <li><strong>Редкий</strong> (x1.5)</li>
            <li><strong>Эпический</strong> (x1.8)</li>
            <li><strong>Легендарный</strong> (x2.1)</li>
            <li><strong>Мифический</strong> (x2.5)</li>
            <li><strong>Этернал</strong> (x3.0)</li>
            <li><strong>Империал</strong> (x3.6)</li>
            <li><strong>Титан</strong> (x4.2)</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Расчёт характеристик:</h4>
          <p className="text-sm text-gray-300">
            Итоговые характеристики = Базовые × Множитель редкости × Множитель класса
          </p>

          <h4 className="font-bold text-yellow-400 mt-4">Характеристики:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><strong>Здоровье (HP):</strong> Количество урона, которое может выдержать карта</li>
            <li><strong>Сила:</strong> Физический урон в бою</li>
            <li><strong>Защита:</strong> Снижает получаемый урон</li>
            <li><strong>Магия:</strong> Магический урон и эффекты</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Фракции и стихии:</h4>
          <p className="text-sm text-gray-300">
            Каждая карта принадлежит к определённой фракции. Стихии взаимодействуют по принципу камень-ножницы-бумага,
            давая бонусы или штрафы к урону.
          </p>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Card Types:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Heroes:</strong> Main combat units. Each hero has a class and rarity that determine their power.
            </li>
            <li>
              <strong>Dragons:</strong> Powerful pets with their own class system.
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Rarity (1-8 stars):</h4>
          <p className="text-sm text-gray-300 mb-2">Rarity determines the base stat multiplier:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li>⭐ 1 star (x1.0)</li>
            <li>⭐⭐ 2 stars (x1.6)</li>
            <li>⭐⭐⭐ 3 stars (x2.4)</li>
            <li>⭐⭐⭐⭐ 4 stars (x3.4)</li>
            <li>⭐⭐⭐⭐⭐ 5 stars (x4.8)</li>
            <li>⭐⭐⭐⭐⭐⭐ 6 stars (x6.9)</li>
            <li>⭐⭐⭐⭐⭐⭐⭐ 7 stars (x10.0)</li>
            <li>⭐⭐⭐⭐⭐⭐⭐⭐ 8 stars (x8.0)</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Hero Classes:</h4>
          <p className="text-sm text-gray-300 mb-2">Class provides an additional multiplier to all stats:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><strong>Recruit</strong> (x1.0) — starting class</li>
            <li><strong>Guardian</strong> (x1.2)</li>
            <li><strong>Veteran</strong> (x1.5)</li>
            <li><strong>Sorcerer</strong> (x1.8)</li>
            <li><strong>Master Healer</strong> (x2.0)</li>
            <li><strong>Defender</strong> (x2.3)</li>
            <li><strong>Veteran Defender</strong> (x2.6)</li>
            <li><strong>Strategist</strong> (x3.0)</li>
            <li><strong>Supreme Strategist</strong> (x3.5)</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Dragon Classes:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><strong>Common</strong> (x1.0)</li>
            <li><strong>Uncommon</strong> (x1.2)</li>
            <li><strong>Rare</strong> (x1.5)</li>
            <li><strong>Epic</strong> (x1.8)</li>
            <li><strong>Legendary</strong> (x2.1)</li>
            <li><strong>Mythic</strong> (x2.5)</li>
            <li><strong>Eternal</strong> (x3.0)</li>
            <li><strong>Imperial</strong> (x3.6)</li>
            <li><strong>Titan</strong> (x4.2)</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Stat Calculation:</h4>
          <p className="text-sm text-gray-300">
            Final Stats = Base × Rarity Multiplier × Class Multiplier
          </p>

          <h4 className="font-bold text-yellow-400 mt-4">Stats:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><strong>Health (HP):</strong> Amount of damage the card can take</li>
            <li><strong>Power:</strong> Physical damage in combat</li>
            <li><strong>Defense:</strong> Reduces incoming damage</li>
            <li><strong>Magic:</strong> Magical damage and effects</li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Factions and Elements:</h4>
          <p className="text-sm text-gray-300">
            Each card belongs to a specific faction. Elements interact in a rock-paper-scissors manner, giving damage
            bonuses or penalties.
          </p>
        </div>
      ),
    },
    {
      id: "combat",
      icon: <Swords className="w-5 h-5" />,
      titleRu: "Боевая система",
      titleEn: "Combat System",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Формирование команды:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Выберите до 3 героев и 1 дракона в команду</li>
            <li>Перетаскивайте карты для изменения позиции</li>
            <li>Первый герой в списке атакует первым</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Механика боя:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Атака:</strong> Герой наносит урон монстру (Сила + Магия - Защита врага)
            </li>
            <li>
              <strong>Защита:</strong> Монстр контратакует, ваша защита снижает урон
            </li>
            <li>
              <strong>Элементальные бонусы:</strong> +20% урона против слабой стихии, -20% против сильной
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Смерть и восстановление:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Когда HP героя падает до 0, он выбывает из боя</li>
            <li>После боя раненых можно лечить в Медпункте</li>
            <li>Используйте зелья здоровья для мгновенного восстановления</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Награды:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>ELL за каждого побеждённого монстра</li>
            <li>Опыт для повышения уровня аккаунта</li>
            <li>Шанс выпадения предметов и материалов</li>
            <li>Счётчик убийств монстров для улучшения карт</li>
          </ul>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Team Formation:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Select up to 3 heroes and 1 dragon for your team</li>
            <li>Drag cards to change positions</li>
            <li>First hero in the list attacks first</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Combat Mechanics:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Attack:</strong> Hero deals damage to monster (Power + Magic - Enemy Defense)
            </li>
            <li>
              <strong>Defense:</strong> Monster counterattacks, your defense reduces damage
            </li>
            <li>
              <strong>Elemental bonuses:</strong> +20% damage against weak element, -20% against strong
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Death and Recovery:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>When hero's HP drops to 0, they're knocked out</li>
            <li>Wounded heroes can be healed in Medical Bay after battle</li>
            <li>Use health potions for instant recovery</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Rewards:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>ELL for each defeated monster</li>
            <li>Experience for account level</li>
            <li>Chance for item and material drops</li>
            <li>Monster kill counter for card upgrades</li>
          </ul>
        </div>
      ),
    },
    {
      id: "dungeons",
      icon: <MapPin className="w-5 h-5" />,
      titleRu: "Подземелья",
      titleEn: "Dungeons",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Подземелья и их стихии:</h4>
          <ul className="list-disc list-inside space-y-3 ml-2">
            <li>
              <strong>Паучье гнездо:</strong> Природа 🌿 —{" "}
              <span className="text-green-400">лучше: Сильванести (Огонь 🔥)</span>,{" "}
              <span className="text-red-400">хуже: Азлантир (Земля 🪨)</span>
            </li>
            <li>
              <strong>Костяное подземелье:</strong> Земля 🪨 —{" "}
              <span className="text-green-400">лучше: Лиорас (Природа 🌿)</span>,{" "}
              <span className="text-red-400">хуже: Каледор (Лёд ❄️)</span>
            </li>
            <li>
              <strong>Тёмный маг:</strong> Тьма 💀 — <span className="text-green-400">лучше: Элленар (Свет ✨)</span>,{" "}
              <span className="text-red-400">хуже: Лиорас (Природа 🌿)</span>
            </li>
            <li>
              <strong>Забытые души:</strong> Тьма 💀 — <span className="text-green-400">лучше: Элленар (Свет ✨)</span>,{" "}
              <span className="text-red-400">хуже: Лиорас (Природа 🌿)</span>
            </li>
            <li>
              <strong>Ледяной трон:</strong> Лёд ❄️ — <span className="text-green-400">лучше: Азлантир (Земля 🪨)</span>
              , <span className="text-red-400">хуже: Фаэлин (Вода 💧)</span>
            </li>
            <li>
              <strong>Морской змей:</strong> Вода 💧 — <span className="text-green-400">лучше: Каледор (Лёд ❄️)</span>,{" "}
              <span className="text-red-400">хуже: Сильванести (Огонь 🔥)</span>
            </li>
            <li>
              <strong>Логово дракона:</strong> Огонь 🔥 —{" "}
              <span className="text-green-400">лучше: Фаэлин (Вода 💧)</span>,{" "}
              <span className="text-red-400">хуже: Тэларион (Тьма 💀)</span>
            </li>
            <li>
              <strong>Пантеон богов:</strong> Свет ✨ —{" "}
              <span className="text-green-400">лучше: Тэларион (Тьма 💀)</span>,{" "}
              <span className="text-red-400">хуже: Элленар (Свет ✨)</span>
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Фракции и стихии:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-white/20 rounded">
              <thead>
                <tr className="bg-white/10">
                  <th className="px-3 py-2 text-left">Фракция</th>
                  <th className="px-3 py-2 text-left">Стихия</th>
                  <th className="px-3 py-2 text-left text-green-400">Силён против</th>
                  <th className="px-3 py-2 text-left text-red-400">Слаб против</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-3 py-2">Каледор</td>
                  <td className="px-3 py-2">Лёд ❄️</td>
                  <td className="px-3 py-2">Вода 💧</td>
                  <td className="px-3 py-2">Земля 🪨</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Сильванести</td>
                  <td className="px-3 py-2">Огонь 🔥</td>
                  <td className="px-3 py-2">Природа 🌿</td>
                  <td className="px-3 py-2">Вода 💧</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Фаэлин</td>
                  <td className="px-3 py-2">Вода 💧</td>
                  <td className="px-3 py-2">Огонь 🔥</td>
                  <td className="px-3 py-2">Лёд ❄️</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Элленар</td>
                  <td className="px-3 py-2">Свет ✨</td>
                  <td className="px-3 py-2">Тьма 💀</td>
                  <td className="px-3 py-2">Земля 🪨</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Тэларион</td>
                  <td className="px-3 py-2">Тьма 💀</td>
                  <td className="px-3 py-2">Свет ✨</td>
                  <td className="px-3 py-2">Огонь 🔥</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Азлантир</td>
                  <td className="px-3 py-2">Земля 🪨</td>
                  <td className="px-3 py-2">Лёд ❄️</td>
                  <td className="px-3 py-2">Природа 🌿</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Лиорас</td>
                  <td className="px-3 py-2">Природа 🌿</td>
                  <td className="px-3 py-2">Земля 🪨</td>
                  <td className="px-3 py-2">Тьма 💀</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-bold text-yellow-400 mt-4">Структура подземелья:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Каждое подземелье имеет 100 уровней</li>
            <li>Сложность растёт с каждым уровнем</li>
            <li>
              Каждые <strong>10 уровней</strong> — мини-босс
            </li>
            <li>
              На <strong>50 и 100 уровнях</strong> — главные боссы
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">⚠️ Важно о прогрессе:</h4>
          <p className="text-red-300">
            Прогресс в подземелье <strong>НЕ сохраняется</strong>. Если вы покинете подземелье, вам придётся начать
            сначала!
          </p>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Dungeons and Elements:</h4>
          <ul className="list-disc list-inside space-y-3 ml-2">
            <li>
              <strong>Spider Nest:</strong> Nature 🌿 —{" "}
              <span className="text-green-400">best: Silvanesti (Fire 🔥)</span>,{" "}
              <span className="text-red-400">worst: Azlantir (Earth 🪨)</span>
            </li>
            <li>
              <strong>Bone Dungeon:</strong> Earth 🪨 — <span className="text-green-400">best: Lioras (Nature 🌿)</span>
              , <span className="text-red-400">worst: Kaledor (Ice ❄️)</span>
            </li>
            <li>
              <strong>Dark Mage:</strong> Dark 💀 — <span className="text-green-400">best: Ellenar (Light ✨)</span>,{" "}
              <span className="text-red-400">worst: Lioras (Nature 🌿)</span>
            </li>
            <li>
              <strong>Forgotten Souls:</strong> Dark 💀 —{" "}
              <span className="text-green-400">best: Ellenar (Light ✨)</span>,{" "}
              <span className="text-red-400">worst: Lioras (Nature 🌿)</span>
            </li>
            <li>
              <strong>Icy Throne:</strong> Ice ❄️ — <span className="text-green-400">best: Azlantir (Earth 🪨)</span>,{" "}
              <span className="text-red-400">worst: Faelin (Water 💧)</span>
            </li>
            <li>
              <strong>Sea Serpent:</strong> Water 💧 — <span className="text-green-400">best: Kaledor (Ice ❄️)</span>,{" "}
              <span className="text-red-400">worst: Silvanesti (Fire 🔥)</span>
            </li>
            <li>
              <strong>Dragon Lair:</strong> Fire 🔥 — <span className="text-green-400">best: Faelin (Water 💧)</span>,{" "}
              <span className="text-red-400">worst: Telarion (Dark 💀)</span>
            </li>
            <li>
              <strong>Pantheon of Gods:</strong> Light ✨ —{" "}
              <span className="text-green-400">best: Telarion (Dark 💀)</span>,{" "}
              <span className="text-red-400">worst: Ellenar (Light ✨)</span>
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">Factions and Elements:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-white/20 rounded">
              <thead>
                <tr className="bg-white/10">
                  <th className="px-3 py-2 text-left">Faction</th>
                  <th className="px-3 py-2 text-left">Element</th>
                  <th className="px-3 py-2 text-left text-green-400">Strong vs</th>
                  <th className="px-3 py-2 text-left text-red-400">Weak vs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-3 py-2">Kaledor</td>
                  <td className="px-3 py-2">Ice ❄️</td>
                  <td className="px-3 py-2">Water 💧</td>
                  <td className="px-3 py-2">Earth 🪨</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Silvanesti</td>
                  <td className="px-3 py-2">Fire 🔥</td>
                  <td className="px-3 py-2">Nature 🌿</td>
                  <td className="px-3 py-2">Water 💧</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Faelin</td>
                  <td className="px-3 py-2">Water 💧</td>
                  <td className="px-3 py-2">Fire 🔥</td>
                  <td className="px-3 py-2">Ice ❄️</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Ellenar</td>
                  <td className="px-3 py-2">Light ✨</td>
                  <td className="px-3 py-2">Dark 💀</td>
                  <td className="px-3 py-2">Earth 🪨</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Telarion</td>
                  <td className="px-3 py-2">Dark 💀</td>
                  <td className="px-3 py-2">Light ✨</td>
                  <td className="px-3 py-2">Fire 🔥</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Azlantir</td>
                  <td className="px-3 py-2">Earth 🪨</td>
                  <td className="px-3 py-2">Ice ❄️</td>
                  <td className="px-3 py-2">Nature 🌿</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Lioras</td>
                  <td className="px-3 py-2">Nature 🌿</td>
                  <td className="px-3 py-2">Earth 🪨</td>
                  <td className="px-3 py-2">Dark 💀</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-bold text-yellow-400 mt-4">Dungeon Structure:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Each dungeon has infinite levels</li>
            <li>Difficulty increases with each level</li>
            <li>
              Every <strong>10 levels</strong> — mini-boss
            </li>
            <li>
              At <strong>levels 50 and 100</strong> — main bosses
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400 mt-4">⚠️ Important about Progress:</h4>
          <p className="text-red-300">
            Dungeon progress is <strong>NOT saved</strong>. If you leave the dungeon, you will have to start over!
          </p>
        </div>
      ),
    },
    {
      id: "shelter",
      icon: <Building2 className="w-5 h-5" />,
      titleRu: "Убежище",
      titleEn: "Shelter",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Здания:</h4>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="main-hall" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🏛️ Главный Зал</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Центральное здание убежища. Определяет максимальный уровень других зданий.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> +20 слотов инвентаря за уровень
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sawmill" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🪓 Лесопилка</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Производит дерево для строительства.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> +10 дерева в час за уровень
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quarry" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">⛏️ Каменоломня</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Добывает камень для укреплений.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> +8 камня в час за уровень
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="barracks" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">⚔️ Казармы</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Позволяет улучшать героев, объединяя двух одинаковых.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> Разблокирует улучшение до более высокой редкости
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dragon-lair" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🐉 Драконье Логово</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Позволяет улучшать драконов.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> Разблокирует улучшение драконов до более высокой редкости
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="medical" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🏥 Медпункт</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Восстанавливает здоровье раненых карт со временем.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> Увеличивает скорость лечения
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="forge" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🔨 Кузница</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Восстанавливает защиту повреждённых карт.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> Увеличивает скорость ремонта
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="workshop" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🛠️ Мастерская</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Позволяет создавать предметы из материалов.</p>
                <p className="mt-2">
                  <strong>Бонус:</strong> Разблокирует новые рецепты крафта
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <h4 className="font-bold text-yellow-400 mt-4">Рабочие:</h4>
          <p>
            Рабочих можно купить в магазине и назначить на здания для ускорения производства. После окончания времени
            работы рабочий исчезает.
          </p>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Buildings:</h4>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="main-hall" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🏛️ Main Hall</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Central building of the shelter. Determines max level of other buildings.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> +20 inventory slots per level
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sawmill" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🪓 Sawmill</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Produces wood for construction.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> +10 wood per hour per level
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quarry" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">⛏️ Quarry</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Mines stone for fortifications.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> +8 stone per hour per level
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="barracks" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">⚔️ Barracks</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Allows upgrading heroes by merging two identical ones.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> Unlocks upgrade to higher rarity
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dragon-lair" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🐉 Dragon Lair</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Allows upgrading dragons.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> Unlocks dragon upgrade to higher rarity
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="medical" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🏥 Medical Bay</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Restores health of wounded cards over time.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> Increases healing speed
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="forge" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🔨 Forge</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Repairs defense of damaged cards.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> Increases repair speed
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="workshop" className="border-white/20">
              <AccordionTrigger className="text-yellow-300 hover:text-yellow-200">🛠️ Workshop</AccordionTrigger>
              <AccordionContent className="text-white/90">
                <p>Allows crafting items from materials.</p>
                <p className="mt-2">
                  <strong>Bonus:</strong> Unlocks new crafting recipes
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <h4 className="font-bold text-yellow-400 mt-4">Workers:</h4>
          <p>
            Workers can be purchased in the shop and assigned to buildings to speed up production. After work time ends,
            the worker disappears.
          </p>
        </div>
      ),
    },
    {
      id: "crafting",
      icon: <Hammer className="w-5 h-5" />,
      titleRu: "Система крафта",
      titleEn: "Crafting System",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Как работает крафт:</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Постройте Мастерскую в Убежище</li>
            <li>Соберите необходимые материалы (из подземелий или производства)</li>
            <li>Выберите рецепт в разделе "Крафт"</li>
            <li>Подождите время создания</li>
            <li>Заберите готовый предмет</li>
          </ol>

          <h4 className="font-bold text-yellow-400">Категории предметов:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Зелья:</strong> Восстанавливают здоровье, усиливают характеристики
            </li>
            <li>
              <strong>Оружие:</strong> Увеличивает силу атаки
            </li>
            <li>
              <strong>Броня:</strong> Увеличивает защиту
            </li>
            <li>
              <strong>Аксессуары:</strong> Различные бонусы
            </li>
            <li>
              <strong>Материалы:</strong> Используются для других рецептов
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Советы:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Улучшайте Мастерскую для доступа к редким рецептам</li>
            <li>Запускайте несколько крафтов одновременно</li>
            <li>Рабочие ускоряют время создания</li>
          </ul>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">How Crafting Works:</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Build a Workshop in the Shelter</li>
            <li>Gather required materials (from dungeons or production)</li>
            <li>Select a recipe in the "Crafting" section</li>
            <li>Wait for crafting time</li>
            <li>Collect the finished item</li>
          </ol>

          <h4 className="font-bold text-yellow-400">Item Categories:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Potions:</strong> Restore health, boost stats
            </li>
            <li>
              <strong>Weapons:</strong> Increase attack power
            </li>
            <li>
              <strong>Armor:</strong> Increase defense
            </li>
            <li>
              <strong>Accessories:</strong> Various bonuses
            </li>
            <li>
              <strong>Materials:</strong> Used for other recipes
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Tips:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Upgrade Workshop for access to rare recipes</li>
            <li>Run multiple crafts simultaneously</li>
            <li>Workers speed up crafting time</li>
          </ul>
        </div>
      ),
    },
    {
      id: "equipment",
      icon: <Shield className="w-5 h-5" />,
      titleRu: "Снаряжение",
      titleEn: "Equipment",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Слоты снаряжения:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Оружие:</strong> Бонус к силе и магии
            </li>
            <li>
              <strong>Броня:</strong> Бонус к защите и здоровью
            </li>
            <li>
              <strong>Аксессуар:</strong> Различные бонусы
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Редкость снаряжения:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li className="text-gray-300">Обычное - белый</li>
            <li className="text-green-400">Необычное - зелёный</li>
            <li className="text-blue-400">Редкое - синий</li>
            <li className="text-purple-400">Эпическое - фиолетовый</li>
            <li className="text-yellow-400">Легендарное - золотой</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Как получить:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Выпадает из монстров в подземельях</li>
            <li>Создаётся в Мастерской</li>
            <li>Покупается в Магазине</li>
            <li>Награда за квесты</li>
          </ul>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Equipment Slots:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Weapon:</strong> Power and magic bonus
            </li>
            <li>
              <strong>Armor:</strong> Defense and health bonus
            </li>
            <li>
              <strong>Accessory:</strong> Various bonuses
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Equipment Rarity:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li className="text-gray-300">Common - white</li>
            <li className="text-green-400">Uncommon - green</li>
            <li className="text-blue-400">Rare - blue</li>
            <li className="text-purple-400">Epic - purple</li>
            <li className="text-yellow-400">Legendary - gold</li>
          </ul>

          <h4 className="font-bold text-yellow-400">How to Obtain:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Drops from dungeon monsters</li>
            <li>Crafted in Workshop</li>
            <li>Purchased in Shop</li>
            <li>Quest rewards</li>
          </ul>
        </div>
      ),
    },
    {
      id: "quests",
      icon: <Sparkles className="w-5 h-5" />,
      titleRu: "Квесты",
      titleEn: "Quests",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Типы квестов:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Социальные:</strong> Подписка на соцсети, приглашение друзей
            </li>
            <li>
              <strong>Игровые:</strong> Достижения в подземельях, сбор ресурсов
            </li>
            <li>
              <strong>Ежедневные:</strong> Обновляются каждый день
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Награды:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>ELL - игровая валюта</li>
            <li>Предметы и материалы</li>
            <li>Карточки героев и драконов</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Реферальная система:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Приглашайте друзей по вашей уникальной ссылке</li>
            <li>Получайте % от заработка приглашённых</li>
            <li>Многоуровневая система до 3-го уровня</li>
          </ul>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Quest Types:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Social:</strong> Follow social media, invite friends
            </li>
            <li>
              <strong>Game:</strong> Dungeon achievements, resource gathering
            </li>
            <li>
              <strong>Daily:</strong> Reset every day
            </li>
          </ul>

          <h4 className="font-bold text-yellow-400">Rewards:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>ELL - game currency</li>
            <li>Items and materials</li>
            <li>Hero and dragon cards</li>
          </ul>

          <h4 className="font-bold text-yellow-400">Referral System:</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Invite friends using your unique link</li>
            <li>Earn % from invited players' earnings</li>
            <li>Multi-level system up to 3rd tier</li>
          </ul>
        </div>
      ),
    },
    {
      id: "resources",
      icon: <Gem className="w-5 h-5" />,
      titleRu: "Ресурсы",
      titleEn: "Resources",
      contentRu: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Игровые ресурсы:</h4>

          <div className="grid gap-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 font-bold">💰 ELL</span>
              </div>
              <p className="text-sm">Основная валюта. Используется для покупок в магазине и улучшений.</p>
              <p className="text-xs text-white/60 mt-1">Получение: подземелья, квесты</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-600 font-bold">🪵 Дерево</span>
              </div>
              <p className="text-sm">Базовый ресурс для строительства и крафта.</p>
              <p className="text-xs text-white/60 mt-1">Получение: Лесопилка</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400 font-bold">🪨 Камень</span>
              </div>
              <p className="text-sm">Ресурс для укреплений, зданий и крафта.</p>
              <p className="text-xs text-white/60 mt-1">Получение: Каменоломня</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-400 font-bold">📦 Предметы</span>
              </div>
              <p className="text-sm">Различные материалы и расходники для крафта и улучшений.</p>
              <p className="text-xs text-white/60 mt-1">Получение: выпадают из монстров в подземельях, создаются через крафт</p>
            </div>
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <h4 className="font-bold text-yellow-400">Game Resources:</h4>

          <div className="grid gap-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 font-bold">💰 ELL</span>
              </div>
              <p className="text-sm">Main currency. Used for shop purchases and upgrades.</p>
              <p className="text-xs text-white/60 mt-1">Obtained: dungeons, quests</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-600 font-bold">🪵 Wood</span>
              </div>
              <p className="text-sm">Basic resource for building and crafting.</p>
              <p className="text-xs text-white/60 mt-1">Obtained: Sawmill</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400 font-bold">🪨 Stone</span>
              </div>
              <p className="text-sm">Resource for fortifications, buildings and crafting.</p>
              <p className="text-xs text-white/60 mt-1">Obtained: Quarry</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-400 font-bold">📦 Items</span>
              </div>
              <p className="text-sm">Various materials and consumables for crafting and upgrades.</p>
              <p className="text-xs text-white/60 mt-1">Obtained: drop from monsters in dungeons, created through crafting</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen p-4 relative" style={{ filter: `brightness(${brightness}%)` }}>
      {/* Background */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/menu-background.webp")',
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: `brightness(${backgroundBrightness}%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/50" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/menu")}
          className="bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 backdrop-blur-sm"
          style={{ boxShadow: "-10px 10px 8px rgba(0, 0, 0, 0.4)" }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === "ru" ? "Назад" : "Back"}
        </Button>
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
          {language === "ru" ? "📚 Обучение" : "📚 Tutorial"}
        </h1>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-4">
        {/* Sidebar - Section Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div
            className="bg-black/60 border-2 border-white rounded-3xl p-4 backdrop-blur-sm"
            style={{ boxShadow: "-15px 15px 10px rgba(0, 0, 0, 0.5)" }}
          >
            <h2 className="text-lg font-bold text-white mb-4 text-center">
              {language === "ru" ? "Разделы" : "Sections"}
            </h2>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
                    activeSection === section.id
                      ? "bg-yellow-500/30 border-2 border-yellow-400 text-yellow-300"
                      : "bg-white/10 border-2 border-white/30 text-white hover:bg-white/20"
                  }`}
                >
                  {section.icon}
                  <span className="text-sm font-medium">{language === "ru" ? section.titleRu : section.titleEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div
            className="bg-black/60 border-2 border-white rounded-3xl p-6 backdrop-blur-sm min-h-[500px]"
            style={{ boxShadow: "-15px 15px 10px rgba(0, 0, 0, 0.5)" }}
          >
            {currentSection && (
              <>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20">
                  <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-400">{currentSection.icon}</div>
                  <h2 className="text-2xl font-bold text-white">
                    {language === "ru" ? currentSection.titleRu : currentSection.titleEn}
                  </h2>
                </div>

                <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                  <div className="text-white/90 leading-relaxed">
                    {language === "ru" ? currentSection.contentRu : currentSection.contentEn}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
