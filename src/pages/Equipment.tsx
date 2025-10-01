import { useNavigate } from "react-router-dom";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
import { useNFTCardIntegration } from "@/hooks/useNFTCardIntegration";
import { useEquipmentState } from "@/hooks/equipment/useEquipmentState";
import { EquipmentHeader } from "@/components/game/equipment/EquipmentHeader";
import { EquipmentTabs } from "@/components/game/equipment/EquipmentTabs";

export const Equipment = () => {
  const navigate = useNavigate();
  const { nftCards, isLoading } = useNFTCardIntegration();
  const { toggleEquipItem } = useEquipmentState();

  const handleMintNFT = () => {
    // TODO: Implement NFT minting functionality
    console.log('Mint functionality will be implemented here');
  };

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat" 
      style={{
        backgroundImage: 'url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <EquipmentHeader 
        onBack={() => navigate('/menu')}
        onMintNFT={handleMintNFT}
      />
      
      <DragonEggProvider>
        <EquipmentTabs 
          onUseItem={toggleEquipItem}
          nftCards={nftCards}
          isLoadingNFT={isLoading}
        />
      </DragonEggProvider>
    </div>
  );
};