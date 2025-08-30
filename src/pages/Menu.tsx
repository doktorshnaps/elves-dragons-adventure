import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Swords, ShoppingCart, BookOpen, Store, Shield, Users, DollarSign, LogOut, Home, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { useGameInitialization } from "@/components/game/initialization/useGameInitialization";
import { FirstTimePackDialog } from "@/components/game/initialization/FirstTimePackDialog";
import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect } from "react";
export const Menu = () => {
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    gameData,
    updateGameData
  } = useGameData();
  const [cards, setCards] = useState(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });
  const {
    showFirstTimePack,
    setShowFirstTimePack
  } = useGameInitialization(setCards);
  
  const { isConnected, accountId, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast({
        title: "Ошибка выхода",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из игры"
      });
      navigate('/auth');
    }
  };

  // Слушаем обновления карт
  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{
      cards: any[];
    }>) => {
      setCards(e.detail.cards);
    };
    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    };
  }, []);
  return <div className="min-h-screen p-4 bg-cover bg-center bg-no-repeat" style={{
    backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      <div className="absolute inset-0 bg-black/30 mx-0 my-0 py-0 px-0" />
      
      {/* Balance and Wallet Display */}
      <div className="relative z-10 max-w-4xl mx-auto flex justify-center items-center gap-4 mb-4">
        <div className="bg-game-surface/90 px-6 py-3 rounded-lg border border-game-accent">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-game-accent" />
            <span className="text-game-accent font-semibold">Баланс: {gameData.balance} ELL</span>
          </div>
        </div>
        
        <div className="bg-game-surface/90 px-6 py-3 rounded-lg border border-game-accent">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-game-accent" />
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">●</span>
                <span className="text-game-accent font-medium text-sm">
                  {accountId ? `${accountId.slice(0, 8)}...${accountId.slice(-4)}` : 'Подключен'}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={disconnectWallet}
                  className="text-xs px-2 py-1 h-6 border-red-500 text-red-500 hover:bg-red-500/20"
                >
                  Отключить
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={connectWallet}
                disabled={isConnecting}
                className="text-xs px-3 py-1 h-6 border-game-accent text-game-accent hover:bg-game-accent/20"
              >
                {isConnecting ? 'Подключение...' : 'Подключить кошелек'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8 my-[37px]">
        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/dungeons')}>
          <Swords className="w-8 h-8" />
          <span>Подземелье</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/shop')}>
          <ShoppingCart className="w-8 h-8" />
          <span>Магический магазин</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/marketplace')}>
          <Store className="w-8 h-8" />
          <span>Торговая площадка</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/grimoire')}>
          <BookOpen className="w-8 h-8" />
          <span>Гримуар</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/equipment')}>
          <Shield className="w-8 h-8" />
          <span>Инвентарь</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/team')}>
          <Users className="w-8 h-8" />
          <span>Команда</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/quest')}>
          <DollarSign className="w-8 h-8" />
          <span>Бабло</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface flex flex-col items-center justify-center gap-2" onClick={() => navigate('/shelter')}>
          <Home className="w-8 h-8" />
          <span>Убежище</span>
        </Button>

        <Button variant="outline" className="h-24 bg-game-surface/80 border-red-500 text-red-500 hover:bg-red-500/20 flex flex-col items-center justify-center gap-2" onClick={handleSignOut}>
          <LogOut className="w-8 h-8" />
          <span>Выход</span>
        </Button>
      </div>

      <FirstTimePackDialog isOpen={showFirstTimePack} onClose={() => setShowFirstTimePack(false)} />
    </div>;
};