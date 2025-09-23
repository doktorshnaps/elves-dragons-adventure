import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Функция для получения NFT с контракта
async function fetchNFTsFromContract(walletAddress: string, contractId: string) {
  try {
    const response = await fetch('https://rpc.mainnet.near.org', {
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
            account_id: walletAddress,
            limit: 100
          }))
        }
      })
    });

    const data = await response.json();
    if (data.result?.result) {
      const resultString = new TextDecoder().decode(new Uint8Array(data.result.result));
      return JSON.parse(resultString);
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch NFTs from ${contractId}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://oimhwdymghkwxznjarkv.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { wallet_address, check_all_automatic = false } = await req.json();

    if (!wallet_address && !check_all_automatic) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required or set check_all_automatic=true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Checking whitelist NFTs for wallet:', wallet_address);

    // Получаем активные контракты для вайт-листа
    const { data: whitelistContracts, error: contractsError } = await supabase
      .from('whitelist_contracts')
      .select('contract_address')
      .eq('is_active', true);

    if (contractsError) {
      console.error('Error fetching whitelist contracts:', contractsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch whitelist contracts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contractAddresses = whitelistContracts.map(c => c.contract_address);
    console.log('📜 Checking contracts:', contractAddresses);

    // Если запрошена проверка всех автоматических записей
    if (check_all_automatic) {
      console.log('🔄 Checking all automatic whitelist entries...');
      
      const { data: automaticEntries, error: entriesError } = await supabase
        .from('whitelist')
        .select('wallet_address')
        .eq('whitelist_source', 'nft_automatic')
        .eq('is_active', true);

      if (entriesError) {
        console.error('Error fetching automatic entries:', entriesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch automatic entries' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let revokedCount = 0;
      for (const entry of automaticEntries || []) {
        // Проверяем NFT для каждого кошелька
        let hasQualifyingNFT = false;
        const foundContracts: string[] = [];

        for (const contractAddress of contractAddresses) {
          const nfts = await fetchNFTsFromContract(entry.wallet_address, contractAddress);
          if (nfts && nfts.length > 0) {
            hasQualifyingNFT = true;
            foundContracts.push(contractAddress);
          }
        }

        // Если NFT больше нет, отзываем вайт-лист
        if (!hasQualifyingNFT) {
          const { data: revokeResult, error: revokeError } = await supabase
            .rpc('revoke_whitelist_if_no_nft', {
              p_wallet_address: entry.wallet_address,
              p_nft_contracts: foundContracts
            });

          if (!revokeError && revokeResult) {
            revokedCount++;
            console.log(`❌ Revoked whitelist for ${entry.wallet_address} - no NFT found`);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Checked all automatic entries, revoked ${revokedCount} entries` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем конкретный кошелек
    let hasQualifyingNFT = false;
    const foundContracts: string[] = [];

    for (const contractAddress of contractAddresses) {
      const nfts = await fetchNFTsFromContract(wallet_address, contractAddress);
      if (nfts && nfts.length > 0) {
        hasQualifyingNFT = true;
        foundContracts.push(contractAddress);
        console.log(`✅ Found ${nfts.length} NFTs in contract ${contractAddress}`);
      }
    }

    // Вызываем функцию проверки/добавления/отзыва вайт-листа
    const { data: whitelistResult, error: whitelistError } = await supabase
      .rpc('check_and_add_to_whitelist_by_nft', {
        p_wallet_address: wallet_address,
        p_nft_contracts: foundContracts
      });

    if (whitelistError) {
      console.error('Error checking whitelist:', whitelistError);
      return new Response(
        JSON.stringify({ error: 'Failed to check whitelist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = hasQualifyingNFT 
      ? (whitelistResult ? 'Added to whitelist via NFT ownership' : 'Already whitelisted')
      : 'No qualifying NFTs found, automatic whitelist revoked if existed';

    console.log('✅', message);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        addedToWhitelist: whitelistResult,
        foundContracts: foundContracts,
        hasQualifyingNFT: hasQualifyingNFT,
        message: message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-nft-whitelist:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});