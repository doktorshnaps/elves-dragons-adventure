import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-game-background border-game-accent hover:bg-game-surface"
    >
      <Globe className="w-4 h-4" />
      <span className="text-game-accent font-medium">
        {language.toUpperCase()}
      </span>
    </Button>
  );
};