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
          size="sm"
          className="fixed top-4 right-4 z-50 bg-game-background border-game-accent hover:bg-game-surface"
        >
          <Menu className="w-5 h-5 text-game-accent" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-game-background border-game-accent z-[100]"
      >
        <DropdownMenuLabel className="text-game-accent">
          {language === 'ru' ? 'Настройки' : 'Settings'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-game-accent/20" />
        
        <DropdownMenuItem 
          onClick={toggleLanguage}
          className="cursor-pointer hover:bg-game-surface focus:bg-game-surface"
        >
          <Globe className="w-4 h-4 mr-2 text-game-accent" />
          <span className="text-game-text">
            {language === 'ru' ? 'Язык: Русский' : 'Language: English'}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-game-accent/20" />
        
        <div className="px-2 py-3">
          <div className="flex items-center mb-2">
            <Sun className="w-4 h-4 mr-2 text-game-accent" />
            <span className="text-sm text-game-text">
              {language === 'ru' ? 'Яркость' : 'Brightness'}: {brightness}%
            </span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            min={30}
            max={100}
            step={5}
            className="cursor-pointer"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
