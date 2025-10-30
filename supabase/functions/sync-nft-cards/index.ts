import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFTToken {
  token_id: string
  metadata: {
    title?: string
    description?: string
    media?: string
    extra?: string
  }
}

interface NFTResponse {
  tokens: NFTToken[]
}

function normalizeMediaUrl(media?: string): string | undefined {
  if (!media) return undefined;
  try {
    console.log('🔗 Normalizing media URL:', media);
    
    // IPFS URL нормализация
    if (media.startsWith('ipfs://')) {
      const normalized = media.replace('ipfs://', 'https://ipfs.io/ipfs/');
      console.log('✅ IPFS URL normalized:', normalized);
      return normalized;
    }
    
    // Если это просто IPFS хэш
    if (/^[a-zA-Z0-9]{46,}$/.test(media)) {
      const normalized = `https://ipfs.io/ipfs/${media}`;
      console.log('✅ IPFS hash normalized:', normalized);
      return normalized;
    }
    
    // Arweave URL
    if (media.startsWith('ar://')) {
      const normalized = media.replace('ar://', 'https://arweave.net/');
      console.log('✅ Arweave URL normalized:', normalized);
      return normalized;
    }
    
    console.log('✅ URL already normalized:', media);
    return media;
  } catch (error) {
    console.error('❌ Error normalizing media URL:', error);
    return undefined;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting NFT sync process')
    
    const supabase = createClient(
      'https://oimhwdymghkwxznjarkv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k'
    )

    const { wallet_address, contract_id, additional_contracts = [] } = await req.json()
    
    if (!wallet_address) {
      throw new Error('Wallet address is required')
    }

    const contractId = contract_id || 'heroesnft.near' // Default NFT contract
    const contractsToCheck = [contractId, ...additional_contracts.filter((c: any) => c !== contractId)]
    
    console.log(`📖 Reading NFTs for wallet: ${wallet_address} from contracts: [${contractsToCheck.join(', ')}]`)

    // Call NEAR RPC to get NFTs for this wallet from all contracts
    const nearRpcUrl = 'https://rpc.mainnet.near.org'
    const allNFTs = []
    
    for (const currentContract of contractsToCheck) {
      console.log(`🔍 Checking contract: ${currentContract}`)
      
      const rpcResponse = await fetch(nearRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: currentContract,
            method_name: 'nft_tokens_for_owner',
              args_base64: btoa(JSON.stringify({
                account_id: wallet_address,
                from_index: '0',
                limit: 100
              }))
          }
        })
      })
      
      if (!rpcResponse.ok) {
        console.log(`⚠️ Error fetching from ${currentContract}: ${rpcResponse.statusText}`)
        continue
      }

      const rpcData = await rpcResponse.json()
      
      if (rpcData.error) {
        console.log(`⚠️ No NFTs found or contract error for ${currentContract}:`, rpcData.error)
        continue
      }

      // Parse NFT data safely (handle base64 string or byte array)
      const resultField = rpcData?.result?.result
      let bytes: Uint8Array | null = null
      if (typeof resultField === 'string') {
        try {
          bytes = Uint8Array.from(atob(resultField), c => c.charCodeAt(0))
        } catch (e) {
          console.log('⚠️ Failed base64 decode for', currentContract, 'error:', e)
        }
      } else if (Array.isArray(resultField)) {
        bytes = new Uint8Array(resultField)
      }

      if (!bytes) {
        console.log('⚠️ Unexpected RPC result format for', currentContract, 'resultField type:', typeof resultField)
        continue
      }

      let decoded = new TextDecoder().decode(bytes)
      let parsed: any
      try {
        parsed = JSON.parse(decoded)
      } catch (e) {
        console.log('⚠️ Failed to parse NFT JSON for', currentContract, 'decoded snippet:', decoded?.slice(0, 200))
        continue
      }

      const tokens: NFTToken[] = Array.isArray(parsed)
        ? parsed
        : (parsed?.tokens ?? [])

      console.log(`🎮 Found ${tokens.length} NFTs from ${currentContract}`)
      
      if (tokens.length > 0) {
        const nftsWithContract = tokens.map((nft: any) => ({
          ...nft,
          contract_id: currentContract
        }))
        allNFTs.push(...nftsWithContract)
      }
    }

    console.log(`🎮 Total NFTs found across all contracts: ${allNFTs.length}`)

    if (allNFTs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          nft_cards: [],
          message: 'No NFT cards found in wallet'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Clear existing NFT cards for this wallet from all contracts
    for (const currentContract of contractsToCheck) {
      await supabase
        .from('user_nft_cards')
        .delete()
        .eq('wallet_address', wallet_address)
        .eq('nft_contract_id', currentContract)
    }

    const gameCards = []
    const nftInserts = []

    console.log('📋 Processing NFTs with metadata-based stats')

    // Process each NFT using metadata directly (no template matching)
    for (const nft of allNFTs) {
      const cardName = nft.metadata?.title || nft.metadata?.description || 'Unknown Card'
      
      console.log(`🎴 Processing NFT: "${cardName}"`)
      
      // Record the NFT mapping
      nftInserts.push({
        wallet_address,
        nft_contract_id: nft.contract_id,
        nft_token_id: nft.token_id,
        card_template_name: cardName,
        nft_metadata: nft.metadata
      })
      
      // Create game card using NFT metadata
      const imageUrl = normalizeMediaUrl(nft.metadata?.media) || 
                       normalizeMediaUrl(nft.metadata?.image) || 
                       normalizeMediaUrl(nft.metadata?.img) ||
                       '/placeholder.svg';
      
      console.log(`🖼️ Image URL for "${cardName}":`, imageUrl);
      
      gameCards.push({
        id: `${nft.contract_id}_${nft.token_id}`,
        name: cardName,
        power: 20,
        defense: 15,
        health: 100,
        currentHealth: 100,
        rarity: 'common',
        faction: null,
        type: 'pet',
        description: nft.metadata?.description ?? 'NFT Card',
        image: imageUrl,
        nft_token_id: nft.token_id,
        nft_contract_id: nft.contract_id
      })
    }

    // Insert NFT mappings
    if (nftInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('user_nft_cards')
        .insert(nftInserts)

      if (insertError) {
        console.error('Error inserting NFT mappings:', insertError)
      }
    }

    console.log(`🎲 Created ${gameCards.length} game cards from NFTs`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        nft_cards: gameCards,
        total_nfts: allNFTs.length,
        matched_cards: gameCards.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in sync-nft-cards:', error)
    return new Response(
      JSON.stringify({ 
        error: (error as any)?.message || 'Unknown error occurred',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})