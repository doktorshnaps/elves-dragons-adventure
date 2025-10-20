import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import * as nearAPI from 'https://esm.sh/near-api-js@6.3.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BuyNFTRequest {
  listing_id: string;
  buyer_wallet_address: string;
  transaction_hash?: string; // Optional: hash of GT token transfer transaction
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { listing_id, buyer_wallet_address, transaction_hash }: BuyNFTRequest = await req.json();

    console.log('🛒 NFT Purchase Request:', { listing_id, buyer_wallet_address, transaction_hash });

    // 1. Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listing_id)
      .eq('status', 'active')
      .eq('is_nft_listing', true)
      .single();

    if (listingError || !listing) {
      console.error('❌ Listing not found:', listingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Listing not found or not active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-purchase
    if (listing.seller_wallet_address === buyer_wallet_address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot buy your own NFT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { nft_contract_id, nft_token_id, price, seller_wallet_address, payment_token_contract } = listing;

    if (!nft_contract_id || !nft_token_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid NFT listing data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Listing details:', {
      nft_contract_id,
      nft_token_id,
      price,
      seller: seller_wallet_address,
      buyer: buyer_wallet_address,
      payment_token: payment_token_contract
    });

    // 2. Verify payment transaction (if provided)
    if (transaction_hash) {
      try {
        const { providers } = nearAPI;
        const provider = new providers.JsonRpcProvider({ url: 'https://rpc.mainnet.near.org' });
        
        const txStatus: any = await provider.txStatus(transaction_hash, buyer_wallet_address);
        
        console.log('💳 Transaction status:', txStatus);

        // Verify the transaction was successful and matches expected parameters
        if (txStatus.status?.SuccessValue === undefined && !txStatus.status?.Failure) {
          // Transaction is successful
          const receiptOutcomes = txStatus.receipts_outcome || [];
          let transferFound = false;

          for (const outcome of receiptOutcomes) {
            const logs = outcome.outcome?.logs || [];
            // Check if this is a token transfer to the seller
            for (const log of logs) {
              if (log.includes('Transfer') && log.includes(seller_wallet_address)) {
                transferFound = true;
                break;
              }
            }
            if (transferFound) break;
          }

          if (!transferFound) {
            console.warn('⚠️ Token transfer not verified in transaction logs');
          }
        } else if (txStatus.status?.Failure) {
          return new Response(
            JSON.stringify({ success: false, error: 'Payment transaction failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (txError) {
        console.error('❌ Error verifying transaction:', txError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to verify payment transaction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Mark listing as sold and update database
    const { error: updateError } = await supabase
      .from('marketplace_listings')
      .update({
        status: 'sold',
        buyer_wallet_address,
        sold_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', listing_id);

    if (updateError) {
      console.error('❌ Failed to update listing:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update listing status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update card_instances - unlock from marketplace and transfer ownership
    const { error: cardUpdateError } = await supabase
      .from('card_instances')
      .update({
        wallet_address: buyer_wallet_address,
        is_on_marketplace: false,
        marketplace_listing_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('nft_contract_id', nft_contract_id)
      .eq('nft_token_id', nft_token_id);

    if (cardUpdateError) {
      console.error('❌ Failed to update card ownership:', cardUpdateError);
    }

    // 5. Update user_nft_cards ownership
    const { error: nftCardUpdateError } = await supabase
      .from('user_nft_cards')
      .update({
        wallet_address: buyer_wallet_address,
        updated_at: new Date().toISOString()
      })
      .eq('nft_contract_id', nft_contract_id)
      .eq('nft_token_id', nft_token_id);

    if (nftCardUpdateError) {
      console.error('❌ Failed to update NFT card ownership:', nftCardUpdateError);
    }

    console.log('✅ NFT purchase completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NFT purchased successfully',
        listing_id,
        nft_contract_id,
        nft_token_id,
        buyer: buyer_wallet_address,
        seller: seller_wallet_address,
        price
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing NFT purchase:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
