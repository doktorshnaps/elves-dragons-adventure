import { MarketplaceContent } from "@/components/game/marketplace/components/MarketplaceContent";
import { MarketplaceHeader } from "@/components/game/marketplace/components/MarketplaceHeader";
import { MarketplaceLayout } from "@/components/game/marketplace/components/MarketplaceLayout";

export const Marketplace = () => {
  return (
    <MarketplaceLayout>
      <MarketplaceHeader />
      <MarketplaceContent />
    </MarketplaceLayout>
  );
};