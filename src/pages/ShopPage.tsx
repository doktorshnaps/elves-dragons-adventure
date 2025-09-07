import { Shop } from "@/components/Shop";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useNavigate } from "react-router-dom";

export const ShopPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-game-background">
      <LanguageToggle />
      <Shop onClose={() => navigate('/menu')} />
    </div>
  );
};