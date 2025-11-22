import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Loader2, Save, Info, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShopSettings {
  id: string;
  items_per_refresh: number;
  refresh_interval_hours: number;
  is_open_access: boolean;
  created_at: string;
  updated_at: string;
}

export const ShopSettings = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [itemsPerRefresh, setItemsPerRefresh] = useState(50);
  const [refreshIntervalHours, setRefreshIntervalHours] = useState(24);
  const [isOpenAccess, setIsOpenAccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_shop_settings');

      if (error) throw error;

      if (data && data.length > 0) {
        const shopSettings = data[0] as ShopSettings;
        setSettings(shopSettings);
        setItemsPerRefresh(shopSettings.items_per_refresh);
        setRefreshIntervalHours(shopSettings.refresh_interval_hours);
        setIsOpenAccess(shopSettings.is_open_access);
      }
    } catch (error) {
      console.error('Error loading shop settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить настройки магазина",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Не удалось определить адрес кошелька",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .rpc('admin_update_shop_settings', {
          p_admin_wallet_address: accountId,
          p_items_per_refresh: itemsPerRefresh,
          p_refresh_interval_hours: refreshIntervalHours,
          p_is_open_access: isOpenAccess
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройки магазина обновлены",
      });

      // Reload settings to get updated data
      await loadSettings();
    } catch (error) {
      console.error('Error saving shop settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки магазина",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Не удалось определить адрес кошелька",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshing(true);
      const { data, error } = await supabase.rpc('reset_shop_inventory', { 
        p_force: true  // Принудительный сброс независимо от времени
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Магазин принудительно обновлен, таймер перезапущен",
      });

      // Reload settings to show new reset time
      await loadSettings();
    } catch (error) {
      console.error('Error refreshing shop:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить магазин",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки магазина</CardTitle>
          <CardDescription>
            Управление параметрами магазина и доступом к игре
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="items-per-refresh">
                Количество предметов за обновление
              </Label>
              <Input
                id="items-per-refresh"
                type="number"
                min="1"
                max="200"
                value={itemsPerRefresh}
                onChange={(e) => setItemsPerRefresh(parseInt(e.target.value) || 50)}
                placeholder="50"
              />
              <p className="text-sm text-muted-foreground">
                Количество предметов каждого типа, доступных после обновления магазина
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh-interval">
                Периодичность обновления (часы)
              </Label>
              <Input
                id="refresh-interval"
                type="number"
                min="1"
                max="168"
                value={refreshIntervalHours}
                onChange={(e) => setRefreshIntervalHours(parseInt(e.target.value) || 24)}
                placeholder="24"
              />
              <p className="text-sm text-muted-foreground">
                Интервал в часах между автоматическими обновлениями магазина
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="open-access" className="text-base font-semibold">
                  Открытый доступ к игре
                </Label>
                <p className="text-sm text-muted-foreground">
                  Позволить всем пользователям входить в игру без whitelist
                </p>
              </div>
              <Switch
                id="open-access"
                checked={isOpenAccess}
                onCheckedChange={setIsOpenAccess}
              />
            </div>

            {isOpenAccess && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Внимание:</strong> При включенном открытом доступе любой пользователь 
                  сможет войти в игру без необходимости быть в whitelist. Это может повлиять 
                  на производительность и экономику игры.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button 
              onClick={handleManualRefresh} 
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обновление...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Обновить магазин
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Текущие настройки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Предметов за обновление:</span>
                <span className="font-medium">{settings.items_per_refresh}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Интервал обновления:</span>
                <span className="font-medium">{settings.refresh_interval_hours} часов</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Открытый доступ:</span>
                <span className="font-medium">
                  {settings.is_open_access ? 'Включен' : 'Выключен'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Последнее обновление:</span>
                <span className="font-medium">
                  {new Date(settings.updated_at).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};