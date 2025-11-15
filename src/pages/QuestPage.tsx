import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ReferralTab } from "@/components/game/ReferralTab";
import { SocialQuests } from "@/components/game/SocialQuests";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

export const QuestPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen p-4 relative">
      <div 
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/menu-background.webp")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="max-w-4xl mx-auto relative z-10">
        <Button
          variant="menu"
          className="mb-4"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/menu')}
        >
          {t(language, 'quest.backToMenu')}
        </Button>
        
        <h1 className="text-2xl text-white mb-6">{t(language, 'quest.title')}</h1>
        
        <Tabs defaultValue="quests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50 border-2 border-white backdrop-blur-sm rounded-3xl" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <TabsTrigger 
              value="quests" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-3xl"
            >
              {t(language, 'quest.quests')}
            </TabsTrigger>
            <TabsTrigger 
              value="referrals" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-3xl"
            >
              {t(language, 'quest.referrals')}
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