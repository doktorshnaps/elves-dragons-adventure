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
  if (!media) return undefined
  try {
    if (media.startsWith('ipfs://')) {
      return media.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    // bare CID
    if (/^[a-zA-Z0-9]{46,}$/.test(media)) {
      return `https://ipfs.io/ipfs/${media}`
    }
    return media
  } catch (_) {
    return media
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
    const contractsToCheck = [contractId, ...additional_contracts.filter(c => c !== contractId)]
    
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

    // Get all card templates to match with NFTs
    const { data: templates, error: templatesError } = await supabase
      .from('card_templates')
      .select('*')

    if (templatesError) {
      throw new Error(`Error fetching card templates: ${templatesError.message}`)
    }

    const gameCards = []
    const nftInserts = []

    // Process each NFT and try to match with card templates
    for (const nft of allNFTs) {
      const cardName = nft.metadata?.title || nft.metadata?.description || 'Unknown Card'
      
      // Find matching template by name (case insensitive)
      const template = templates?.find(t => 
        t.name.toLowerCase() === cardName.toLowerCase() ||
        cardName.toLowerCase().includes(t.name.toLowerCase()) ||
        t.name.toLowerCase().includes(cardName.toLowerCase())
      )

      if (template) {
        console.log(`✅ Matched NFT "${cardName}" with template "${template.name}"`)
        
        // Create NFT mapping record
        nftInserts.push({
          wallet_address,
          nft_contract_id: nft.contract_id,
          nft_token_id: nft.token_id,
          card_template_name: template.name,
          nft_metadata: nft.metadata
        })

        // Create game card with template stats
        gameCards.push({
          id: `${nft.contract_id}_${nft.token_id}`,
          name: template.name,
          power: template.power,
          defense: template.defense,
          health: template.health,
          currentHealth: template.health,
          rarity: template.rarity,
          faction: template.faction,
          type: template.card_type,
          description: template.description,
          image: normalizeMediaUrl(nft.metadata?.media) || template.image_url || '/placeholder.svg',
          nft_token_id: nft.token_id,
          nft_contract_id: nft.contract_id
        })
      } else {
        console.log(`⚠️ No template found for NFT: "${cardName}" — using fallback stats`)
        // Still record the NFT mapping so the app can show it using metadata
        nftInserts.push({
          wallet_address,
          nft_contract_id: nft.contract_id,
          nft_token_id: nft.token_id,
          card_template_name: cardName,
          nft_metadata: nft.metadata
        })
        // Fallback lightweight game card so UI can render immediately
        gameCards.push({
          id: `${nft.contract_id}_${nft.token_id}`,
          name: cardName,
          power: 20,
          defense: 15,
          health: 100,
          currentHealth: 100,
          rarity: 'common',
          faction: null,
          type: 'pet', // default to pet so it appears in the dragon deck
          description: nft.metadata?.description ?? 'NFT Card',
          image: normalizeMediaUrl(nft.metadata?.media) || '/placeholder.svg',
          nft_token_id: nft.token_id,
          nft_contract_id: nft.contract_id
        })
      }
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
        error: error.message || 'Unknown error occurred',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})