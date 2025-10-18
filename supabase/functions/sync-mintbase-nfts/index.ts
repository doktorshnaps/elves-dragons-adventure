import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MintbaseNFT {
  token_id: string;
  metadata: {
    title?: string;
    description?: string;
    media?: string;
    reference?: string;
    extra?: string;
  };
  owner_id: string;
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

    // Fetch NFTs from Mintbase GraphQL API
    const mintbaseQuery = {
      query: `
        query GetNFTs($owner: String!) {
          mb_views_nft_tokens(
            where: {
              owner: { _eq: $owner }
              nft_contract_id: { _eq: "elleonortesr.mintbase1.near" }
            }
          ) {
            token_id
            metadata_id
            owner
            nft_contract_id
            minted_timestamp
          }
        }
      `,
      variables: {
        owner: wallet_address
      }
    };

    const mintbaseResponse = await fetch('https://graph.mintbase.xyz/mainnet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mb-api-key': 'anon',
      },
      body: JSON.stringify(mintbaseQuery),
    });

    if (!mintbaseResponse.ok) {
      throw new Error(`Mintbase API error: ${mintbaseResponse.statusText}`);
    }

    const mintbaseData = await mintbaseResponse.json();
    const nfts = mintbaseData?.data?.mb_views_nft_tokens || [];

    console.log(`📦 Found ${nfts.length} NFTs from Mintbase`);

    // Fetch metadata for each NFT
    const nftCards = [];
    for (const nft of nfts) {
      try {
        // Get metadata from NEAR blockchain
        const metadataUrl = `https://arweave.net/${nft.metadata_id}`;
        const metadataResponse = await fetch(metadataUrl);
        
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          
          // Map NFT to card based on metadata
          const cardMapping = mapNFTToCard(metadata, nft);
          
          if (cardMapping) {
            nftCards.push({
              id: `mintbase_${nft.token_id}`,
              name: cardMapping.card_name,
              type: cardMapping.card_type,
              image: metadata.media || metadata.reference,
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
        }
      } catch (error) {
        console.error(`Error fetching metadata for token ${nft.token_id}:`, error);
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

function mapNFTToCard(metadata: any, nft: any): CardMapping | null {
  const title = metadata.title || '';
  const description = metadata.description || '';
  
  // Parse metadata to determine card type and stats
  // This is a basic mapping - adjust based on your NFT metadata structure
  
  let card_type: 'hero' | 'dragon' = 'hero';
  let rarity = 1;
  let faction = 'Каледор';
  
  // Determine type from title or attributes
  if (title.toLowerCase().includes('dragon') || description.toLowerCase().includes('дракон')) {
    card_type = 'dragon';
  }
  
  // Determine rarity from attributes or title
  if (metadata.attributes) {
    const rarityAttr = metadata.attributes.find((attr: any) => 
      attr.trait_type?.toLowerCase() === 'rarity'
    );
    if (rarityAttr) {
      const rarityMap: Record<string, number> = {
        'common': 1,
        'uncommon': 2,
        'rare': 3,
        'epic': 4,
        'legendary': 5,
      };
      rarity = rarityMap[rarityAttr.value?.toLowerCase()] || 1;
    }
  }
  
  // Determine faction from attributes
  if (metadata.attributes) {
    const factionAttr = metadata.attributes.find((attr: any) => 
      attr.trait_type?.toLowerCase() === 'faction'
    );
    if (factionAttr) {
      faction = factionAttr.value || 'Каледор';
    }
  }
  
  // Calculate stats based on rarity and type
  const baseStats = card_type === 'dragon' 
    ? { health: 80, defense: 20, power: 25, magic: 30 }
    : { health: 100, defense: 25, power: 20, magic: 15 };
  
  const multiplier = 1 + (rarity - 1) * 0.5;
  
  return {
    card_name: title || `NFT ${nft.token_id}`,
    card_type,
    rarity,
    faction,
    stats: {
      health: Math.floor(baseStats.health * multiplier),
      defense: Math.floor(baseStats.defense * multiplier),
      power: Math.floor(baseStats.power * multiplier),
      magic: Math.floor(baseStats.magic * multiplier),
    },
  };
}
