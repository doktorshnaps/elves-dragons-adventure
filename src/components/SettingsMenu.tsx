import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Sun, Menu, Volume2, VolumeX, LogOut, BookOpen, UserPen, Check, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrightness } from "@/hooks/useBrightness";
import { useMusic } from "@/hooks/useMusic";
import { Slider } from "@/components/ui/slider";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useNavigate } from "react-router-dom";
import { t } from "@/utils/translations";
import { useDisplayName } from "@/hooks/useDisplayName";
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
  const { disconnect: disconnectWallet, accountId } = useWalletContext();
  const navigate = useNavigate();
  const { displayName, updateDisplayName, isUpdating } = useDisplayName();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    navigate('/auth');
  };

  const handleStartEdit = () => {
    setNameInput(displayName || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      await updateDisplayName(nameInput.trim());
      setIsEditingName(false);
    } catch {
      // toast handled in hook
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNameInput("");
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
        className="w-52 bg-black/70 backdrop-blur-sm border-2 border-white rounded-3xl z-[100] p-2"
        style={{ boxShadow: '-15px 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <DropdownMenuLabel className="text-white font-semibold text-center text-sm mb-1">
          {language === 'ru' ? 'Настройки' : 'Settings'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/30 mb-2" />

        {/* Display Name Section */}
        <div
          className="bg-black/30 border-2 border-white rounded-2xl p-2.5 mb-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <UserPen className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-white font-medium text-xs">
                  {language === 'ru' ? 'Имя аккаунта' : 'Account Name'}
                </span>
              </div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                placeholder={language === 'ru' ? 'Введите имя...' : 'Enter name...'}
                className="w-full bg-black/40 border border-white/30 rounded-lg px-2 py-1.5 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/60"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <p className="text-[9px] text-yellow-400/70 leading-tight">
                ⚠️ {language === 'ru' 
                  ? 'Оскорбительные имена запрещены. Нарушение — блокировка аккаунта.' 
                  : 'Offensive names are prohibited. Violation may result in account ban.'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">{nameInput.length}/20</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleSaveName}
                    disabled={isUpdating || nameInput.trim().length < 2}
                    className="p-1 rounded-md hover:bg-white/10 text-green-400 hover:text-green-300 disabled:opacity-40"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              className="w-full flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <UserPen className="w-4 h-4 text-white" />
              <span className="text-white font-medium text-xs truncate">
                {displayName 
                  ? displayName 
                  : (language === 'ru' ? 'Задать имя' : 'Set Name')
                }
              </span>
            </button>
          )}
        </div>
        
        <button
          onClick={toggleLanguage}
          className="w-full bg-black/30 border-2 border-white rounded-2xl p-2 mb-2 hover:bg-black/40 transition-all flex items-center justify-center gap-1.5"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <Globe className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">
            {language === 'ru' ? 'Русский' : 'English'}
          </span>
        </button>

        <button
          onClick={() => navigate('/tutorial')}
          className="w-full bg-black/30 border-2 border-white rounded-2xl p-2 mb-2 hover:bg-black/40 transition-all flex items-center justify-center gap-1.5"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <BookOpen className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">
            {language === 'ru' ? 'Обучение' : 'Tutorial'}
          </span>
        </button>

        <div 
          className="bg-black/30 border-2 border-white rounded-2xl p-2.5 mb-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-2">
            <Sun className="w-4 h-4 mr-1.5 text-white" />
            <span className="text-white font-medium text-xs">
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
          className="bg-black/30 border-2 border-white rounded-2xl p-2.5 mb-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-2">
            <Sun className="w-4 h-4 mr-1.5 text-white" />
            <span className="text-white font-medium text-xs">
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
          className="w-full bg-black/30 border-2 border-white rounded-2xl p-2 mb-2 hover:bg-black/40 transition-all flex items-center justify-center gap-1.5"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          {isPlaying ? (
            <Volume2 className="w-4 h-4 text-white" />
          ) : (
            <VolumeX className="w-4 h-4 text-white" />
          )}
          <span className="text-white font-medium text-sm">
            {language === 'ru' 
              ? (isPlaying ? 'Музыка вкл' : 'Музыка выкл')
              : (isPlaying ? 'Music On' : 'Music Off')
            }
          </span>
        </button>

        <div 
          className="bg-black/30 border-2 border-white rounded-2xl p-2.5 mb-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-2">
            <Volume2 className="w-4 h-4 mr-1.5 text-white" />
            <span className="text-white font-medium text-xs">
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
          className="w-full bg-red-600/80 border-2 border-white rounded-2xl p-2 hover:bg-red-700/80 transition-all flex items-center justify-center gap-1.5"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <LogOut className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-xs">
            {t(language, 'menu.disconnectWallet')}
          </span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
