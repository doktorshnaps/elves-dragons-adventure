import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFTResponse {
  result?: any[];
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

    const { wallet_address, check_all_nft_users } = await req.json();

    // Режим массовой проверки всех пользователей с NFT вайт-листом
    if (check_all_nft_users) {
      console.log('🔍 Starting mass NFT whitelist validation...');
      
      // Получаем всех пользователей с автоматическим вайт-листом
      const { data: nftUsers, error: usersError } = await supabase
        .from('whitelist')
        .select('wallet_address, nft_contract_used')
        .eq('whitelist_source', 'nft_automatic')
        .eq('is_active', true);

      if (usersError) {
        console.error('Error fetching NFT users:', usersError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch NFT users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let revokedCount = 0;
      const revokedUsers: string[] = [];

      // Проверяем каждого пользователя
      for (const user of nftUsers || []) {
        const nfts = await fetchNFTsFromContract(user.wallet_address, user.nft_contract_used || 'golden_ticket.nfts.tg');
        
        if (!nfts || nfts.length === 0) {
          // У пользователя больше нет NFT, отзываем вайт-лист
          const { error: revokeError } = await supabase
            .rpc('revoke_whitelist_if_no_nft', {
              p_wallet_address: user.wallet_address,
              p_nft_contracts: []
            });

          if (!revokeError) {
            revokedCount++;
            revokedUsers.push(user.wallet_address);
            console.log(`✅ Revoked whitelist for ${user.wallet_address} - no NFT found`);
          } else {
            console.error(`❌ Failed to revoke whitelist for ${user.wallet_address}:`, revokeError);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Mass validation completed. Revoked ${revokedCount} whitelists.`,
          revokedUsers: revokedUsers,
          totalChecked: nftUsers?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Обычная проверка для одного пользователя
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required' }),
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

    // Проверяем каждый контракт на наличие NFT
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

    // Обновляем вайт-лист (добавляем или отзываем)
    const { data: whitelistResult, error: whitelistError } = await supabase
      .rpc('check_and_add_to_whitelist_by_nft', {
        p_wallet_address: wallet_address,
        p_nft_contracts: foundContracts
      });

    if (whitelistError) {
      console.error('Error updating whitelist:', whitelistError);
      return new Response(
        JSON.stringify({ error: 'Failed to update whitelist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (hasQualifyingNFT) {
      console.log('✅ Successfully added to whitelist via NFT ownership');
      return new Response(
        JSON.stringify({ 
          success: true, 
          addedToWhitelist: whitelistResult,
          foundContracts: foundContracts,
          message: whitelistResult ? 'Added to whitelist via NFT ownership' : 'Already whitelisted'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('❌ No qualifying NFTs found, checking for revocation...');
      return new Response(
        JSON.stringify({ 
          success: true, 
          addedToWhitelist: false,
          foundContracts: [],
          message: 'No qualifying NFTs found. Automatic whitelist may have been revoked.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in check-nft-whitelist:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});