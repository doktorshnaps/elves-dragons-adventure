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

const Marketplace = () => {
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
    // Handle NFT listings separately
    if (listing.isNFT && accountId) {
      const nftCard = listing.item as NFTCard;
      const paymentToken = listing.paymentToken ? 'GT' : 'ELL';
      
      await createNFTListing(
        nftCard,
        listing.price,
        paymentToken,
        accountId,
        selector,
        async () => {
          setShowListingDialog(false);
          toast({
            title: "NFT выставлен на продажу",
            description: `${listing.item.name} выставлен за ${listing.price} ${paymentToken}`,
          });
          const { data: userRes } = await supabase.auth.getUser();
          const uid = userRes?.user?.id;
          if (uid) await syncLocalCaches(uid);
        },
        (error) => {
          toast({ title: 'Ошибка', description: error, variant: 'destructive' });
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
          title: "Предмет выставлен на продажу",
          description: `${listing.item.name} выставлен за ${listing.price} ELL`,
        });
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes?.user?.id;
        if (uid) await syncLocalCaches(uid);
      },
      (error) => {
        toast({ title: 'Не удалось создать объявление', description: error, variant: 'destructive' });
      }
    );
  };

  const handleCancelListing = async (listing: MarketplaceListing) => {
    await cancelListing(
      listing.id,
      async () => {
        removeListing(listing.id);

        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (userId) {
          await syncLocalCaches(userId);
        }

        toast({
          title: 'Объявление отменено',
          description: `${listing.item.name} возвращен(а) в ваш инвентарь/колоду`,
        });
      },
      (error) => {
        toast({ 
          title: 'Не удалось отменить объявление', 
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
