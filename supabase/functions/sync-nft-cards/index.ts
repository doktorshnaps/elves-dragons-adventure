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

    const { wallet_address, contract_id } = await req.json()
    
    if (!wallet_address) {
      throw new Error('Wallet address is required')
    }

    const contractId = contract_id || 'heroesnft.near' // Default NFT contract
    
    console.log(`📖 Reading NFTs for wallet: ${wallet_address} from contract: ${contractId}`)

    // Call NEAR RPC to get NFTs for this wallet
    const nearRpcUrl = 'https://rpc.mainnet.near.org'
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
          account_id: contractId,
          method_name: 'nft_tokens_for_owner',
          args_base64: btoa(JSON.stringify({
            account_id: wallet_address,
            limit: 100
          }))
        }
      })
    })

    if (!rpcResponse.ok) {
      throw new Error(`NEAR RPC error: ${rpcResponse.statusText}`)
    }

    const rpcData = await rpcResponse.json()
    console.log('📡 NEAR RPC Response:', JSON.stringify(rpcData, null, 2))

    if (rpcData.error) {
      console.log('⚠️ No NFTs found or contract error:', rpcData.error)
      return new Response(
        JSON.stringify({ 
          success: true, 
          nft_cards: [],
          message: 'No NFTs found for this wallet'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Parse NFT data
    const nftData: NFTResponse = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(rpcData.result.result), c => c.charCodeAt(0))
      )
    )

    console.log(`🎮 Found ${nftData.tokens?.length || 0} NFTs`)

    if (!nftData.tokens || nftData.tokens.length === 0) {
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

    // Clear existing NFT cards for this wallet
    await supabase
      .from('user_nft_cards')
      .delete()
      .eq('wallet_address', wallet_address)
      .eq('nft_contract_id', contractId)

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
    for (const nft of nftData.tokens) {
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
          nft_contract_id: contractId,
          nft_token_id: nft.token_id,
          card_template_name: template.name,
          nft_metadata: nft.metadata
        })

        // Create game card with template stats
        gameCards.push({
          id: `${contractId}_${nft.token_id}`,
          name: template.name,
          power: template.power,
          defense: template.defense,
          health: template.health,
          currentHealth: template.health,
          rarity: template.rarity,
          faction: template.faction,
          type: template.card_type,
          description: template.description,
          image: nft.metadata?.media || template.image_url || '/placeholder.svg',
          nft_token_id: nft.token_id,
          nft_contract_id: contractId
        })
      } else {
        console.log(`⚠️ No template found for NFT: "${cardName}"`)
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
        total_nfts: nftData.tokens.length,
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