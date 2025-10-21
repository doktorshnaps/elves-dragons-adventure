import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing } from '@/components/game/marketplace/types';
import { NFTCard } from '@/hooks/useNFTCards';
import * as nearAPI from 'near-api-js';

export const useNFTMarketplace = () => {
  /**
   * Create NFT marketplace listing
   */
  const createNFTListing = async (
    nftCard: NFTCard,
    price: number,
    paymentToken: string,
    walletAddress: string,
    walletSelector: any,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    try {
      console.log('🎬 createNFTListing started', { nftCard, price, paymentToken, walletAddress });
      
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      
      console.log('👤 User check', { userId, hasUser: !!userRes?.user });
      
      let hasSupabaseSession = true;
      if (!userId) {
        console.warn('⚠️ No Supabase user session; will use Edge Function fallback');
        hasSupabaseSession = false;
      }

      console.log('✅ User authenticated, checking wallet selector');

      if (!walletSelector) {
        console.error('❌ No wallet selector');
        onError('Кошелек не подключен');
        return;
      }

      console.log('✅ Wallet selector ready, proceeding to check existing listing');

      // Check if NFT is already listed
      console.log('🔍 Checking existing listing', { 
        nft_contract_id: nftCard.nft_contract_id,
        nft_token_id: nftCard.nft_token_id,
        walletAddress 
      });
      
      const { data: existing, error: checkError } = await supabase
        .from('card_instances')
        .select('is_on_marketplace')
        .eq('nft_contract_id', nftCard.nft_contract_id)
        .eq('nft_token_id', nftCard.nft_token_id)
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      console.log('📊 Existing check result', { existing, checkError, is_on_marketplace: existing?.is_on_marketplace });

      if (existing?.is_on_marketplace) {
        onError('Этот NFT уже выставлен на продажу');
        return;
      }

      // Determine payment token contract
      const ftContract = paymentToken === 'GT' ? 'gt-1733.meme-cooking.near' : null;
      // For FT (GT) we pass price exactly as entered (no decimal scaling)
      const rawPrice = price.toString();
      const priceInYocto = ftContract ? rawPrice : nearAPI.utils.format.parseNearAmount(rawPrice) || '0';
      console.log('💰 Price conversion', { price, rawPrice, priceInYocto, ftContract, paymentToken });

      // Step 1: Call nft_approve on the NFT contract via NEAR wallet
      console.log('📝 Step 1: Preparing nft_approve call');
      console.log('NFT details:', {
        contract: 'elleonortesr.mintbase1.near',
        token_id: nftCard.nft_token_id,
        account_id: 'elleonortesr.mintbase1.near',
        price: priceInYocto,
        paymentToken,
        ftContract
      });

      try {
        const wallet = await walletSelector.wallet();
        console.log('✅ Wallet obtained, initiating nft_approve transaction...');
        
        const approveResult = await wallet.signAndSendTransaction({
          receiverId: 'elleonortesr.mintbase1.near',
          actions: [
            {
              type: 'FunctionCall',
              params: {
                methodName: 'nft_approve',
                args: {
                  token_id: nftCard.nft_token_id,
                  account_id: 'elleonortesr.mintbase1.near',
                  msg: JSON.stringify({
                    price: priceInYocto,
                    ft_contract: ftContract,
                    market_type: 'list_sale'
                  })
                },
                gas: '100000000000000',
                deposit: nearAPI.utils.format.parseNearAmount('0.01') || '0'
              }
            }
          ]
        });

        console.log('✅ nft_approve transaction completed:', approveResult);
        console.log('📊 Transaction hash:', approveResult?.transaction?.hash);
      } catch (walletError: any) {
        console.error('❌ Error calling nft_approve:', walletError);
         const safeMessage = walletError && typeof walletError === 'object' && 'message' in walletError
           ? (walletError as any).message
           : 'Неизвестная ошибка';
         onError('Не удалось подтвердить NFT в кошельке: ' + safeMessage);
         return;
      }

      // Step 3: Create marketplace listing (DB)
      console.log('📝 Step 3: Creating marketplace listing...');

      if (hasSupabaseSession) {
        const { data: listing, error: listingError } = await supabase
          .from('marketplace_listings')
          .insert([{
            seller_id: userId,
            seller_wallet_address: walletAddress,
            item: nftCard as any,
            price,
            type: 'card',
            status: 'active',
            is_nft_listing: true,
            nft_contract_id: nftCard.nft_contract_id,
            nft_token_id: nftCard.nft_token_id,
            payment_token_contract: ftContract
          }])
          .select()
          .single();

        if (listingError) {
          console.error('❌ Error creating NFT listing:', listingError);
          onError(listingError.message);
          return;
        }

        console.log('✅ Marketplace listing created:', listing.id);
        
        // Step 4: Lock NFT in card_instances
        console.log('📝 Step 4: Locking NFT in card_instances...');
        const { error: lockError } = await supabase
          .from('card_instances')
          .update({
            is_on_marketplace: true,
            marketplace_listing_id: listing.id
          })
          .eq('nft_contract_id', nftCard.nft_contract_id)
          .eq('nft_token_id', nftCard.nft_token_id)
          .eq('wallet_address', walletAddress);

        if (lockError) {
          console.error('❌ Error locking NFT:', lockError);
          // Rollback listing
          console.log('🔄 Rolling back marketplace listing...');
          await supabase
            .from('marketplace_listings')
            .delete()
            .eq('id', listing.id);
          onError('Не удалось заблокировать NFT');
          return;
        }

        console.log('✅ NFT locked successfully');
        console.log('🎉 All steps completed! NFT listing created successfully');
        onSuccess();
      } else {
        console.log('🛰️ Using Edge Function fallback: marketplace-create-nft-listing');
        const { data, error } = await supabase.functions.invoke('marketplace-create-nft-listing', {
          body: {
            seller_wallet_address: walletAddress,
            item: nftCard,
            price,
            nft_contract_id: nftCard.nft_contract_id,
            nft_token_id: nftCard.nft_token_id,
            payment_token_contract: ftContract
          }
        });

        if (error) {
          console.error('❌ Edge function error creating listing:', error);
          onError(error.message || 'Не удалось создать листинг через Edge Function');
          return;
        }

        console.log('✅ Edge function listing created:', (data as any)?.listing?.id);
        console.log('🎉 All steps completed via edge function!');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error in createNFTListing:', error);
      onError(error.message || 'Неизвестная ошибка');
    }
  };

  /**
   * Cancel NFT listing
   */
  const cancelNFTListing = async (
    listingId: string,
    nftContractId: string,
    nftTokenId: string,
    walletAddress: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    try {
      // Update listing status
      const { error: listingError } = await supabase
        .from('marketplace_listings')
        .update({ status: 'cancelled' })
        .eq('id', listingId)
        .eq('seller_wallet_address', walletAddress);

      if (listingError) {
        onError(listingError.message);
        return;
      }

      // Unlock NFT
      const { error: unlockError } = await supabase
        .from('card_instances')
        .update({
          is_on_marketplace: false,
          marketplace_listing_id: null
        })
        .eq('nft_contract_id', nftContractId)
        .eq('nft_token_id', nftTokenId)
        .eq('wallet_address', walletAddress);

      if (unlockError) {
        console.error('Error unlocking NFT:', unlockError);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error in cancelNFTListing:', error);
      onError(error.message || 'Неизвестная ошибка');
    }
  };

  /**
   * Buy NFT with GT tokens
   */
  const buyNFTWithTokens = async (
    listing: MarketplaceListing,
    buyerWalletAddress: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    try {
      if (!listing.isNFT || !listing.paymentToken) {
        onError('Это не NFT листинг с оплатой токенами');
        return;
      }

      const nftItem = listing.item as NFTCard;
      const paymentTokenContract = listing.paymentToken;
      const amount = listing.price;

      // Step 1: User needs to transfer GT tokens to seller
      // This should be done via NEAR wallet in the frontend
      console.log('💰 Initiating GT token transfer:', {
        from: buyerWalletAddress,
        to: listing.sellerId,
        amount,
        token: paymentTokenContract
      });

      // For now, we'll assume the transfer is done by the frontend
      // and we just need to verify and complete the purchase

      // Step 2: Call edge function to complete the purchase
      const { data, error } = await supabase.functions.invoke('marketplace-buy-nft', {
        body: {
          listing_id: listing.id,
          buyer_wallet_address: buyerWalletAddress,
          // transaction_hash can be provided if we want to verify the transfer
        }
      });

      if (error) {
        console.error('Error buying NFT:', error);
        onError(error.message || 'Не удалось купить NFT');
        return;
      }

      console.log('✅ NFT purchase completed:', data);
      onSuccess();
    } catch (error: any) {
      console.error('Error in buyNFTWithTokens:', error);
      onError(error.message || 'Неизвестная ошибка');
    }
  };

  /**
   * Initiate GT token transfer via NEAR wallet
   */
  const initiateTokenTransfer = async (
    walletSelector: any,
    recipientId: string,
    amount: string,
    tokenContractId: string = 'gt-1733.meme-cooking.near'
  ): Promise<string | null> => {
    try {
      if (!walletSelector) {
        throw new Error('Wallet not connected');
      }

      const wallet = await walletSelector.wallet();
      const amountInYocto = nearAPI.utils.format.parseNearAmount(amount) || '0';

      // Call ft_transfer on the token contract
      const result = await wallet.signAndSendTransaction({
        receiverId: tokenContractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'ft_transfer',
              args: {
                receiver_id: recipientId,
                amount: amountInYocto,
                memo: 'NFT Marketplace Purchase'
              },
              gas: '30000000000000',
              deposit: '1'
            }
          }
        ]
      });

      console.log('Token transfer result:', result);
      return result?.transaction?.hash || null;
    } catch (error) {
      console.error('Error initiating token transfer:', error);
      throw error;
    }
  };

  return {
    createNFTListing,
    cancelNFTListing,
    buyNFTWithTokens,
    initiateTokenTransfer
  };
};
