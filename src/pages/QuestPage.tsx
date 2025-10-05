import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ReferralTab } from "@/components/game/ReferralTab";
import { SocialQuests } from "@/components/game/SocialQuests";

export const QuestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 bg-game-surface">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-4 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/menu')}
        >
          Вернуться в меню
        </Button>
        
        <h1 className="text-2xl text-game-accent mb-6">Квесты и Рефералы</h1>
        
        <Tabs defaultValue="quests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-game-surface/80 border border-game-accent">
            <TabsTrigger 
              value="quests" 
              className="text-game-accent data-[state=active]:bg-game-accent data-[state=active]:text-game-surface"
            >
              Квесты
            </TabsTrigger>
            <TabsTrigger 
              value="referrals" 
              className="text-game-accent data-[state=active]:bg-game-accent data-[state=active]:text-game-surface"
            >
              Рефералы
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quests" className="mt-6">
            <SocialQuests />
          </TabsContent>
          
          <TabsContent value="referrals" className="mt-6">
            <ReferralTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};