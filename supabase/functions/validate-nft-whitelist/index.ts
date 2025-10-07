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

    const body = await req.json();
    const { wallet_address, validate_all } = body;

    if (!wallet_address && !validate_all) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required or set validate_all to true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Validating NFT whitelist for:', wallet_address || 'all users');

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

    let walletsToCheck: string[] = [];
    
    if (validate_all) {
      // Получаем всех пользователей с автоматическим вайт-листом
      const { data: autoWhitelisted, error: autoError } = await supabase
        .from('whitelist')
        .select('wallet_address')
        .eq('whitelist_source', 'nft_automatic')
        .eq('is_active', true);

      if (autoError) {
        console.error('Error fetching auto-whitelisted users:', autoError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch auto-whitelisted users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      walletsToCheck = autoWhitelisted.map(w => w.wallet_address);
      console.log(`🔍 Validating ${walletsToCheck.length} auto-whitelisted wallets`);
    } else {
      walletsToCheck = [wallet_address];
    }

    const results = [];

    for (const walletToCheck of walletsToCheck) {
      console.log(`🔍 Checking wallet: ${walletToCheck}`);
      
      // Проверяем каждый контракт на наличие NFT
      let hasQualifyingNFT = false;
      const foundContracts: string[] = [];

      for (const contractAddress of contractAddresses) {
        const nfts = await fetchNFTsFromContract(walletToCheck, contractAddress);
        if (nfts && nfts.length > 0) {
          hasQualifyingNFT = true;
          foundContracts.push(contractAddress);
          console.log(`✅ Found ${nfts.length} NFTs in contract ${contractAddress} for ${walletToCheck}`);
        }
      }

      // Обновляем статус вайт-листа
      let updateResult;
      let updateError;
      
      if (hasQualifyingNFT) {
        // Если NFT найдены - добавляем/подтверждаем вайт-лист
        const result = await supabase
          .rpc('check_and_add_to_whitelist_by_nft', {
            p_wallet_address: walletToCheck,
            p_nft_contracts: foundContracts
          });
        updateResult = result.data;
        updateError = result.error;
      } else {
        // Если NFT НЕ найдены - отзываем вайт-лист
        const result = await supabase
          .rpc('revoke_whitelist_if_no_nft', {
            p_wallet_address: walletToCheck,
            p_nft_contracts: contractAddresses
          });
        updateResult = result.data;
        updateError = result.error;
      }

      if (updateError) {
        console.error(`Error updating whitelist for ${walletToCheck}:`, updateError);
        results.push({
          wallet: walletToCheck,
          success: false,
          error: updateError.message,
          hadNFTs: hasQualifyingNFT,
          foundContracts
        });
      } else {
        const action = hasQualifyingNFT ? 'confirmed/added' : 'revoked';
        console.log(`✅ Whitelist ${action} for ${walletToCheck}`);
        
        results.push({
          wallet: walletToCheck,
          success: true,
          action,
          hadNFTs: hasQualifyingNFT,
          foundContracts,
          whitelistUpdated: updateResult
        });
      }
    }

    const summary = {
      totalChecked: walletsToCheck.length,
      confirmed: results.filter(r => r.success && r.hadNFTs).length,
      revoked: results.filter(r => r.success && !r.hadNFTs).length,
      errors: results.filter(r => !r.success).length
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        results: validate_all ? results : results[0],
        message: `Validated ${summary.totalChecked} wallets: ${summary.confirmed} confirmed, ${summary.revoked} revoked`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-nft-whitelist:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});