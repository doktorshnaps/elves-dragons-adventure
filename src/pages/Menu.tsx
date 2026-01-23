import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings, Swords } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNearBalances } from "@/hooks/useNearBalances";
import { useGameStore } from "@/stores/gameStore";
import { getXPProgress } from "@/utils/accountLeveling";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { SettingsMenu } from "@/components/SettingsMenu";
import { useBrightness } from "@/hooks/useBrightness";
import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageTitle";

// Import icons from assets
import grimoireIcon from "@/assets/grimoire-icon.webp";
import dungeonIcon from "@/assets/dungeon-icon.webp";
import shopIcon from "@/assets/shop-icon.webp";
import shelterIcon from "@/assets/shelter-icon.webp";
import walletIcon from "@/assets/wallet-icon.webp";

import moneyIcon from "@/assets/money-icon.webp";
import inventoryIcon from "@/assets/inventory-icon.webp";
import teamIcon from "@/assets/team-icon.webp";
import soulArchiveIcon from "@/assets/soul-archive-icon.webp";
export const Menu = () => {
  usePageMeta({ 
    title: 'Главное меню', 
    description: 'Эпическая фэнтези карточная игра с NFT на NEAR. Собирай героев и драконов, побеждай в подземельях, зарабатывай криптовалюту.' 
  });
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    gameData,
    loadGameData,
    loading: gameDataLoading
  } = useGameData();
  const {
    language
  } = useLanguage();
  const {
    brightness,
    backgroundBrightness
  } = useBrightness();
  const {
    accountId,
    nearAccountId,
    isLoading: isConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet
  } = useWalletContext();
  const isConnected = !!accountId;
  const {
    isAdmin
  } = useAdmin();
  const chainAccountId = nearAccountId || accountId || localStorage.getItem('nearAccountId') || localStorage.getItem('walletAccountId');
  const {
    nearBalance,
    gtBalance,
    loading: balancesLoading
  } = useNearBalances(chainAccountId);
  const {
    accountLevel,
    accountExperience
  } = useGameStore();
  const xpProgress = getXPProgress(accountExperience);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Отслеживаем первую загрузку данных
  useEffect(() => {
    if (isConnected && accountId && !gameDataLoading) {
      setInitialLoadComplete(true);
    }
  }, [isConnected, accountId, gameDataLoading]);

  // Показываем загрузку только при первой загрузке
  if (isConnected && !initialLoadComplete && gameDataLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-game-background">
        <div className="text-white text-xl">{t(language, 'menu.loadingMenu')}</div>
      </div>;
  }
  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    navigate('/auth');
  };
  return <div className="app-shell min-h-screen p-4 bg-center bg-no-repeat relative" style={{
    filter: `brightness(${brightness}%)`
  }}>
      <div className="absolute inset-0 bg-center bg-no-repeat" style={{
      backgroundImage: 'url("/menu-background.webp")',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: `brightness(${backgroundBrightness}%)`
    }} />
      <SettingsMenu />
      <div className="pointer-events-none absolute inset-0 bg-black/30 mx-0 my-0 py-0 px-0" />
      
      {/* Top Info Bar - Level and Balances */}
      <div className="relative z-10 w-full px-2 sm:px-4 mb-4 mt-2">
        <div className="flex-wrap px-[59px] pr-[62px] pb-0 mr-0 mb-0 ml-0 mt-0 pl-[3px] pt-0 items-center justify-between flex flex-row gap-0">
          {/* Account Level Display - Left */}
          <div className="bg-transparent backdrop-blur-sm px-3 py-2 sm:py-2.5 rounded-2xl border-2 border-black shadow-lg mx-0 sm:px-[17px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-black font-bold text-xs sm:text-base">Уровень {accountLevel}</span>
              <span className="text-[10px] sm:text-xs text-black/80">{xpProgress.currentLevelXP} / {xpProgress.nextLevelXP} exp</span>
            </div>
          </div>

          {/* Balance and Wallet Display - Right */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-transparent backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-black shadow-lg">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img src={walletIcon} alt="Balance" className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                <span className="text-black font-semibold text-xs sm:text-sm">{gameData.balance} {t(language, 'game.currency')}</span>
              </div>
            </div>

            {chainAccountId && <>
                <div className="bg-transparent backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-black shadow-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <img src={walletIcon} alt="NEAR" className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                    <span className="text-black font-semibold text-xs sm:text-sm">
                      {balancesLoading ? '...' : `${nearBalance} NEAR`}
                    </span>
                  </div>
                </div>

                <div className="bg-transparent backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-black shadow-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <img src={walletIcon} alt="GT" className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                    <span className="text-black font-semibold text-xs sm:text-sm">
                      {balancesLoading ? '...' : `${gtBalance} GT`}
                    </span>
                  </div>
                </div>
              </>}
            
            <div className="bg-transparent backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-black shadow-lg">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img src={walletIcon} alt="Wallet" className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                {isConnected ? <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-green-500 text-xs sm:text-sm">●</span>
                    <span className="text-black font-medium text-[10px] sm:text-xs">
                      {accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-3)}` : t(language, 'menu.connected')}
                    </span>
                  </div> : <Button size="sm" variant="outline" onClick={connectWallet} disabled={isConnecting} className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 h-5 sm:h-6 border-black text-black hover:bg-gray-50/80 bg-transparent rounded-xl">
                    {isConnecting ? t(language, 'menu.connecting') : t(language, 'menu.connectWallet')}
                  </Button>}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 my-[37px]">
        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/dungeons')}>
          <img src={dungeonIcon} alt="Dungeon" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.dungeon').toUpperCase()}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/shop')}>
          <img src={shopIcon} alt="Shop" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.magicShop').toUpperCase().replace(' ', '\n')}</span>
        </Button>


        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/grimoire')}>
          <img src={grimoireIcon} alt="Grimoire" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.grimoire').toUpperCase()}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/equipment')}>
          <img src={inventoryIcon} alt="Inventory" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.inventory').toUpperCase()}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/team')}>
          <img src={teamIcon} alt="Team" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.team').toUpperCase()}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/quest')}>
          <img src={moneyIcon} alt="Money" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.quest').toUpperCase()}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/shelter')}>
          <img src={shelterIcon} alt="Shelter" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.camp').toUpperCase()}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/soul-archive')}>
          <img src={soulArchiveIcon} alt="Soul Archive" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.soulArchive').toUpperCase().replace(' ', '\n')}</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/seekers')}>
          <img src={moneyIcon} alt="Seekers" className="w-[23px] h-[23px]" />
          <span className="text-base font-semibold leading-tight text-center">ИСКАТЕЛИ</span>
        </Button>

        <Button variant="outline" className="h-36 bg-black/50 border-2 border-amber-500 rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/pvp')}>
          <Swords className="w-[23px] h-[23px] text-amber-500" />
          <span className="text-base font-semibold leading-tight text-center">PVP<br/>АРЕНА</span>
        </Button>
      </div>

      {/* Admin Button - для всех админов */}
      {isAdmin && <div className="relative z-10 max-w-4xl mx-auto mt-8">
          <Button variant="outline" className="h-36 w-full bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }} onClick={() => navigate('/admin-settings')}>
            <Settings className="w-[23px] h-[23px]" />
            <span className="text-base font-semibold leading-tight text-center">{t(language, 'menu.gameSettings').toUpperCase().replace(' ', '\n')}</span>
          </Button>
        </div>}
      
    </div>;
};