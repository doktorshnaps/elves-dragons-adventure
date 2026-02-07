import React from "react";
import { useNavigate } from "react-router-dom";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameSettings } from "@/components/admin/GameSettings";
import { DungeonSettings } from "@/components/admin/DungeonSettings";
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { CardUpgradeManager } from "@/components/admin/CardUpgradeManager";
import { CardClassDropRates } from "@/components/admin/CardClassDropRates";
import { CraftingRecipeManager } from "@/components/admin/CraftingRecipeManager";
import { QuestManagement } from "@/components/admin/QuestManagement";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminConsoleWithWhitelist } from "@/components/AdminConsole";
import { CardImageManager } from "@/components/admin/CardImageManager";
import { CardImageBatchUpload } from "@/components/admin/CardImageBatchUpload";
import { ItemTemplateManager } from "@/components/admin/ItemTemplateManager";
import { usePageMeta } from "@/hooks/usePageTitle";
import { ItemGiveawayManager } from "@/components/admin/ItemGiveawayManager";
import ShelterBuildingSettings from "@/components/admin/ShelterBuildingSettings";
import { TreasureHuntAdmin } from "@/components/admin/TreasureHuntAdmin";
import { ShopSettings } from "@/components/admin/ShopSettings";
import { PlayerManagement } from "@/components/admin/PlayerManagement";
import { GameMetrics } from "@/components/admin/GameMetrics";
import { MgtExchangeAdmin } from "@/components/admin/MgtExchangeAdmin";
import { PvPSeasonAdmin } from "@/components/admin/PvPSeasonAdmin";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";

const AdminSettingsContent = () => {
  usePageMeta({ title: 'Админ панель', description: 'Панель управления игрой ElleonorAI для администраторов.' });
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { accountId } = useWalletContext();
  const { isAdmin, loading } = useAdmin();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdminCheck();

  // Show loading while checking admin status
  if (loading || superAdminLoading) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-300">{t(language, 'admin.checkingAccess')}</p>
        </div>
      </div>
    );
  }

  // Проверка прав доступа - для всех админов
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">{t(language, 'admin.accessDenied')}</h1>
          <p className="text-gray-300 mb-6">{t(language, 'admin.noPermission')}</p>
          <Button onClick={() => navigate('/menu')}>
            {t(language, 'admin.returnToMenu')}
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t(language, 'admin.title')}</h1>
            <p className="text-white/70">{t(language, 'admin.subtitle')}</p>
          </div>
          <Button
            variant="menu"
            onClick={() => navigate('/menu')}
            className="gap-2"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t(language, 'admin.backToMenu')}
          </Button>
        </div>

        <Tabs defaultValue={isSuperAdmin ? "metrics" : "management"} className="w-full">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-16' : 'grid-cols-1'} bg-black/50 border-2 border-white backdrop-blur-sm rounded-3xl mb-6`} style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="metrics" className="text-white data-[state=active]:bg-white/20 rounded-3xl">📊 Метрики</TabsTrigger>
                <TabsTrigger value="cards" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.cards')}</TabsTrigger>
                <TabsTrigger value="cardImages" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.cardImages')}</TabsTrigger>
                <TabsTrigger value="dungeons" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.dungeons')}</TabsTrigger>
                <TabsTrigger value="quests" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.quests')}</TabsTrigger>
                <TabsTrigger value="items" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.items')}</TabsTrigger>
                <TabsTrigger value="giveaway" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.giveaway')}</TabsTrigger>
                <TabsTrigger value="shelter" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.shelter')}</TabsTrigger>
                <TabsTrigger value="card-upgrades" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.cardUpgrades')}</TabsTrigger>
                <TabsTrigger value="card-drops" className="text-white data-[state=active]:bg-white/20 rounded-3xl">Шансы колод</TabsTrigger>
                <TabsTrigger value="crafting" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.crafting')}</TabsTrigger>
                <TabsTrigger value="seekers" className="text-white data-[state=active]:bg-white/20 rounded-3xl">Искатели</TabsTrigger>
                <TabsTrigger value="shop" className="text-white data-[state=active]:bg-white/20 rounded-3xl">Магазин</TabsTrigger>
                <TabsTrigger value="players" className="text-white data-[state=active]:bg-white/20 rounded-3xl">Игроки</TabsTrigger>
                <TabsTrigger value="mgt-exchange" className="text-white data-[state=active]:bg-white/20 rounded-3xl">💰 mGT</TabsTrigger>
                <TabsTrigger value="pvp-seasons" className="text-white data-[state=active]:bg-white/20 rounded-3xl">⚔️ PvP Сезоны</TabsTrigger>
              </>
            )}
            <TabsTrigger value="management" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.management')}</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="admins" className="text-white data-[state=active]:bg-white/20 rounded-3xl">{t(language, 'admin.admins')}</TabsTrigger>}
          </TabsList>

          {isSuperAdmin && (
            <>
              <TabsContent value="metrics" className="space-y-4">
                <GameMetrics />
              </TabsContent>

              <TabsContent value="cards" className="space-y-4">
                <GameSettings />
              </TabsContent>

              <TabsContent value="cardImages" className="space-y-4">
                <CardImageBatchUpload />
                <CardImageManager />
              </TabsContent>

              <TabsContent value="dungeons" className="space-y-4">
                <DungeonSettings />
              </TabsContent>

              <TabsContent value="quests" className="space-y-4">
                <QuestManagement />
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <ItemTemplateManager />
              </TabsContent>

              <TabsContent value="giveaway" className="space-y-4">
                <ItemGiveawayManager />
              </TabsContent>

              <TabsContent value="shelter" className="space-y-4">
                <ShelterBuildingSettings />
              </TabsContent>

              <TabsContent value="card-upgrades" className="space-y-4">
                <CardUpgradeManager />
              </TabsContent>

              <TabsContent value="card-drops" className="space-y-4">
                <CardClassDropRates />
              </TabsContent>

              <TabsContent value="crafting" className="space-y-4">
                <CraftingRecipeManager />
              </TabsContent>

              <TabsContent value="seekers" className="space-y-4">
                <TreasureHuntAdmin />
              </TabsContent>

              <TabsContent value="shop" className="space-y-4">
                <ShopSettings />
              </TabsContent>

              <TabsContent value="players" className="space-y-4">
                <PlayerManagement />
              </TabsContent>

              <TabsContent value="mgt-exchange" className="space-y-4">
                <MgtExchangeAdmin />
              </TabsContent>

              <TabsContent value="pvp-seasons" className="space-y-4">
                <PvPSeasonAdmin />
              </TabsContent>
            </>
          )}

          <TabsContent value="management" className="space-y-4">
            <AdminConsoleWithWhitelist />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="admins" className="space-y-4">
              <AdminRoleManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default function AdminSettings() {
  return (
    <ProtectedRoute>
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}
