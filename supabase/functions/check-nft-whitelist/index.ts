import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFTResponse {
  result?: any[];
}

// Rate limiting function to prevent abuse
async function checkRateLimit(supabaseClient: any, clientIp: string, endpoint: string): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  // Count requests from this IP in the last minute
  const { count, error: countError } = await supabaseClient
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', clientIp)
    .eq('endpoint', endpoint)
    .gte('created_at', oneMinuteAgo);
  
  if (countError) {
    console.error('Rate limit check error:', countError);
    // Don't block on rate limit errors
    return;
  }
  
  // Different limits for different operations
  const limit = endpoint === 'check-nft-whitelist-mass' ? 2 : 5;
  
  if (count && count >= limit) {
    throw new Error(`Rate limit exceeded: maximum ${limit} requests per minute`);
  }
  
  // Record this request
  await supabaseClient
    .from('api_rate_limits')
    .insert({ 
      ip_address: clientIp,
      endpoint: endpoint
    });
}

// Функция для получения NFT с контракта с повторными попытками и rate limiting
async function fetchNFTsFromContract(walletAddress: string, contractId: string, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📞 Fetching NFTs (attempt ${attempt}/${maxRetries})`);
      
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

      if (!response.ok) {
        // Специальная обработка 429 (Too Many Requests)
        if (response.status === 429) {
          console.warn(`⚠️ Rate limited (429)`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            continue;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Проверка на ошибки NEAR RPC
      if (data.error) {
        console.error(`❌ NEAR RPC error:`, data.error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      if (data.result?.result) {
        const resultString = new TextDecoder().decode(new Uint8Array(data.result.result));
        const nfts = JSON.parse(resultString);
        console.log(`✅ Successfully fetched ${nfts.length} NFTs`);
        // Добавляем задержку после успешного запроса для rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        return nfts;
      }
      
      console.log(`ℹ️ No NFTs found`);
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      } else {
        return null;
      }
    }
  }
  return null;
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

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const { wallet_address, check_all_nft_users, specific_contract } = await req.json();

    // Check rate limit before processing (different limits for mass vs single checks)
    const endpoint = check_all_nft_users ? 'check-nft-whitelist-mass' : 'check-nft-whitelist';
    
    try {
      await checkRateLimit(supabase, clientIp, endpoint);
    } catch (rateLimitError) {
      console.error('Rate limit exceeded:', rateLimitError);
      return new Response(
        JSON.stringify({ 
          error: rateLimitError.message || 'Rate limit exceeded',
          retryAfter: 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Режим массовой проверки всех пользователей с NFT вайт-листом
    if (check_all_nft_users) {
      console.log('🔍 Starting mass NFT whitelist validation...', specific_contract ? `for contract: ${specific_contract}` : 'for all contracts');
      
      // Получаем всех пользователей с автоматическим вайт-листом
      const query = supabase
        .from('whitelist')
        .select('wallet_address, nft_contract_used')
        .eq('whitelist_source', 'nft_automatic')
        .eq('is_active', true);
      
      // Если указан конкретный контракт, фильтруем по нему
      if (specific_contract) {
        query.eq('nft_contract_used', specific_contract);
      }

      const { data: nftUsers, error: usersError } = await query;

      if (usersError) {
        console.error('Error fetching NFT users:', usersError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch NFT users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let revokedCount = 0;
      const revokedUsers: string[] = [];
      const BATCH_SIZE = 5;

      // Проверяем каждого пользователя с задержками
      for (let i = 0; i < (nftUsers || []).length; i++) {
        const user = nftUsers[i];
        console.log(`🔍 Checking user ${i + 1}/${nftUsers.length}`);
        
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
            console.log(`✅ Revoked whitelist - no NFT found`);
          } else {
            console.error(`❌ Failed to revoke whitelist:`, revokeError);
          }
        }
        
        // Задержка между пользователями
        if (i < nftUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Пауза каждые BATCH_SIZE пользователей
        if ((i + 1) % BATCH_SIZE === 0 && i < nftUsers.length - 1) {
          console.log(`⏸️ Batch pause after ${i + 1} users...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
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

    console.log('🔍 Checking whitelist NFTs', specific_contract ? `in specific contract` : '');

    // Получаем активные контракты для вайт-листа
    let contractAddresses: string[];
    
    if (specific_contract) {
      // Проверяем только указанный контракт
      contractAddresses = [specific_contract];
      console.log('📜 Checking specific contract:', specific_contract);
    } else {
      // Проверяем все активные контракты
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

      contractAddresses = whitelistContracts.map(c => c.contract_address);
      console.log('📜 Checking all contracts:', contractAddresses);
    }

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
      // Задержка между контрактами для rate limiting
      await new Promise(resolve => setTimeout(resolve, 400));
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