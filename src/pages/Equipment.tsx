import { useNavigate } from "react-router-dom";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
import { useEquipmentState } from "@/hooks/equipment/useEquipmentState";
import { useInventoryDedupe } from "@/hooks/useInventoryDedupe";
import { EquipmentHeader } from "@/components/game/equipment/EquipmentHeader";
import { EquipmentTabs } from "@/components/game/equipment/EquipmentTabs";

export const Equipment = () => {
  const navigate = useNavigate();
  const { toggleEquipItem } = useEquipmentState();
  
  // Удаляем дубликаты из инвентаря
  useInventoryDedupe();

  const handleMintNFT = () => {
    // TODO: Implement NFT minting functionality
    console.log('Mint functionality will be implemented here');
  };

  return (
    <div className="h-screen p-4 bg-equipment overflow-hidden">
      <EquipmentHeader 
        onBack={() => navigate('/menu')}
        onMintNFT={handleMintNFT}
      />
      
      <div className="bg-black/50 border-2 border-white rounded-3xl backdrop-blur-sm p-4" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <DragonEggProvider>
          <EquipmentTabs 
            onUseItem={toggleEquipItem}
          />
        </DragonEggProvider>
      </div>
    </div>
  );
};