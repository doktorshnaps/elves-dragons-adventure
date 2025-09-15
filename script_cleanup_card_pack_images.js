// Скрипт для очистки таблицы card_pack_images от несуществующих карт

import { cardDatabase } from './src/data/cardDatabase.js';

// Получаем все имена карт из актуальной базы
const validCardNames = new Set(cardDatabase.map(card => card.name));

console.log('Актуальные карты в базе данных:', validCardNames.size);
console.log('Список актуальных карт:');
[...validCardNames].sort().forEach(name => console.log('-', name));

// Карты из card_pack_images (из SQL запроса)
const cardPackImages = [
  "Архимаг Сильванести",
  "Бог Войны Аэлантира", 
  "Божественный Единорог",
  "Волчонок",
  "Вселенский Левиафан",
  "Грифон",
  "Древний Дракон",
  "Жрец Лиораса",
  "Капитан Элленара",
  "Король Тэлэриона",
  "Космический Дракон",
  "Лесной Дух",
  "Лорд Фаэлина",
  "Лучник Сильванести",
  "Маг Тэлэриона",
  "Молодой Воин Каледора",
  "Паладин Каледора",
  "Принц Элленара",
  "Рыцарь Аэлантира",
  "Создатель Лиораса",
  "Страж Фаэлина",
  "Феникс"
];

// Находим карты, которых нет в актуальной базе
const invalidCards = cardPackImages.filter(name => !validCardNames.has(name));

console.log('\nКарты для удаления:', invalidCards.length);
console.log('Список карт для удаления:');
invalidCards.forEach(name => console.log('-', name));

// Генерируем SQL для удаления
if (invalidCards.length > 0) {
  const sqlDelete = `DELETE FROM card_pack_images WHERE card_name IN (${invalidCards.map(name => `'${name}'`).join(', ')});`;
  console.log('\nSQL для удаления:');
  console.log(sqlDelete);
}