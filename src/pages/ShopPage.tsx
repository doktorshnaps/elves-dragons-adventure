import { Shop } from "@/components/Shop";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

export const ShopPage = () => {
  const navigate = useNavigate();
  usePageTitle('Магазин - Купи NFT героев и драконов');

  return (
    <div className="min-h-screen bg-shop">
      <Shop onClose={() => navigate('/menu')} />
    </div>
  );
};