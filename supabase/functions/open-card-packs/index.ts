import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardInfo {
  name: string;
  type: 'character' | 'pet';
  image: string;
  faction: string;
}

// Simplified card database (основные карты из каждой фракции)
const cardDatabase: CardInfo[] = [
  // Kaledor Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/6ba29742-0bdb-477e-924e-c97d968909f4.png', faction: 'Каледор' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/f3a95c8d-26a1-43ce-86ff-01a8aba5bb95.png', faction: 'Каледор' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/64ceab84-8336-40e0-9219-31f4e51ea217.png', faction: 'Каледор' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/20f876ac-c5a5-48c5-8d7c-a4cbcb5e3af7.png', faction: 'Каледор' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/6ba29742-0bdb-477e-924e-c97d968909f4.png', faction: 'Каледор' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/f3a95c8d-26a1-43ce-86ff-01a8aba5bb95.png', faction: 'Каледор' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/64ceab84-8336-40e0-9219-31f4e51ea217.png', faction: 'Каледор' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/a67b0362-c82a-4564-99e8-8776f6bf6591.png', faction: 'Каледор' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/a67b0362-c82a-4564-99e8-8776f6bf6591.png', faction: 'Каледор' },
  
  // Kaledor Dragons
  { name: 'Обычный ледяной дракон', type: 'pet', image: '/lovable-uploads/a684a167-5ab8-4c2c-916e-c1e2b2c7a335.png', faction: 'Каледор' },
  { name: 'Необычный ледяной дракон', type: 'pet', image: '/lovable-uploads/dec21ec3-c2d5-41c0-bb9b-991822a2e180.png', faction: 'Каледор' },
  { name: 'Редкий ледяной дракон', type: 'pet', image: '/lovable-uploads/6e94c9a2-5307-4802-8e31-dc179c870b4b.png', faction: 'Каледор' },
  { name: 'Эпический ледяной дракон', type: 'pet', image: '/lovable-uploads/ce617343-8823-428c-b91d-8f847977046a.png', faction: 'Каледор' },
  { name: 'Легендарный ледяной дракон', type: 'pet', image: '/lovable-uploads/1c428823-cebc-41ea-a9c0-6f741e5ae1ae.png', faction: 'Каледор' },
  { name: 'Мифический ледяной дракон', type: 'pet', image: '/lovable-uploads/3eab57b0-ee8f-4abf-bedc-fb4ae9384d33.png', faction: 'Каледор' },
  { name: 'Этернал ледяной дракон', type: 'pet', image: '/lovable-uploads/d9fed790-128c-40f2-b174-66bff52f9028.png', faction: 'Каледор' },
  { name: 'Империал ледяной дракон', type: 'pet', image: '/lovable-uploads/9f15a393-34df-4a04-9fc8-31b2aa858458.png', faction: 'Каледор' },
  { name: 'Титан ледяной дракон', type: 'pet', image: '/lovable-uploads/372deb79-915d-44a2-ab23-ef5e9e85252d.png', faction: 'Каледор' },
  
  // Sylvanesti Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/1f4e533a-06b4-4168-8645-92c4dfcc0f83.png', faction: 'Сильванести' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/204989a1-fd9e-46a4-bb1f-7a37c2003992.png', faction: 'Сильванести' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/8315d200-d3f6-4f47-a192-ae3b8bbe256c.png', faction: 'Сильванести' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/352e8041-3c0d-47b6-a1a0-17fdcc215e39.png', faction: 'Сильванести' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/51123039-7d7c-4e6e-af8a-fe4af77daeae.png', faction: 'Сильванести' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/f4d36e40-0f18-44c6-be2f-00485663b1f4.png', faction: 'Сильванести' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/9d1badd7-dc8d-483f-ab61-cad6de839eda.png', faction: 'Сильванести' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/1935aa54-a23e-4c99-84bf-dff3404feb2d.png', faction: 'Сильванести' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/981732c0-c6c4-41bf-9eff-e1dc31c3e000.png', faction: 'Сильванести' },
  
  // Sylvanesti Dragons
  { name: 'Обычный лесной дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'Сильванести' },
  { name: 'Необычный лесной дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'Сильванести' },
  { name: 'Эпический лесной дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'Сильванести' },
  
  // Faelin Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/5fed4049-637c-47a4-a2b1-3f1c9151ce6a.png', faction: 'Фаэлин' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/a2bf6e6b-c3ad-4919-812d-26f61b1660d4.png', faction: 'Фаэлин' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/4de24dee-aa59-49c8-a22e-77f9172110c0.png', faction: 'Фаэлин' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/1ea2379e-5c9b-40ce-bbd1-d8a667459a6e.png', faction: 'Фаэлин' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/7d20bcae-86a0-404c-a63e-0a40cab478ea.png', faction: 'Фаэлин' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/beb0976f-7d76-4165-ba28-ac63df8ac3ed.png', faction: 'Фаэлин' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/412adee5-aa9d-4f82-aef6-010e7396639e.png', faction: 'Фаэлин' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/c6a95c40-c402-46b6-b21a-0051de7364bd.png', faction: 'Фаэлин' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/3070cb69-0e5b-4302-bb5a-58fca3176ad8.png', faction: 'Фаэлин' },
  
  // Faelin Dragons
  { name: 'Обычный водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'Фаэлин' },
  { name: 'Эпический водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'Фаэлин' },
  { name: 'Легендарный водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'Фаэлин' },
  
  // Ellenar Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/1ef80899-e4c6-4721-8a05-de94e0c343dc.png', faction: 'Элленар' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/4c023e71-6d34-4e86-b1a3-9f78ba68b271.png', faction: 'Элленар' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/8dd620ce-c00a-4c42-97bf-c10a0aabdef4.png', faction: 'Элленар' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/2e4cba48-e157-417d-9e50-df04a49583c1.png', faction: 'Элленар' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/24850ede-c373-48b8-850b-519991a60829.png', faction: 'Элленар' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/f40bd001-d7bb-4095-9c90-9bf654618564.png', faction: 'Элленар' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/7e48953b-db9f-4c0e-8e8c-b76c055cd4c3.png', faction: 'Элленар' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/3d3c8ebd-a4a2-4ad4-a623-866f1bb0287b.png', faction: 'Элленар' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/f32f0976-8067-4774-a02d-776393efc5e5.png', faction: 'Элленар' },
  
  // Ellenar Dragons
  { name: 'Обычный земной дракон', type: 'pet', image: '/lovable-uploads/58195e56-c35c-4a7b-8868-c3a29d8e7c0c.png', faction: 'Элленар' },
  { name: 'Редкий земной дракон', type: 'pet', image: '/lovable-uploads/58195e56-c35c-4a7b-8868-c3a29d8e7c0c.png', faction: 'Элленар' },
  { name: 'Легендарный земной дракон', type: 'pet', image: '/lovable-uploads/58195e56-c35c-4a7b-8868-c3a29d8e7c0c.png', faction: 'Элленар' },
  
  // Telerion Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/9278c174-0cbd-4e3e-ae12-3d267733ff2c.png', faction: 'Тэлэрион' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/bb1c95ac-b19a-41d3-ab68-528e33af9303.png', faction: 'Тэлэрион' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/c12f7db9-7813-49e4-ad83-e8f0e436c186.png', faction: 'Тэлэрион' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/51ce0d6f-97a6-4671-a6a6-637eb77f4302.png', faction: 'Тэлэрион' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/09f804c7-86f3-4eca-b205-393e34503dc0.png', faction: 'Тэлэрион' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/ee677202-cd81-453c-a240-08902e95e832.png', faction: 'Тэлэрион' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/3fb5fc61-5d0b-40e0-851b-1c4d5d8ec899.png', faction: 'Тэлэрион' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/f8bedbc8-2486-4af6-9de0-8c2d2536564e.png', faction: 'Тэлэрион' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/157ea897-e1c6-408f-944a-8463c3ec1424.png', faction: 'Тэлэрион' },
  
  // Telerion Dragons
  { name: 'Обычный ледяной дракон', type: 'pet', image: '/lovable-uploads/1c428823-cebc-41ea-a9c0-6f741e5ae1ae.png', faction: 'Тэлэрион' },
  { name: 'Легендарный ледяной дракон', type: 'pet', image: '/lovable-uploads/1c428823-cebc-41ea-a9c0-6f741e5ae1ae.png', faction: 'Тэлэрион' },
  
  // Aelantir Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/195033f3-1c3d-461f-88ca-243f19a1a2b2.png', faction: 'Аэлантир' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/6dbe88ca-2da9-4836-8514-42d42fc6c0e2.png', faction: 'Аэлантир' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/6b92a8a2-f7dd-4f8d-80d6-9c75092bdce0.png', faction: 'Аэлантир' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/5b432b9a-123d-427b-a8f9-be62971556eb.png', faction: 'Аэлантир' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/072e712e-b51a-43a5-beca-6b2b4cc57bab.png', faction: 'Аэлантир' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/efb78739-7cb3-4c04-ae4d-06207d311fe2.png', faction: 'Аэлантир' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/7c1d642a-f411-4ef9-90ac-624e03528a57.png', faction: 'Аэлантир' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/a8941e22-eb71-41da-b79d-697ec40c19fc.png', faction: 'Аэлантир' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/ec76b547-e84b-479c-8301-966e46bd410f.png', faction: 'Аэлантир' },
  
  // Aelantir Dragons
  { name: 'Обычный светлый дракон', type: 'pet', image: '/lovable-uploads/be276b54-cf74-4b5f-bc81-eb10e6b4f96f.png', faction: 'Аэлантир' },
  { name: 'Эпический светлый дракон', type: 'pet', image: '/lovable-uploads/be276b54-cf74-4b5f-bc81-eb10e6b4f96f.png', faction: 'Аэлантир' },
  
  // Lioras Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/7ab893a1-5053-46ee-b7ae-3ec02eaf27cc.png', faction: 'Лиорас' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/8bdbdb12-8542-4b48-9e94-56381e6b83c5.png', faction: 'Лиорас' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/7029b0b3-2bcd-49c6-8c97-848605f6adff.png', faction: 'Лиорас' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/5b20f6f0-2fe4-4fd1-8b44-9e2f6d1e9fe2.png', faction: 'Лиорас' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/39f90b07-6e7b-47b0-aa55-0e9098ced929.png', faction: 'Лиорас' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/eb79ec90-c640-466c-adc7-c09833724b82.png', faction: 'Лиорас' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/c3dbc9c7-1b63-4522-bf24-bef8245f51f8.png', faction: 'Лиорас' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/d7df42e6-cf06-4aa0-8e61-6f1cd5fd6f7a.png', faction: 'Лиорас' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/5cd82d92-0700-4a7b-ac18-db694d3e0e95.png', faction: 'Лиорас' },
  
  // Lioras Dragons
  { name: 'Обычный песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'Лиорас' },
  { name: 'Необычный песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'Лиорас' },
  { name: 'Эпический песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'Лиорас' },
  { name: 'Легендарный песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'Лиорас' },
  { name: 'Этернал песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'Лиорас' },
  
  // Shadow Dragons
  { name: 'Империал теневой дракон', type: 'pet', image: '/lovable-uploads/6c79ca6c-46f0-4a71-a57f-efa81b68e0be.png', faction: 'Тень' },
  { name: 'Этернал теневой дракон', type: 'pet', image: '/lovable-uploads/6c79ca6c-46f0-4a71-a57f-efa81b68e0be.png', faction: 'Тень' },
];

type ClassLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type HeroClass = 
  | 'Рекрут'
  | 'Страж'
  | 'Ветеран'
  | 'Маг'
  | 'Мастер Целитель'
  | 'Защитник'
  | 'Ветеран Защитник'
  | 'Стратег'
  | 'Верховный Стратег';

type DragonClass = 
  | 'Обычный'
  | 'Необычный'
  | 'Редкий'
  | 'Эпический'
  | 'Легендарный'
  | 'Мифический'
  | 'Этернал'
  | 'Империал'
  | 'Титан';

// Function to pick a random class level based on weighted probabilities
function pickClassLevel(): ClassLevel {
  const roll = Math.random() * 100;
  
  let classLevel: ClassLevel;
  let range: string;
  
  if (roll <= 80.00) {
    classLevel = 1;
    range = "0.01-80.00 (80%)";
  } else if (roll <= 90.00) {
    classLevel = 2;
    range = "80.01-90.00 (20%)";
  } else if (roll <= 95.00) {
    classLevel = 3;
    range = "90.01-95.00 (15%)";
  } else if (roll <= 98.00) {
    classLevel = 4;
    range = "95.01-98.00 (10%)";
  } else if (roll <= 99.00) {
    classLevel = 5;
    range = "98.01-99.00 (5%)";
  } else if (roll <= 99.70) {
    classLevel = 6;
    range = "99.01-99.70 (3%)";
  } else if (roll <= 99.90) {
    classLevel = 7;
    range = "99.71-99.90 (2%)";
  } else if (roll <= 99.99) {
    classLevel = 8;
    range = "99.91-99.99 (1%)";
  } else {
    classLevel = 9;
    range = "99.991-100.00 (0.5%)";
  }
  
  console.log(`🎲 Class Level Roll: ${roll.toFixed(4)} → Level ${classLevel} (${range})`);
  
  return classLevel;
}

// Convert class level to actual class name based on card type
function getCardClass(level: ClassLevel, cardType: 'character' | 'pet'): HeroClass | DragonClass {
  if (cardType === 'character') {
    const heroClasses: HeroClass[] = [
      'Рекрут',
      'Страж',
      'Ветеран',
      'Маг',
      'Мастер Целитель',
      'Защитник',
      'Ветеран Защитник',
      'Стратег',
      'Верховный Стратег'
    ];
    return heroClasses[level - 1];
  } else {
    const dragonClasses: DragonClass[] = [
      'Обычный',
      'Необычный',
      'Редкий',
      'Эпический',
      'Легендарный',
      'Мифический',
      'Этернал',
      'Империал',
      'Титан'
    ];
    return dragonClasses[level - 1];
  }
}

function getMagicResistanceByFaction(faction: string): number | undefined {
  const resistances: Record<string, number> = {
    'Каледор': 10,
    'Сильванести': 15,
    'Фаэлин': 20,
    'Элленар': 5,
    'Тэлэрион': 25,
    'Аэлантир': 30,
    'Лиорас': 12,
    'Тень': 35
  };
  return resistances[faction];
}

function generateCard() {
  const typeRoll = Math.floor(Math.random() * 2) + 1;
  const cardType = typeRoll === 1 ? 'character' : 'pet';
  console.log(`🎲 Type Roll: ${typeRoll} → ${cardType === 'character' ? 'Герой' : 'Дракон'}`);
  
  // Pick class level (instead of rarity)
  const classLevel = pickClassLevel();
  const cardClass = getCardClass(classLevel, cardType);
  console.log(`🎖️ Card Class: ${cardClass} (level ${classLevel})`);
  
  // Filter cards by type and classLevel to get matching cards
  // For heroes: cardClass is the actual hero name (e.g., "Рекрут", "Страж")
  // For dragons: we need to find cards that start with cardClass (e.g., "Обычный ледяной дракон")
  let matchingCards: CardInfo[];
  
  if (cardType === 'character') {
    // For heroes, the cardClass IS the name
    matchingCards = cardDatabase.filter(card => 
      card.type === 'character' && card.name === cardClass
    );
  } else {
    // For dragons, find cards that start with the cardClass prefix
    matchingCards = cardDatabase.filter(card => 
      card.type === 'pet' && card.name.startsWith(cardClass)
    );
  }
  
  if (matchingCards.length === 0) {
    console.error(`⚠️ No matching cards found for type=${cardType}, class=${cardClass}`);
    // Fallback to any card of this type
    matchingCards = cardDatabase.filter(card => card.type === cardType);
  }
  
  const selectedCard = matchingCards[Math.floor(Math.random() * matchingCards.length)];
  const magicResistance = getMagicResistanceByFaction(selectedCard.faction);
  
  const card = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: selectedCard.name,
    type: cardType,
    rarity: 1, // Always 1 star now
    cardClass,
    classLevel,
    faction: selectedCard.faction,
    magicResistance,
    image: selectedCard.image,
    // Stats будут рассчитаны на клиенте через calculateCardStats с учетом classLevel
  };
  
  console.log(`✨ Generated Card: ${selectedCard.name} (${cardType}) 1⭐ Class: ${cardClass} (level ${classLevel}) faction=${selectedCard.faction} image=${selectedCard.image}`);
  
  return card;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, pack_name, count } = await req.json();
    
    console.log(`🎁 EDGE FUNCTION v2.0: Opening ${count} card pack(s) for wallet ${wallet_address}`);
    
    if (!wallet_address || !pack_name || !count || count < 1) {
      throw new Error('Invalid parameters');
    }

    // Generate cards with detailed logging
    const newCards = [];
    for (let i = 0; i < count; i++) {
      console.log(`\n📦 Generating card ${i + 1}/${count}:`);
      const card = generateCard();
      newCards.push(card);
    }
    
    console.log(`\n✅ Generated ${newCards.length} cards total`);
    console.log('Summary:', newCards.map(c => `${c.name} 1⭐ ${c.cardClass}`).join(', '));

    // Call RPC to atomically update inventory and add cards
    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.rpc('open_card_packs', {
      p_wallet_address: wallet_address,
      p_pack_name: pack_name,
      p_count: count,
      p_new_cards: newCards
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    console.log('✅ Database updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        cards: newCards,
        count: newCards.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in open-card-packs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
