import { Button } from "@/components/ui/button";
import { Globe, Sun, Menu } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrightness } from "@/hooks/useBrightness";
import { Slider } from "@/components/ui/slider";
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
  const { brightness, setBrightness } = useBrightness();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="fixed top-4 right-4 z-50 bg-transparent border-2 border-black rounded-3xl hover:bg-gray-50/80 backdrop-blur-sm p-3"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <Menu className="w-5 h-5 text-black" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-transparent backdrop-blur-sm border-2 border-black rounded-3xl z-[100] p-4"
        style={{ boxShadow: '-15px 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <DropdownMenuLabel className="text-black font-bold text-center mb-2">
          {language === 'ru' ? 'Настройки' : 'Settings'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-black/30 mb-3" />
        
        <button
          onClick={toggleLanguage}
          className="w-full bg-transparent border-2 border-black rounded-2xl p-3 mb-3 hover:bg-gray-50/80 transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <Globe className="w-5 h-5 text-black" />
          <span className="text-black font-semibold">
            {language === 'ru' ? 'Русский' : 'English'}
          </span>
        </button>

        <div 
          className="bg-transparent border-2 border-black rounded-2xl p-4"
          style={{ boxShadow: '-10px 10px 8px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-center mb-3">
            <Sun className="w-5 h-5 mr-2 text-black" />
            <span className="text-black font-semibold">
              {language === 'ru' ? 'Яркость' : 'Brightness'}: {brightness}%
            </span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            min={50}
            max={100}
            step={5}
            className="cursor-pointer"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
