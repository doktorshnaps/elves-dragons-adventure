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
    <div className="h-screen flex flex-col bg-shop">
      <div className="flex-1 overflow-y-auto">
        <Shop onClose={() => navigate('/menu')} />
      </div>
    </div>
  );
};