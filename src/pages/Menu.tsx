import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNearBalances } from "@/hooks/useNearBalances";

import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { SettingsMenu } from "@/components/SettingsMenu";
import { useBrightness } from "@/hooks/useBrightness";
import { useState, useEffect } from "react";

// Import icons - temporarily using placeholder until webp files are uploaded
const grimoireIcon = "/placeholder.svg";
const dungeonIcon = "/placeholder.svg";
const shopIcon = "/placeholder.svg";
const shelterIcon = "/placeholder.svg";
const walletIcon = "/placeholder.svg";
const marketplaceIcon = "/placeholder.svg";
const moneyIcon = "/placeholder.svg";
const inventoryIcon = "/placeholder.svg";
const teamIcon = "/placeholder.svg";
const soulArchiveIcon = "/placeholder.svg";
export const Menu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { gameData, loadGameData, loading: gameDataLoading } = useGameData();
  
  const { language } = useLanguage();
  const { brightness, backgroundBrightness } = useBrightness();
  const {
    accountId,
    nearAccountId,
    isLoading: isConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet
  } = useWalletContext();
  const isConnected = !!accountId;
  const { isAdmin } = useAdminCheck();
  const chainAccountId = nearAccountId || accountId || localStorage.getItem('nearAccountId') || localStorage.getItem('walletAccountId');
  const { nearBalance, gtBalance, loading: balancesLoading } = useNearBalances(chainAccountId);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Загружаем данные при подключении кошелька
  useEffect(() => {
    if (isConnected && accountId && !gameDataLoading) {
      console.log('🔄 Loading game data for connected wallet:', accountId);
      loadGameData(accountId).then(() => {
        setInitialLoadComplete(true);
      });
    }
  }, [isConnected, accountId]);
  
  // Показываем загрузку только при первой загрузке
  if (isConnected && !initialLoadComplete && gameDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-game-background">
        <div className="text-white text-xl">{t(language, 'menu.loadingMenu')}</div>
      </div>
    );
  }
  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    navigate('/auth');
  };

  console.log('[Menu] Wallet/Balances:', { accountId, nearAccountId, chainAccountId, isConnected, balancesLoading, nearBalance, gtBalance });
  return <div className="app-shell min-h-screen p-4 bg-center bg-no-repeat relative" style={{ filter: `brightness(${brightness}%)` }}>
      <div 
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/menu-background.webp")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: `brightness(${backgroundBrightness}%)`
        }}
      />
      <SettingsMenu />
      <div className="pointer-events-none absolute inset-0 bg-black/30 mx-0 my-0 py-0 px-0" />
      
      {/* Balance and Wallet Display */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-4 mb-4">
        <div className="bg-transparent backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-black shadow-lg">
          <div className="flex items-center gap-2">
            <img src={walletIcon} alt="Balance" className="w-[23px] h-[23px]" />
            <span className="text-black font-semibold">{t(language, 'menu.balance')} {gameData.balance} {t(language, 'game.currency')}</span>
          </div>
        </div>

        {chainAccountId && (
          <>
            <div className="bg-transparent backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-black shadow-lg">
              <div className="flex items-center gap-2">
                <img src={walletIcon} alt="NEAR" className="w-[23px] h-[23px]" />
                <span className="text-black font-semibold">
                  {balancesLoading ? '...' : `${nearBalance} NEAR`}
                </span>
              </div>
            </div>

            <div className="bg-transparent backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-black shadow-lg">
              <div className="flex items-center gap-2">
                <img src={walletIcon} alt="GT" className="w-[23px] h-[23px]" />
                <span className="text-black font-semibold">
                  {balancesLoading ? '...' : `${gtBalance} GT`}
                </span>
              </div>
            </div>
          </>
        )}
        
        <div className="bg-transparent backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-black shadow-lg">
          <div className="flex items-center gap-2">
            <img src={walletIcon} alt="Wallet" className="w-[23px] h-[23px]" />
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
      
      <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 my-[37px]">
        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/dungeons')}
        >
          <img src={dungeonIcon} alt="Dungeon" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.dungeon').toUpperCase()}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/shop')}
        >
          <img src={shopIcon} alt="Shop" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.magicShop').toUpperCase().replace(' ', '\n')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/marketplace')}
        >
          <img src={marketplaceIcon} alt="Marketplace" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.tradingPlatform').toUpperCase().replace(' ', '\n')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/grimoire')}
        >
          <img src={grimoireIcon} alt="Grimoire" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.grimoire').toUpperCase()}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/equipment')}
        >
          <img src={inventoryIcon} alt="Inventory" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.inventory').toUpperCase()}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/team')}
        >
          <img src={teamIcon} alt="Team" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.team').toUpperCase()}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/quest')}
        >
          <img src={moneyIcon} alt="Money" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.quest').toUpperCase()}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/shelter')}
        >
          <img src={shelterIcon} alt="Shelter" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.camp').toUpperCase()}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/soul-archive')}
        >
          <img src={soulArchiveIcon} alt="Soul Archive" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.soulArchive').toUpperCase().replace(' ', '\n')}</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={handleDisconnectWallet}
        >
          <img src={walletIcon} alt="Disconnect" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.disconnectWallet').toUpperCase().replace(' ', '\n')}</span>
        </Button>
      </div>

      {/* Admin Button - для всех админов */}
      {isAdmin && (
        <div className="relative z-10 max-w-4xl mx-auto mt-8">
          <Button 
            variant="outline" 
            className="h-36 w-full bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
            onClick={() => navigate('/admin-settings')}
          >
            <Settings className="w-[23px] h-[23px]" />
            <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.gameSettings').toUpperCase().replace(' ', '\n')}</span>
          </Button>
        </div>
      )}
      
    </div>;
};