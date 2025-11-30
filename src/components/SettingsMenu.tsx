import { Button } from "@/components/ui/button";
import { Globe, Sun, Menu, Volume2, VolumeX, LogOut } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrightness } from "@/hooks/useBrightness";
import { useMusic } from "@/hooks/useMusic";
import { Slider } from "@/components/ui/slider";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useNavigate } from "react-router-dom";
import { t } from "@/utils/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const SettingsMenu = () => {
  const { language, toggleLanguage } = useLanguage();
  const { brightness, setBrightness, backgroundBrightness, setBackgroundBrightness } = useBrightness();
  const { volume, setVolume, isPlaying, setIsPlaying } = useMusic();
  const { disconnect: disconnectWallet } = useWalletContext();
  const navigate = useNavigate();

  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    navigate('/auth');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="fixed top-4 right-4 z-50 bg-black/30 border-2 border-white rounded-3xl hover:bg-black/40 backdrop-blur-sm p-3"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <Menu className="w-5 h-5 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-black/70 backdrop-blur-sm border-2 border-white rounded-3xl z-[100] p-4"
        style={{ boxShadow: '-15px 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <DropdownMenuLabel className="text-white font-bold text-center mb-2">
          {language === 'ru' ? 'Настройки' : 'Settings'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/30 mb-3" />
        
        <button
          onClick={toggleLanguage}
          className="w-full bg-black/30 border-2 border-white rounded-2xl p-3 mb-3 hover:bg-black/40 transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <Globe className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">
            {language === 'ru' ? 'Русский' : 'English'}
          </span>
        </button>

        <div 
          className="bg-black/30 border-2 border-white rounded-2xl p-4 mb-3"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-3">
            <Sun className="w-5 h-5 mr-2 text-white" />
            <span className="text-white font-semibold">
              {language === 'ru' ? 'Яркость экрана' : 'Screen Brightness'}: {brightness}%
            </span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            min={50}
            max={150}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <div 
          className="bg-black/30 border-2 border-white rounded-2xl p-4 mb-3"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-3">
            <Sun className="w-5 h-5 mr-2 text-white" />
            <span className="text-white font-semibold">
              {language === 'ru' ? 'Яркость фона' : 'Background Brightness'}: {backgroundBrightness}%
            </span>
          </div>
          <Slider
            value={[backgroundBrightness]}
            onValueChange={(value) => setBackgroundBrightness(value[0])}
            min={50}
            max={150}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full bg-black/30 border-2 border-white rounded-2xl p-3 mb-3 hover:bg-black/40 transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          {isPlaying ? (
            <Volume2 className="w-5 h-5 text-white" />
          ) : (
            <VolumeX className="w-5 h-5 text-white" />
          )}
          <span className="text-white font-semibold">
            {language === 'ru' 
              ? (isPlaying ? 'Музыка вкл' : 'Музыка выкл')
              : (isPlaying ? 'Music On' : 'Music Off')
            }
          </span>
        </button>

        <div 
          className="bg-black/30 border-2 border-white rounded-2xl p-4 mb-3"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-3">
            <Volume2 className="w-5 h-5 mr-2 text-white" />
            <span className="text-white font-semibold">
              {language === 'ru' ? 'Общая громкость' : 'Master Volume'}: {volume}%
            </span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            min={0}
            max={100}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <button
          onClick={handleDisconnectWallet}
          className="w-full bg-red-600/80 border-2 border-white rounded-2xl p-2.5 hover:bg-red-700/80 transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <LogOut className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">
            {t(language, 'menu.disconnectWallet')}
          </span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
