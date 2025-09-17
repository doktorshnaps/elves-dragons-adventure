import { CardsInfo } from "@/components/game/CardsInfo";
import { DungeonInfo } from "@/components/game/DungeonInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Book, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Grimoire = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen h-screen p-4 bg-cover bg-center bg-no-repeat flex flex-col"
      style={{
        backgroundImage: "url('/lovable-uploads/20d88f7a-4f27-4b22-8ebe-e55b87a0c7e3.png')",
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
        <h1 className="text-2xl font-bold text-game-accent">Гримуар</h1>
      </div>
      
      <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm overflow-y-auto">
        <Tabs defaultValue="cards" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2 bg-game-surface/50 border border-game-accent/30 mb-6">
            <TabsTrigger 
              value="cards" 
              className="data-[state=active]:bg-game-accent data-[state=active]:text-black flex items-center gap-2"
            >
              <Book className="w-4 h-4" />
              Карты
            </TabsTrigger>
            <TabsTrigger 
              value="dungeons" 
              className="data-[state=active]:bg-game-accent data-[state=active]:text-black flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              Подземелья
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="mt-0 h-full">
            <CardsInfo />
          </TabsContent>
          
          <TabsContent value="dungeons" className="mt-0 h-full">
            <DungeonInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};