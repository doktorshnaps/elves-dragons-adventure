import { ShopItem } from "@/components/shop/types";
import { workerImagesById } from '@/constants/workerImages';

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
  // Рабочие - названия синхронизированы с БД
  {
    id: 2,
    name: "Пылевой Батрак",
    description: "Обычный рабочий. Работает 2 часа, ускорение +10%",
    price: 5,
    type: "worker",
    value: 10, // процент ускорения
    stats: { workDuration: 7200000 }, // 2 часа в миллисекундах
    image: workerImagesById[2]
  },
  {
    id: 3,
    name: "Угольный Носильщик",
    description: "Опытный рабочий. Работает 4 часа, ускорение +20%",
    price: 15,
    type: "worker",
    value: 20,
    stats: { workDuration: 14400000 }, // 4 часа
    image: workerImagesById[3]
  },
  {
    id: 4,
    name: "Ремесленник",
    description: "Искусный рабочий. Работает 6 часов, ускорение +30%",
    price: 30,
    type: "worker",
    value: 30,
    stats: { workDuration: 21600000 }, // 6 часов
    image: workerImagesById[4]
  },
  {
    id: 5,
    name: "Мастер",
    description: "Талантливый рабочий. Работает 8 часов, ускорение +40%",
    price: 50,
    type: "worker",
    value: 40,
    stats: { workDuration: 28800000 }, // 8 часов
    image: workerImagesById[5]
  },
  {
    id: 6,
    name: "Виртуоз",
    description: "Превосходный рабочий. Работает 12 часов, ускорение +60%",
    price: 80,
    type: "worker",
    value: 60,
    stats: { workDuration: 43200000 }, // 12 часов
    image: workerImagesById[6]
  },
  {
    id: 7,
    name: "Гроссмейстер", 
    description: "Легендарный рабочий. Работает 24 часа, ускорение +100%",
    price: 120,
    type: "worker",
    value: 100,
    stats: { workDuration: 86400000 }, // 24 часа
    image: workerImagesById[7]
  },
  {
    id: 8,
    name: "Владыка ремесел",
    description: "Мифический рабочий. Работает 24 часа, ускорение +100%",
    price: 200,
    type: "worker",
    value: 100,
    stats: { workDuration: 86400000 }, // 24 часа
    image: workerImagesById[8]
  },
  {
    id: 9,
    name: "Архонт мануфактур",
    description: "Божественный рабочий. Работает 48 часов, ускорение +150%",
    price: 400,
    type: "worker",
    value: 150,
    stats: { workDuration: 172800000 }, // 48 часов
    image: workerImagesById[9]
  }
];