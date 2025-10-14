import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ItemTemplate {
  id: number;
  name: string;
  type: string;
  rarity: string;
}

interface DungeonItemDrop {
  id: string;
  item_template_id: number;
  item_name?: string;
  dungeon_number: number;
  min_dungeon_level: number;
  max_dungeon_level: number | null;
  drop_chance: number;
  is_active: boolean;
}

export const DungeonItemDrops = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([]);
  const [drops, setDrops] = useState<DungeonItemDrop[]>([]);
  
  // Форма для нового дропа
  const [newDrop, setNewDrop] = useState({
    item_template_id: "",
    dungeon_number: "1",
    min_dungeon_level: "1",
    max_dungeon_level: "",
    drop_chance: "5.00",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загрузка шаблонов предметов
      const { data: templates, error: templatesError } = await supabase
        .from("item_templates")
        .select("id, name, type, rarity")
        .order("name");

      if (templatesError) throw templatesError;
      setItemTemplates(templates || []);

      // Загрузка настроек дропа
      const { data: dropsData, error: dropsError } = await supabase
        .from("dungeon_item_drops" as any)
        .select(`
          id,
          item_template_id,
          dungeon_number,
          min_dungeon_level,
          max_dungeon_level,
          drop_chance,
          is_active,
          item_templates (name)
        `)
        .order("dungeon_number")
        .order("min_dungeon_level");

      if (dropsError) throw dropsError;
      
      const formattedDrops = (dropsData || []).map((drop: any) => ({
        ...drop,
        item_name: drop.item_templates?.name || "Unknown",
      }));
      
      setDrops(formattedDrops);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrop = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive",
      });
      return;
    }

    if (!newDrop.item_template_id) {
      toast({
        title: "Ошибка",
        description: "Выберите предмет",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.rpc("admin_add_dungeon_item_drop" as any, {
        p_item_template_id: parseInt(newDrop.item_template_id),
        p_dungeon_number: parseInt(newDrop.dungeon_number),
        p_min_dungeon_level: parseInt(newDrop.min_dungeon_level),
        p_max_dungeon_level: newDrop.max_dungeon_level ? parseInt(newDrop.max_dungeon_level) : null,
        p_drop_chance: parseFloat(newDrop.drop_chance),
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройка дропа добавлена",
      });

      // Сброс формы
      setNewDrop({
        item_template_id: "",
        dungeon_number: "1",
        min_dungeon_level: "1",
        max_dungeon_level: "",
        drop_chance: "5.00",
      });

      loadData();
    } catch (error: any) {
      console.error("Error adding drop:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDrop = async (drop: DungeonItemDrop) => {
    if (!accountId) return;

    try {
      const { error } = await supabase.rpc("admin_update_dungeon_item_drop" as any, {
        p_drop_id: drop.id,
        p_min_dungeon_level: drop.min_dungeon_level,
        p_max_dungeon_level: drop.max_dungeon_level,
        p_drop_chance: drop.drop_chance,
        p_is_active: drop.is_active,
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройка обновлена",
      });
    } catch (error: any) {
      console.error("Error updating drop:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDrop = async (dropId: string) => {
    if (!accountId) return;

    try {
      const { error } = await supabase.rpc("admin_delete_dungeon_item_drop" as any, {
        p_drop_id: dropId,
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройка удалена",
      });

      loadData();
    } catch (error: any) {
      console.error("Error deleting drop:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить настройку дропа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Предмет</Label>
              <Select
                value={newDrop.item_template_id}
                onValueChange={(value) =>
                  setNewDrop({ ...newDrop, item_template_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите предмет" />
                </SelectTrigger>
                <SelectContent>
                  {itemTemplates.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} ({item.rarity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Подземелье</Label>
              <Select
                value={newDrop.dungeon_number}
                onValueChange={(value) =>
                  setNewDrop({ ...newDrop, dungeon_number: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Подземелье {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Мин. уровень</Label>
              <Input
                type="number"
                min="1"
                value={newDrop.min_dungeon_level}
                onChange={(e) =>
                  setNewDrop({ ...newDrop, min_dungeon_level: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Макс. уровень (опционально)</Label>
              <Input
                type="number"
                min="1"
                value={newDrop.max_dungeon_level}
                onChange={(e) =>
                  setNewDrop({ ...newDrop, max_dungeon_level: e.target.value })
                }
                placeholder="Без ограничения"
              />
            </div>

            <div className="space-y-2">
              <Label>Шанс дропа (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newDrop.drop_chance}
                onChange={(e) =>
                  setNewDrop({ ...newDrop, drop_chance: e.target.value })
                }
              />
            </div>
          </div>

          <Button onClick={handleAddDrop} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Добавить
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список всех настроек дропа ({drops.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {drops.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Настройки дропа не найдены. Добавьте первую настройку выше.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 rounded-lg font-semibold text-sm">
                <div className="col-span-3">Предмет</div>
                <div className="col-span-1">Подз.</div>
                <div className="col-span-2">Уровни</div>
                <div className="col-span-2">Шанс дропа</div>
                <div className="col-span-1">Статус</div>
                <div className="col-span-3">Действия</div>
              </div>
              
              {drops.map((drop) => (
                <div
                  key={drop.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 bg-card border rounded-lg items-center hover:bg-accent/50 transition-colors"
                >
                  <div className="col-span-3">
                    <p className="font-medium text-sm">{drop.item_name}</p>
                  </div>
                  
                  <div className="col-span-1">
                    <p className="text-sm">{drop.dungeon_number}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm">
                      {drop.min_dungeon_level}
                      {drop.max_dungeon_level ? ` - ${drop.max_dungeon_level}` : '+'}
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={drop.drop_chance}
                      onChange={(e) => {
                        const updated = drops.map((d) =>
                          d.id === drop.id
                            ? { ...d, drop_chance: parseFloat(e.target.value) }
                            : d
                        );
                        setDrops(updated);
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Switch
                      checked={drop.is_active}
                      onCheckedChange={(checked) => {
                        const updated = drops.map((d) =>
                          d.id === drop.id ? { ...d, is_active: checked } : d
                        );
                        setDrops(updated);
                      }}
                    />
                  </div>
                  
                  <div className="col-span-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateDrop(drop)}
                      className="h-8"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Сохранить
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDrop(drop.id)}
                      className="h-8"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
