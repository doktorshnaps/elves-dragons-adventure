import { MarketplaceTab } from "@/components/game/marketplace/MarketplaceTab";

export const Marketplace = () => {
  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/20d88f7a-4f27-4b22-8ebe-e55b87a0c7e3.png")',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm">
        <MarketplaceTab />
      </div>
    </div>
  );
};