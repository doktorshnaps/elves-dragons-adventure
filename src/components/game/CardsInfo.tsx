import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { CardGrid } from "./cards/CardGrid";

export const CardsInfo = () => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  return (
    <Tabs defaultValue="heroes" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl text-[10px] sm:text-xs">
        <TabsTrigger value="heroes" className="text-white data-[state=active]:bg-white/20 rounded-3xl">
          {t(language, 'grimoire.heroes')}
        </TabsTrigger>
        <TabsTrigger value="pets" className="text-white data-[state=active]:bg-white/20 rounded-3xl">
          {t(language, 'grimoire.pets')}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="heroes">
        <CardGrid type="character" />
      </TabsContent>
      
      <TabsContent value="pets">
        <CardGrid type="pet" />
      </TabsContent>
    </Tabs>
  );
};