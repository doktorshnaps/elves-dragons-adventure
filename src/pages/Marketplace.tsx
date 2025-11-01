import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceLayout } from "@/components/game/marketplace/components/MarketplaceLayout";
import { MarketplaceHeader } from "@/components/game/marketplace/components/MarketplaceHeader";
import { MarketplaceContent } from "@/components/game/marketplace/components/MarketplaceContent";
import { ListingDialog } from "@/components/game/marketplace/ListingDialog";
import { MarketplaceListing } from "@/components/game/marketplace/types";
import { useMarketplaceState } from "@/hooks/marketplace/useMarketplaceState";
import { useMarketplaceBuy } from "@/hooks/marketplace/useMarketplaceBuy";
import { useMarketplaceOperations } from "@/hooks/marketplace/useMarketplaceOperations";
import { useNFTMarketplace } from "@/hooks/marketplace/useNFTMarketplace";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { NFTCard } from "@/hooks/useNFTCards";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

const Marketplace = () => {
  const { language } = useLanguage();
  const [showListingDialog, setShowListingDialog] = useState(false);
  const { accountId, selector } = useWalletContext();
  
  const {
    listings,
    selectedIds,
    balance,
    toast,
    toggleSelect,
    clearSelection,
    removeListing,
    removeListings,
    syncLocalCaches,
    updateGameData,
    loadGameData
  } = useMarketplaceState();

  const { createListing, cancelListing } = useMarketplaceOperations();
  const { createNFTListing, cancelNFTListing } = useNFTMarketplace();

  const { handleBuy, handleBuySelected } = useMarketplaceBuy({
    balance,
    toast,
    removeListing,
    syncLocalCaches,
    updateGameData,
    loadGameData
  });


  const handleCreateListing = async (listing: MarketplaceListing) => {
    console.log('🧾 handleCreateListing called:', {
      isNFT: listing.isNFT,
      accountId,
      selectorReady: !!selector,
      item: listing.item,
      price: listing.price,
      paymentTokenRaw: listing.paymentToken
    });

    // Handle NFT listings separately
    if (listing.isNFT) {
      console.log('📍 Entered NFT listing block', { accountId, selector: !!selector });
      
      if (!accountId || !selector) {
        console.warn('⚠️ Wallet not connected or selector missing for NFT listing', { accountId, selectorExists: !!selector });
        toast({ 
          title: t(language, 'marketplace.connectWallet'), 
          description: t(language, 'marketplace.connectWalletDesc'), 
          variant: 'destructive' 
        });
        return;
      }

      // Normalize NFT card data (handle both camelCase and snake_case)
      const rawCard = listing.item as any;
      const nftCard: NFTCard = {
        ...rawCard,
        nft_token_id: rawCard.nft_token_id || rawCard.nftTokenId,
        nft_contract_id: rawCard.nft_contract_id || rawCard.nftContractId
      } as NFTCard;
      
      // paymentToken может быть строкой с адресом контракта или undefined
      const paymentToken = listing.paymentToken === 'gt-1733.meme-cooking.near' ? 'GT' : 'ELL';
      console.log('🚀 Initiating NFT listing via createNFTListing', { 
        paymentToken, 
        paymentTokenRaw: listing.paymentToken,
        nftCard 
      });

      await createNFTListing(
        nftCard,
        listing.price,
        paymentToken,
        accountId,
        selector,
        async () => {
          setShowListingDialog(false);
          toast({
            title: t(language, 'marketplace.nftListed'),
            description: `${listing.item.name} ${t(language, 'marketplace.listedFor')} ${listing.price} ${paymentToken}`,
          });
          if (accountId) await syncLocalCaches(accountId);
        },
        (error) => {
          toast({ title: t(language, 'marketplace.error'), description: error, variant: 'destructive' });
        }
      );
      return;
    }
    // Regular listing
    await createListing(
      listing,
      async () => {
        setShowListingDialog(false);
        toast({
          title: t(language, 'marketplace.itemListed'),
          description: `${listing.item.name} ${t(language, 'marketplace.listedFor')} ${listing.price} ELL`,
        });
        if (accountId) await syncLocalCaches(accountId);
      },
      (error) => {
        toast({ title: t(language, 'marketplace.failedToList'), description: error, variant: 'destructive' });
      }
    );
  };
  const handleCancelListing = async (listing: MarketplaceListing) => {
    await cancelListing(
      listing.id,
      async () => {
        removeListing(listing.id);

        if (accountId) {
          await syncLocalCaches(accountId);
        }

        toast({
          title: t(language, 'marketplace.listingCancelled'),
          description: `${listing.item.name} ${t(language, 'marketplace.returnedToInventory')}`,
        });
      },
      (error) => {
        toast({ 
          title: t(language, 'marketplace.failedToCancel'),
          description: error, 
          variant: 'destructive' 
        });
      }
    );
  };

  return (
    <MarketplaceLayout>
      <MarketplaceHeader />
      <MarketplaceContent
        listings={listings}
        balance={balance}
        onOpenListingDialog={() => setShowListingDialog(true)}
        onBuy={handleBuy}
        onCancelListing={handleCancelListing}
        enableSelection={true}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onBuySelected={() => handleBuySelected(
          selectedIds, 
          listings, 
          clearSelection, 
          removeListings
        )}
      />
      {showListingDialog && (
        <ListingDialog
          onClose={() => setShowListingDialog(false)}
          onCreateListing={handleCreateListing}
        />
      )}
    </MarketplaceLayout>
  );
};

export default Marketplace;
