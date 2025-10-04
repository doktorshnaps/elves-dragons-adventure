import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { AdminConsoleWithWhitelist } from "@/components/AdminConsole";
import { BalanceEmulator } from "@/components/admin/BalanceEmulator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdminSettings = () => {
  const navigate = useNavigate();
  const { accountId } = useWallet();

  // Проверка прав администратора
  if (accountId !== 'mr_bruts.tg') {
    navigate('/menu');
    return null;
  }

  return (
    <div className="min-h-screen p-4 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/menu')}
          className="mb-6 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад в меню
        </Button>

        <Tabs defaultValue="console" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-game-surface/80 border border-game-accent mb-6">
            <TabsTrigger value="console" className="data-[state=active]:bg-game-accent data-[state=active]:text-white">
              Консоль администратора
            </TabsTrigger>
            <TabsTrigger value="emulator" className="data-[state=active]:bg-game-accent data-[state=active]:text-white">
              Эмулятор баланса
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console">
            <AdminConsoleWithWhitelist />
          </TabsContent>

          <TabsContent value="emulator">
            <BalanceEmulator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
