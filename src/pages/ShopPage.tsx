import { Shop } from "@/components/Shop";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageTitle";

export const ShopPage = () => {
  const navigate = useNavigate();
  usePageMeta({ 
    title: 'Магазин', 
    description: 'Покупай редкие NFT карты героев и драконов. Легендарные карты, эпическое снаряжение. Маркетплейс на NEAR Protocol.' 
  });

  return (
    <div className="min-h-screen bg-shop">
      <Shop onClose={() => navigate('/menu')} />
    </div>
  );
};