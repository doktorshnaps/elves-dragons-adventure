import { MarketplaceTab } from "@/components/game/marketplace/MarketplaceTab";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Marketplace = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/20d88f7a-4f27-4b22-8ebe-e55b87a0c7e3.png")',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <Button 
        variant="outline" 
        className="mb-4 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={() => navigate('/menu')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm">
        <MarketplaceTab />
      </div>
    </div>
  );
};