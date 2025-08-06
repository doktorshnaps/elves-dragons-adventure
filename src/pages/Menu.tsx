import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Swords, ShoppingCart, BookOpen, Store, Shield, Users, BarChart3, MapPin, DollarSign } from "lucide-react";
import { useGameInitialization } from "@/components/game/initialization/useGameInitialization";
import { FirstTimePackDialog } from "@/components/game/initialization/FirstTimePackDialog";
import { useState, useEffect } from "react";

export const Menu = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const { showFirstTimePack, setShowFirstTimePack } = useGameInitialization(setCards);

  // Слушаем обновления карт
  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{ cards: any[] }>) => {
      setCards(e.detail.cards);
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    };
  }, []);

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/dungeons')}
        >
          <Swords className="w-8 h-8" />
          <span>Подземелье</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/shop')}
        >
          <ShoppingCart className="w-8 h-8" />
          <span>Магический магазин</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/marketplace')}
        >
          <Store className="w-8 h-8" />
          <span>Торговая площадка</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/grimoire')}
        >
          <BookOpen className="w-8 h-8" />
          <span>Гримуар</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/adventure')}
        >
          <MapPin className="w-8 h-8" />
          <span>Приключения</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/statistics')}
        >
          <BarChart3 className="w-8 h-8" />
          <span>Статистика</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/equipment')}
        >
          <Shield className="w-8 h-8" />
          <span>Снаряжение</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/team')}
        >
          <Users className="w-8 h-8" />
          <span>Команда</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/quest')}
        >
          <DollarSign className="w-8 h-8" />
          <span>Бабло</span>
        </Button>
      </div>

      <FirstTimePackDialog
        isOpen={showFirstTimePack}
        onClose={() => setShowFirstTimePack(false)}
      />
    </div>
  );
};