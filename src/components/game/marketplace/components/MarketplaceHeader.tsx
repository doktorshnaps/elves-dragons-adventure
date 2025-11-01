import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

export const MarketplaceHeader = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  return (
    <div className="flex justify-between items-center mb-4">
      <Button 
        variant="menu"
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        onClick={() => navigate('/menu')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t(language, 'marketplace.backToMenu')}
      </Button>
    </div>
  );
};