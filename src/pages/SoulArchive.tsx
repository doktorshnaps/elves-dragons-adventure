import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Sparkles } from "lucide-react";
import { useBrightness } from "@/hooks/useBrightness";
import { SoulAltarTab } from "@/components/soul-altar/SoulAltarTab";
import { usePageMeta } from "@/hooks/usePageTitle";

export const SoulArchive = () => {
  usePageMeta({ 
    title: 'Алтарь Душ', 
    description: 'Пожертвуйте Кристаллы Жизни на Алтарь Душ и поднимитесь в рейтинге доноров!' 
  });
  const navigate = useNavigate();
  const { brightness, backgroundBrightness } = useBrightness();

  return (
    <div className="h-screen relative flex flex-col" style={{ filter: `brightness(${brightness}%)` }}>
      {/* Фон с эффектом */}
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
      
      {/* Оверлей с градиентом для мистической атмосферы */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black/30 to-purple-900/20" />
      
      {/* Декоративные эффекты */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Навигация */}
          <Button
            variant="outline"
            onClick={() => navigate('/menu')}
            className="mb-6 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white backdrop-blur-sm"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад в меню
          </Button>

          {/* Заголовок страницы */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-4 mb-4">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <Flame className="w-16 h-16 text-purple-400 relative animate-pulse" />
              </div>
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
              Алтарь Душ
            </h1>
            <p className="text-purple-200/80 text-lg max-w-md mx-auto">
              Принесите в жертву Кристаллы Жизни и обретите вечную славу среди избранных
            </p>
          </div>

          {/* Основной контент - SoulAltarTab */}
          <SoulAltarTab />
        </div>
      </div>
    </div>
  );
};