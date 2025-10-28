import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFTResponse {
  result?: any[];
}

// Функция для получения NFT с контракта с повторными попытками и rate limiting
async function fetchNFTsFromContract(walletAddress: string, contractId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📞 Fetching NFTs for ${walletAddress} from ${contractId} (attempt ${attempt}/${maxRetries})`);
      
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
          console.warn(`⚠️ Rate limited (429) for ${walletAddress} from ${contractId}`);
          if (attempt < maxRetries) {
            // Увеличиваем задержку для rate limit
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            continue;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Проверка на ошибки NEAR RPC
      if (data.error) {
        console.error(`❌ NEAR RPC error for ${walletAddress}:`, data.error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      if (data.result?.result) {
        const resultString = new TextDecoder().decode(new Uint8Array(data.result.result));
        const nfts = JSON.parse(resultString);
        console.log(`✅ Successfully fetched ${nfts.length} NFTs for ${walletAddress} from ${contractId}`);
        // Добавляем небольшую задержку после успешного запроса для rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        return nfts;
      }
      
      console.log(`ℹ️ No NFTs found for ${walletAddress} from ${contractId}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${walletAddress} from ${contractId}:`, error);
      if (attempt < maxRetries) {
        // Экспоненциальная задержка между попытками
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

    const body = await req.json();
    const { wallet_address, validate_all, specific_contract } = body;

    if (!wallet_address && !validate_all) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required or set validate_all to true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Validating NFT whitelist for:', wallet_address || 'all users', 'contract:', specific_contract || 'all');

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

    let walletsToCheck: string[] = [];
    
    if (validate_all) {
      // Получаем всех пользователей с автоматическим вайт-листом
      let query = supabase
        .from('whitelist')
        .select('wallet_address, nft_contract_used')
        .eq('whitelist_source', 'nft_automatic')
        .eq('is_active', true);
      
      // Если указан конкретный контракт - фильтруем только его холдеров (БЕЗ ЛИМИТА)
      if (specific_contract) {
        query = query.eq('nft_contract_used', specific_contract);
        console.log(`🎯 Filtering by contract: ${specific_contract} (NO LIMIT)`);
      } else {
        // Ограничиваем только если проверяем все контракты
        query = query.limit(50);
        console.log(`🎯 Checking all contracts (limited to 50 wallets)`);
      }

      const { data: autoWhitelisted, error: autoError } = await query;

      if (autoError) {
        console.error('Error fetching auto-whitelisted users:', autoError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch auto-whitelisted users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      walletsToCheck = autoWhitelisted.map(w => w.wallet_address);
      console.log(`🔍 Validating ${walletsToCheck.length} auto-whitelisted wallets${specific_contract ? ` for contract ${specific_contract}` : ' (limited to 50)'}`);
    } else {
      walletsToCheck = [wallet_address];
    }

    const results = [];
    const BATCH_SIZE = 5; // Увеличено для более быстрой обработки
    const WALLET_DELAY = 500; // 500ms задержка между кошельками для уменьшения rate limit
    const MAX_EXECUTION_TIME = 110000; // 110 секунд (оставляем запас до таймаута 120 сек)
    const startTime = Date.now();
    
    console.log(`⏱️ Starting validation of ${walletsToCheck.length} wallets at ${new Date().toISOString()}`);

    for (let i = 0; i < walletsToCheck.length; i++) {
      // Проверяем, не превысили ли мы максимальное время выполнения
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.warn(`⏰ Max execution time reached after ${i} wallets. Returning partial results.`);
        
        const summary = {
          totalChecked: i,
          confirmed: results.filter(r => r.success && r.hadNFTs).length,
          revoked: results.filter(r => r.success && !r.hadNFTs).length,
          errors: results.filter(r => !r.success).length,
          timedOut: true,
          remainingWallets: walletsToCheck.length - i
        };

        return new Response(
          JSON.stringify({ 
            success: true,
            summary,
            results: validate_all ? results : results[0],
            message: `Partial validation completed. ${summary.totalChecked} wallets checked before timeout. ${summary.remainingWallets} remaining.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const walletToCheck = walletsToCheck[i];
      console.log(`🔍 Checking wallet ${i + 1}/${walletsToCheck.length}: ${walletToCheck}`);
      
      // Проверяем каждый контракт на наличие NFT
      let hasQualifyingNFT = false;
      let hadRpcError = false;
      const foundContracts: string[] = [];

      for (const contractAddress of contractAddresses) {
        const nfts = await fetchNFTsFromContract(walletToCheck, contractAddress);
        
        // null означает ошибку при получении данных
        if (nfts === null) {
          hadRpcError = true;
          console.warn(`⚠️ RPC error while checking ${contractAddress} for ${walletToCheck}`);
          continue;
        }
        
        if (nfts.length > 0) {
          hasQualifyingNFT = true;
          foundContracts.push(contractAddress);
          console.log(`✅ Found ${nfts.length} NFTs in contract ${contractAddress} for ${walletToCheck}`);
        }
        
        // Задержка между проверками контрактов
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Если были ошибки RPC, не отзываем whitelist
      if (hadRpcError && !hasQualifyingNFT) {
        console.warn(`⚠️ Skipping whitelist revocation for ${walletToCheck} due to RPC errors`);
        results.push({
          wallet: walletToCheck,
          success: false,
          error: 'RPC error - skipped to prevent incorrect revocation',
          hadNFTs: false,
          foundContracts: [],
          skipped: true
        });
        continue;
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
        // Если NFT НЕ найдены И не было ошибок RPC - отзываем вайт-лист
        const result = await supabase
          .rpc('revoke_whitelist_if_no_nft', {
            p_wallet_address: walletToCheck,
            p_nft_contracts: []
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
      
      // Задержка между кошельками для rate limiting
      if (i < walletsToCheck.length - 1) {
        await new Promise(resolve => setTimeout(resolve, WALLET_DELAY));
      }
      
      // Дополнительная пауза каждые BATCH_SIZE кошельков
      if ((i + 1) % BATCH_SIZE === 0 && i < walletsToCheck.length - 1) {
        console.log(`⏸️ Batch pause after ${i + 1} wallets... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Увеличено до 2 сек для rate limit
      }
    }

    const summary = {
      totalChecked: walletsToCheck.length,
      confirmed: results.filter(r => r.success && r.hadNFTs).length,
      revoked: results.filter(r => r.success && !r.hadNFTs).length,
      errors: results.filter(r => !r.success).length,
      skipped: results.filter(r => r.skipped).length,
      executionTimeSeconds: Math.round((Date.now() - startTime) / 1000)
    };

    console.log(`✅ Validation complete: ${summary.totalChecked} checked, ${summary.confirmed} confirmed, ${summary.revoked} revoked, ${summary.errors} errors, ${summary.skipped} skipped in ${summary.executionTimeSeconds}s`);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        results: validate_all ? results : results[0],
        message: `Validated ${summary.totalChecked} wallets: ${summary.confirmed} confirmed, ${summary.revoked} revoked, ${summary.skipped} skipped due to RPC errors`
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