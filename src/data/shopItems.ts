import { ShopItem } from "@/components/shop/types";

// Worker images will be loaded from database via item_templates.image_url
const placeholderWorker = "/placeholder.svg";

export const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Колода карт",
    description: "Содержит 1 случайную карту героя или питомца",
    price: 1,
    type: "cardPack",
    value: 1,
    image: "/lovable-uploads/e523dce0-4cda-4d32-b4e2-ecec40b1eb39.png"
  },
  // Рабочие
  {
    id: 2,
    name: "Пылевой Батрак",
    description: "Обычный рабочий. Работает 2 часа, ускорение +10%",
    price: 5,
    type: "worker",
    value: 10, // процент ускорения
    stats: { workDuration: 7200000 }, // 2 часа в миллисекундах
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 3,
    name: "Угольный Носильщик",
    description: "Опытный рабочий. Работает 4 часа, ускорение +20%",
    price: 15,
    type: "worker",
    value: 20,
    stats: { workDuration: 14400000 }, // 4 часа
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 4,
    name: "Ремесленник",
    description: "Искусный рабочий. Работает 6 часов, ускорение +30%",
    price: 30,
    type: "worker",
    value: 30,
    stats: { workDuration: 21600000 }, // 6 часов
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 5,
    name: "Мастер",
    description: "Талантливый рабочий. Работает 8 часов, ускорение +40%",
    price: 50,
    type: "worker",
    value: 40,
    stats: { workDuration: 28800000 }, // 8 часов
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 6,
    name: "Архимастер",
    description: "Превосходный рабочий. Работает 12 часов, ускорение +50%",
    price: 80,
    type: "worker",
    value: 50,
    stats: { workDuration: 43200000 }, // 12 часов
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 7,
    name: "Гранд-мастер",
    description: "Легендарный рабочий. Работает 18 часов, ускорение +70%",
    price: 120,
    type: "worker",
    value: 70,
    stats: { workDuration: 64800000 }, // 18 часов
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 8,
    name: "Владыка ремесел",
    description: "Мифический рабочий. Работает 24 часа, ускорение +100%",
    price: 200,
    type: "worker",
    value: 100,
    stats: { workDuration: 86400000 }, // 24 часа
    image: placeholderWorker // Will be replaced with image_url from database
  },
  {
    id: 9,
    name: "Архонт мануфактур",
    description: "Божественный рабочий. Работает 48 часов, ускорение +150%",
    price: 400,
    type: "worker",
    value: 150,
    stats: { workDuration: 172800000 }, // 48 часов
    image: placeholderWorker // Will be replaced with image_url from database
  }
];
