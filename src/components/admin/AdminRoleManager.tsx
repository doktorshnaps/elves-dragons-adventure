import { useState, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Trash2, RefreshCw } from "lucide-react";

interface AdminRole {
  id: string;
  wallet_address: string;
  role: string;
  created_at: string;
}

export const AdminRoleManager = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список администраторов",
        variant: "destructive",
      });
    }
  };

  const addAdmin = async () => {
    if (!newAdminAddress.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите адрес кошелька",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_add_administrator', {
        p_wallet_address: newAdminAddress.trim(),
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Администратор ${newAdminAddress} добавлен`,
      });

      setNewAdminAddress("");
      await loadAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить администратора",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (walletAddress: string) => {
    if (walletAddress === 'mr_bruts.tg') {
      toast({
        title: "Ошибка",
        description: "Нельзя удалить супер-администратора",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_remove_administrator', {
        p_wallet_address: walletAddress,
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Администратор ${walletAddress} удален`,
      });

      await loadAdmins();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить администратора",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Управление администраторами
        </CardTitle>
        <CardDescription>
          Назначайте администраторов для управления вайт-листом и блокировками
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Admin Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Адрес кошелька администратора"
            value={newAdminAddress}
            onChange={(e) => setNewAdminAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAdmin()}
            disabled={loading}
          />
          <Button 
            onClick={addAdmin} 
            disabled={loading}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Добавить
          </Button>
          <Button 
            onClick={loadAdmins} 
            variant="outline"
            disabled={loading}
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Admins List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Активные администраторы ({admins.length})</h4>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет активных администраторов
            </p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm">{admin.wallet_address}</p>
                    <p className="text-xs text-muted-foreground">
                      Добавлен: {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <Button
                    onClick={() => removeAdmin(admin.wallet_address)}
                    variant="destructive"
                    size="sm"
                    disabled={loading || admin.wallet_address === 'mr_bruts.tg'}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Super Admin Info */}
        <div className="p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Супер-администратор:</span>
            <span className="font-mono">mr_bruts.tg</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            Только супер-администратор может управлять другими администраторами
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
