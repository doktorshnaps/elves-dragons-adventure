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
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/6ba29742-0bdb-477e-924e-c97d968909f4.png', faction: 'kaledor' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/f3a95c8d-26a1-43ce-86ff-01a8aba5bb95.png', faction: 'kaledor' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/64ceab84-8336-40e0-9219-31f4e51ea217.png', faction: 'kaledor' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/f3a95c8d-26a1-43ce-86ff-01a8aba5bb95.png', faction: 'kaledor' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/20f876ac-c5a5-48c5-8d7c-a4cbcb5e3af7.png', faction: 'kaledor' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/a67b0362-c82a-4564-99e8-8776f6bf6591.png', faction: 'kaledor' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/a67b0362-c82a-4564-99e8-8776f6bf6591.png', faction: 'kaledor' },
  
  // Kaledor Dragons
  { name: 'Обычный огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Необычный огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Редкий огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Эпический огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Легендарный огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Мифический огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Империал огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  { name: 'Этернал огненный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'kaledor' },
  
  // Sylvanesti
  { name: 'Обычный лесной дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'sylvanesti' },
  { name: 'Необычный лесной дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'sylvanesti' },
  { name: 'Эпический лесной дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'sylvanesti' },
  
  // Faelin
  { name: 'Обычный водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'faelin' },
  { name: 'Легендарный водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'faelin' },
  { name: 'Эпический водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'faelin' },
  
  // Ellenar
  { name: 'Обычный земной дракон', type: 'pet', image: '/lovable-uploads/58195e56-c35c-4a7b-8868-c3a29d8e7c0c.png', faction: 'ellenar' },
  { name: 'Редкий земной дракон', type: 'pet', image: '/lovable-uploads/58195e56-c35c-4a7b-8868-c3a29d8e7c0c.png', faction: 'ellenar' },
  { name: 'Легендарный земной дракон', type: 'pet', image: '/lovable-uploads/58195e56-c35c-4a7b-8868-c3a29d8e7c0c.png', faction: 'ellenar' },
  
  // Telerion
  { name: 'Обычный ледяной дракон', type: 'pet', image: '/lovable-uploads/1c428823-cebc-41ea-a9c0-6f741e5ae1ae.png', faction: 'telerion' },
  { name: 'Легендарный ледяной дракон', type: 'pet', image: '/lovable-uploads/1c428823-cebc-41ea-a9c0-6f741e5ae1ae.png', faction: 'telerion' },
  
  // Aelantir
  { name: 'Обычный светлый дракон', type: 'pet', image: '/lovable-uploads/be276b54-cf74-4b5f-bc81-eb10e6b4f96f.png', faction: 'aelantir' },
  { name: 'Эпический светлый дракон', type: 'pet', image: '/lovable-uploads/be276b54-cf74-4b5f-bc81-eb10e6b4f96f.png', faction: 'aelantir' },
  
  // Lioras
  { name: 'Обычный песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'lioras' },
  { name: 'Необычный песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'lioras' },
  { name: 'Эпический песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'lioras' },
  { name: 'Легендарный песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'lioras' },
  { name: 'Этернал песчаный дракон', type: 'pet', image: '/lovable-uploads/72e17d22-1cd5-4087-aa0f-2b05c55eac0a.png', faction: 'lioras' },
  
  // Shadow
  { name: 'Империал теневой дракон', type: 'pet', image: '/lovable-uploads/6c79ca6c-46f0-4a71-a57f-efa81b68e0be.png', faction: 'shadow' },
  { name: 'Этернал теневой дракон', type: 'pet', image: '/lovable-uploads/6c79ca6c-46f0-4a71-a57f-efa81b68e0be.png', faction: 'shadow' },
];

type Rarity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

function pickRarity(): Rarity {
  const roll = Math.random() * 100;
  
  let rarity: Rarity;
  let range: string;
  
  if (roll <= 80.00) {
    rarity = 1;
    range = "0.01-80.00 (80%)";
  } else if (roll <= 90.00) {
    rarity = 2;
    range = "80.01-90.00 (10%)";
  } else if (roll <= 95.00) {
    rarity = 3;
    range = "90.01-95.00 (5%)";
  } else if (roll <= 98.00) {
    rarity = 4;
    range = "95.01-98.00 (3%)";
  } else if (roll <= 99.50) {
    rarity = 5;
    range = "98.01-99.50 (1.5%)";
  } else if (roll <= 99.80) {
    rarity = 6;
    range = "99.51-99.80 (0.3%)";
  } else if (roll <= 99.95) {
    rarity = 7;
    range = "99.81-99.95 (0.15%)";
  } else {
    rarity = 8;
    range = "99.96-100.00 (0.05%)";
  }
  
  console.log(`🎲 Rarity Roll: ${roll.toFixed(4)} → ${rarity}⭐ (${range})`);
  
  return rarity;
}

function getMagicResistanceByFaction(faction: string): number | undefined {
  const resistances: Record<string, number> = {
    kaledor: 10,
    sylvanesti: 15,
    faelin: 20,
    ellenar: 5,
    telerion: 25,
    aelantir: 30,
    lioras: 12,
    shadow: 35
  };
  return resistances[faction];
}

function generateCard() {
  const typeRoll = Math.floor(Math.random() * 2) + 1;
  const cardType = typeRoll === 1 ? 'character' : 'pet';
  console.log(`🎲 Type Roll: ${typeRoll} → ${cardType === 'character' ? 'Герой' : 'Дракон'}`);
  
  const availableCards = cardDatabase.filter(card => card.type === cardType);
  const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
  const rarity = pickRarity();
  
  const magicResistance = getMagicResistanceByFaction(selectedCard.faction);
  
  const card = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: selectedCard.name,
    type: cardType,
    rarity,
    faction: selectedCard.faction,
    magicResistance,
    image: selectedCard.image,
    // Stats будут рассчитаны на клиенте через calculateCardStats
  };
  
  console.log(`✨ Generated Card: ${selectedCard.name} (${cardType}) ${rarity}⭐ faction=${selectedCard.faction}`);
  
  return card;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, pack_name, count } = await req.json();
    
    console.log(`🎁 EDGE FUNCTION: Opening ${count} card pack(s) for wallet ${wallet_address}`);
    
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
    console.log('Summary:', newCards.map(c => `${c.name} ${c.rarity}⭐`).join(', '));

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
