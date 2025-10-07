import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameSettings } from "@/components/admin/GameSettings";
import { DungeonSettings } from "@/components/admin/DungeonSettings";
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { QuestManagement } from "@/components/admin/QuestManagement";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminConsoleWithWhitelist } from "@/components/AdminConsole";

const AdminSettingsContent = () => {
  const navigate = useNavigate();
  const { accountId } = useWallet();
  const { isAdmin, loading } = useAdminCheck();

  // Show loading while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-300">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  // Проверка прав доступа - для всех админов
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Доступ запрещен</h1>
          <p className="text-gray-300 mb-6">У вас нет прав для доступа к этой странице</p>
          <Button onClick={() => navigate('/menu')}>
            Вернуться в меню
          </Button>
        </div>
      </div>
    );
  }

  const isSuperAdmin = accountId === 'mr_bruts.tg';

  return (
    <div className="min-h-screen bg-game-dark p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-game-accent mb-2">Настройки игры</h1>
            <p className="text-gray-400">Глубокая настройка параметров героев, драконов и подземелий</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/menu')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад в меню
          </Button>
        </div>

        <Tabs defaultValue={isSuperAdmin ? "cards" : "management"} className="w-full">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-5' : 'grid-cols-1'} mb-6`}>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="cards">Карты (Герои и Драконы)</TabsTrigger>
                <TabsTrigger value="dungeons">Подземелья</TabsTrigger>
                <TabsTrigger value="quests">Задания</TabsTrigger>
              </>
            )}
            <TabsTrigger value="management">Управление</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="admins">Администраторы</TabsTrigger>}
          </TabsList>

          {isSuperAdmin && (
            <>
              <TabsContent value="cards" className="space-y-4">
                <GameSettings />
              </TabsContent>

              <TabsContent value="dungeons" className="space-y-4">
                <DungeonSettings />
              </TabsContent>

              <TabsContent value="quests" className="space-y-4">
                <QuestManagement />
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
