import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFTMetadata {
  title?: string;
  description?: string;
  media?: string;
  reference?: string;
  copies?: number;
}

interface CardMapping {
  card_name: string;
  card_type: 'hero' | 'dragon';
  rarity: number;
  faction: string;
  stats: {
    health: number;
    defense: number;
    power: number;
    magic: number;
  };
}

// Маппинг фракций с английского на русский
const FACTION_MAP: Record<string, string> = {
  'Kaledor': 'Каледор',
  'Silvanesti': 'Сильванести',
  'Faelin': 'Фаэлин',
  'Ellenar': 'Элленар',
  'Telerion': 'Тэлэрион',
  'Aelantir': 'Аэлантир',
  'Lioras': 'Лиорас'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { wallet_address } = await req.json();

    if (!wallet_address) {
      throw new Error('wallet_address is required');
    }

    console.log(`🔄 Syncing Mintbase NFTs for wallet: ${wallet_address}`);

    // Вызываем NEAR RPC для получения NFT
    const nearRpcResponse = await fetch('https://rpc.mainnet.near.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: 'elleonortesr.mintbase1.near',
          method_name: 'nft_tokens_for_owner',
          args_base64: btoa(JSON.stringify({ account_id: wallet_address }))
        }
      })
    });

    const nearRpcData = await nearRpcResponse.json();
    
    if (nearRpcData.error) {
      throw new Error(`NEAR RPC error: ${JSON.stringify(nearRpcData.error)}`);
    }

    const resultBytes = nearRpcData.result?.result;
    if (!resultBytes) {
      console.log('⚠️ No NFTs found for this wallet');
      return new Response(
        JSON.stringify({ success: true, nft_count: 0, card_count: 0, cards: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const nfts = JSON.parse(new TextDecoder().decode(new Uint8Array(resultBytes)));
    console.log(`📦 Found ${nfts.length} NFTs from Mintbase contract`);

    // Обрабатываем NFT и создаем карты
    const nftCards = [];
    for (const nft of nfts) {
      try {
        const metadata = nft.metadata || {};
        const cardMapping = mapNFTToCard(metadata, nft.token_id);
        
        if (cardMapping) {
          nftCards.push({
            id: `mintbase_${nft.token_id}`,
            name: cardMapping.card_name,
            type: cardMapping.card_type,
            image: metadata.media || metadata.reference || '/placeholder.svg',
            rarity: cardMapping.rarity,
            faction: cardMapping.faction,
            health: cardMapping.stats.health,
            defense: cardMapping.stats.defense,
            power: cardMapping.stats.power,
            magic: cardMapping.stats.magic,
            maxHealth: cardMapping.stats.health,
            currentHealth: cardMapping.stats.health,
            lastHealTime: Date.now(),
            isInMedicalBay: false,
            nft_contract: 'elleonortesr.mintbase1.near',
            nft_token_id: nft.token_id,
          });
        }
      } catch (error) {
        console.error(`Error mapping NFT ${nft.token_id}:`, error);
      }
    }

    console.log(`✅ Mapped ${nftCards.length} NFTs to cards`);

    // Save to user_nft_cards table
    if (nftCards.length > 0) {
      // First, remove old NFT cards from this contract for this wallet
      await supabase
        .from('user_nft_cards')
        .delete()
        .eq('wallet_address', wallet_address)
        .eq('nft_contract_id', 'elleonortesr.mintbase1.near');

      // Insert new NFT cards
      const { error: insertError } = await supabase
        .from('user_nft_cards')
        .insert(
          nftCards.map(card => ({
            wallet_address,
            nft_contract_id: 'elleonortesr.mintbase1.near',
            nft_token_id: card.nft_token_id,
            card_template_name: card.name,
            nft_metadata: card,
          }))
        );

      if (insertError) {
        console.error('Error inserting NFT cards:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        nft_count: nfts.length,
        card_count: nftCards.length,
        cards: nftCards,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error syncing Mintbase NFTs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function mapNFTToCard(metadata: NFTMetadata, tokenId: string): CardMapping | null {
  const title = metadata.title || '';
  const description = metadata.description || '';
  
  console.log(`📝 Mapping NFT: ${title}`);
  
  // 1. Извлекаем редкость из (rarity1)...(rarity8) в названии
  let rarity = 1;
  const rarityMatch = title.match(/\(rarity(\d)\)/i);
  if (rarityMatch) {
    const extractedRarity = parseInt(rarityMatch[1]);
    if (extractedRarity >= 1 && extractedRarity <= 8) {
      rarity = extractedRarity;
      console.log(`✨ Extracted rarity: ${rarity}`);
    }
  }
  
  // 2. Определяем фракцию из названия (английский транскрипт)
  let faction = 'Каледор'; // default
  for (const [englishName, russianName] of Object.entries(FACTION_MAP)) {
    if (title.includes(englishName)) {
      faction = russianName;
      console.log(`🏛️ Detected faction: ${englishName} -> ${faction}`);
      break;
    }
  }
  
  // 3. Определяем тип карты - СТРОГО по ключевым словам дракона
  // По умолчанию ВСЕ карты - герои, драконы только если явно указано
  let card_type: 'hero' | 'dragon' = 'hero';
  
  // Ключевые слова ТОЛЬКО для драконов — строго ограниченный список
  // Важно: учитываем только эти слова и только в явном виде
  const dragonKeywords = [
    'dragon',
    'drake',
    'wyvern'
  ];
  
  // Приоритетные ключевые слова героев — всегда герои
  const heroPriorityKeywords = [
    'strategist',
    'warrior',
    'knight'
  ];
  
  // Дополнительные (менее приоритетные) ключевые слова героев
  const heroExtraKeywords = [
    'стратег',
    'воин',
    'рыцарь',
    'mage', 'маг',
    'hero', 'герой',
    'guard', 'страж',
    'defender', 'защитник',
    'healer', 'целитель',
    'veteran', 'ветеран',
    'recruit', 'рекрут'
  ];
  
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // 1) Приоритет: если в названии/описании встречается одно из heroPriorityKeywords → это герой
  const isPriorityHero = heroPriorityKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(titleLower) || regex.test(descLower);
  });

  if (isPriorityHero) {
    card_type = 'hero';
    console.log(`⚔️ Hero by priority keyword`);
  } else {
    // 2) Если нет приоритетных — проверяем dragon keywords
    const isDragon = dragonKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(titleLower) || regex.test(descLower);
    });

    if (isDragon) {
      card_type = 'dragon';
      console.log(`🐉 Dragon by keyword`);
    } else {
      // 3) Если нет dragon — проверяем расширенные hero keywords
      const isHero = heroExtraKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(titleLower) || regex.test(descLower);
      });
      card_type = isHero ? 'hero' : 'hero';
      console.log(isHero ? `⚔️ Hero by extra keyword` : `⚔️ Default to hero`);
    }
  }
  
  // 4. Рассчитываем характеристики на основе редкости и типа карты
  const baseStats = card_type === 'dragon' 
    ? { health: 80, defense: 20, power: 25, magic: 30 }
    : { health: 100, defense: 25, power: 20, magic: 15 };
  
  // Множитель увеличивается с редкостью: rarity1=1x, rarity2=1.5x, rarity3=2x и т.д.
  const multiplier = 1 + (rarity - 1) * 0.5;
  
  const stats = {
    health: Math.floor(baseStats.health * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    power: Math.floor(baseStats.power * multiplier),
    magic: Math.floor(baseStats.magic * multiplier),
  };
  
  console.log(`📊 Calculated stats (type: ${card_type}, multiplier ${multiplier}x):`, stats);
  
  return {
    card_name: title || `NFT ${tokenId}`,
    card_type,
    rarity,
    faction,
    stats,
  };
}
