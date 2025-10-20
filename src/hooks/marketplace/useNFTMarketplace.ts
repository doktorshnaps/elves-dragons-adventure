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
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      
      if (!userId) {
        onError('Требуется вход');
        return;
      }

      // Check if NFT is already listed
      const { data: existing } = await supabase
        .from('card_instances')
        .select('is_on_marketplace')
        .eq('nft_contract_id', nftCard.nft_contract_id)
        .eq('nft_token_id', nftCard.nft_token_id)
        .eq('wallet_address', walletAddress)
        .single();

      if (existing?.is_on_marketplace) {
        onError('Этот NFT уже выставлен на продажу');
        return;
      }

      // Create marketplace listing
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
          payment_token_contract: paymentToken === 'GT' ? 'gt-1733.meme-cooking.near' : null
        }])
        .select()
        .single();

      if (listingError) {
        console.error('Error creating NFT listing:', listingError);
        onError(listingError.message);
        return;
      }

      // Lock NFT in card_instances
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
        console.error('Error locking NFT:', lockError);
        // Rollback listing
        await supabase
          .from('marketplace_listings')
          .delete()
          .eq('id', listing.id);
        onError('Не удалось заблокировать NFT');
        return;
      }

      onSuccess();
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
