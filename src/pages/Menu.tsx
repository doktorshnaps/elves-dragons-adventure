import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Swords, ShoppingCart, BookOpen, Store, Shield, Users, DollarSign, LogOut, Home, Wallet, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { useWallet } from "@/hooks/useWallet";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminConsoleWithWhitelist } from "@/components/AdminConsole";

import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useState, useEffect } from "react";
export const Menu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { gameData, loadGameData } = useGameData();
  
  const { language } = useLanguage();
  const {
    isConnected,
    accountId,
    isConnecting,
    connectWallet,
    disconnectWallet
  } = useWallet();
  const { isAdmin } = useAdminCheck();

  // Загружаем данные при подключении кошелька
  useEffect(() => {
    if (isConnected && accountId) {
      console.log('🔄 Loading game data for connected wallet:', accountId);
      loadGameData(accountId);
    }
  }, [isConnected, accountId, loadGameData]);
  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    navigate('/auth');
  };

  return <div className="app-shell min-h-screen p-4 bg-cover bg-center bg-no-repeat" style={{
    backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      <LanguageToggle />
      <div className="pointer-events-none absolute inset-0 bg-black/30 mx-0 my-0 py-0 px-0" />
      
      {/* Balance and Wallet Display */}
      <div className="relative z-10 max-w-4xl mx-auto flex justify-center items-center gap-4 mb-4">
        <div className="bg-transparent backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-black shadow-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-black" />
            <span className="text-black font-semibold">{t(language, 'menu.balance')} {gameData.balance} {t(language, 'game.currency')}</span>
          </div>
        </div>
        
        <div className="bg-transparent backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-black shadow-lg">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-black" />
            {isConnected ? <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">●</span>
                <span className="text-black font-medium text-sm">
                  {accountId ? `${accountId.slice(0, 8)}...${accountId.slice(-4)}` : t(language, 'menu.connected')}
                </span>
                
              </div> : <Button size="sm" variant="outline" onClick={connectWallet} disabled={isConnecting} className="text-xs px-3 py-1 h-6 border-black text-black hover:bg-gray-50/80 bg-transparent rounded-xl">
                {isConnecting ? t(language, 'menu.connecting') : t(language, 'menu.connectWallet')}
              </Button>}
          </div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8 my-[37px]">
        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/dungeons')}
        >
          <Swords className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.dungeon')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/shop')}
        >
          <ShoppingCart className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.shop')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/marketplace')}
        >
          <Store className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.marketplace')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/grimoire')}
        >
          <BookOpen className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.grimoire')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/equipment')}
        >
          <Shield className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.inventory')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/team')}
        >
          <Users className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.team')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/quest')}
        >
          <DollarSign className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.quest')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-black rounded-2xl text-black hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={() => navigate('/shelter')}
        >
          <Home className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.shelter')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-32 bg-transparent border-2 border-red-600 rounded-2xl text-red-600 hover:bg-red-50/80 transition-all flex flex-col items-center justify-center gap-3 shadow-lg backdrop-blur-sm"
          onClick={handleDisconnectWallet}
        >
          <LogOut className="w-10 h-10" />
          <span className="text-sm font-medium">{t(language, 'menu.disconnectWallet')}</span>
        </Button>
      </div>

      {/* Admin Buttons - только для суперадмина */}
      {accountId === 'mr_bruts.tg' && (
        <div className="relative z-10 max-w-4xl mx-auto mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 bg-purple-500/80 border-purple-300 text-white hover:bg-purple-600 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin-settings')}
            >
              <Settings className="w-6 h-6" />
              <span>Настройки игры</span>
            </Button>
          </div>
          <AdminConsoleWithWhitelist />
        </div>
      )}

      {/* Управление вайт-листом и блокировками - для обычных админов */}
      {accountId !== 'mr_bruts.tg' && isAdmin && (
        <div className="relative z-10 max-w-4xl mx-auto mt-8 space-y-4">
          <AdminConsoleWithWhitelist />
        </div>
      )}
      

      
    </div>;
};