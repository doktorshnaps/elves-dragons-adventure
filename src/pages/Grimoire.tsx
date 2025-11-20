import { CardsInfo } from "@/components/game/CardsInfo";
import { DungeonInfo } from "@/components/game/DungeonInfo";
import { ItemsInfo } from "@/components/game/ItemsInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Book, Swords, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useGrimoireImagePreloader } from "@/hooks/useImagePreloader";

const Grimoire = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  // Предзагрузка всех изображений гримуара с высоким приоритетом
  useGrimoireImagePreloader();

  return (
    <div className="min-h-screen h-screen p-4 bg-game-background flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="menu"
          className="shadow-lg"
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t(language, 'common.backToMenu')}
        </Button>
        <h1 className="text-2xl font-bold text-white">{t(language, 'grimoire.title')}</h1>
      </div>
      
      <div className="flex-1 bg-black/50 border-2 border-white rounded-3xl backdrop-blur-sm p-4 overflow-y-auto" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <Tabs defaultValue="cards" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl mb-6">
            <TabsTrigger 
              value="cards" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white flex items-center gap-2 rounded-3xl"
            >
              <Book className="w-4 h-4" />
              {t(language, 'grimoire.cards')}
            </TabsTrigger>
            <TabsTrigger 
              value="dungeons" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white flex items-center gap-2 rounded-3xl"
            >
              <Swords className="w-4 h-4" />
              {t(language, 'grimoire.dungeons')}
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white flex items-center gap-2 rounded-3xl"
            >
              <Package className="w-4 h-4" />
              {t(language, 'grimoire.items')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="mt-0 h-full">
            <CardsInfo />
          </TabsContent>
          
          <TabsContent value="dungeons" className="mt-0 h-full">
            <DungeonInfo />
          </TabsContent>
          
          <TabsContent value="items" className="mt-0 h-full">
            <ItemsInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Grimoire;