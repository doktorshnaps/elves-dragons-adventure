import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Play, Pause } from "lucide-react";

interface TreasureHuntEvent {
  id: string;
  item_name: string;
  item_image_url: string | null;
  item_template_id: number | null;
  monster_id: string | null;
  drop_chance: number;
  dungeon_number: number | null;
  total_quantity: number;
  found_quantity: number;
  max_winners: number;
  reward_amount: number;
  is_active: boolean;
  started_at: string | null;
  ended_at: string | null;
}

interface ItemTemplate {
  id: number;
  name: string;
  type: string;
  rarity: string;
  image_url: string | null;
}

interface Monster {
  id: string;
  monster_id: string;
  monster_name: string;
  image_url: string | null;
}

export const TreasureHuntAdmin = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<TreasureHuntEvent[]>([]);
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_template_id: "",
    monster_id: "none",
    dungeon_number: "1",
    drop_chance: "1.0",
    total_quantity: 100,
    max_winners: 10,
    reward_amount: 1000,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загрузка шаблонов предметов
      const { data: templates, error: templatesError } = await supabase
        .from('item_templates')
        .select('id, name, type, rarity, image_url')
        .order('name');

      if (templatesError) throw templatesError;
      setItemTemplates(templates || []);

      // Загрузка монстров
      const { data: monstersData, error: monstersError } = await supabase
        .from('monsters')
        .select('*')
        .eq('is_active', true)
        .order('monster_name');

      if (monstersError) throw monstersError;
      setMonsters(monstersData || []);

      // Загрузка событий
      await loadEvents();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('treasure_hunt_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить события",
        variant: "destructive",
      });
    }
  };

  const createEvent = async () => {
    try {
      setLoading(true);
      
      if (!formData.item_template_id) {
        toast({
          title: "Ошибка",
          description: "Выберите предмет",
          variant: "destructive",
        });
        return;
      }

      // Получаем данные предмета
      const selectedItem = itemTemplates.find(item => item.id === parseInt(formData.item_template_id));
      
      const { error } = await supabase
        .from('treasure_hunt_events')
        .insert({
          item_template_id: parseInt(formData.item_template_id),
          item_name: selectedItem?.name || '',
          item_image_url: selectedItem?.image_url || null,
          monster_id: formData.monster_id === "none" ? null : formData.monster_id,
          dungeon_number: formData.dungeon_number ? parseInt(formData.dungeon_number) : null,
          drop_chance: parseFloat(formData.drop_chance),
          total_quantity: formData.total_quantity,
          max_winners: formData.max_winners,
          reward_amount: formData.reward_amount,
          created_by_wallet_address: 'admin',
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Событие создано",
      });

      setFormData({
        item_template_id: "",
        monster_id: "none",
        dungeon_number: "1",
        drop_chance: "1.0",
        total_quantity: 100,
        max_winners: 10,
        reward_amount: 1000,
      });

      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать событие",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      // Деактивировать все активные события если активируем новое
      if (!currentStatus) {
        await supabase
          .from('treasure_hunt_events')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('is_active', true);
      }

      const { error } = await supabase
        .from('treasure_hunt_events')
        .update({ 
          is_active: !currentStatus,
          started_at: !currentStatus ? new Date().toISOString() : null,
          ended_at: currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: currentStatus ? "Событие остановлено" : "Событие запущено",
      });

      await loadEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус события",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Вы уверены что хотите удалить это событие?')) return;

    try {
      const { error } = await supabase
        .from('treasure_hunt_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Событие удалено",
      });

      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить событие",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Создать новое событие "Искатели"</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="item_template_id">Предмет</Label>
            <Select
              value={formData.item_template_id}
              onValueChange={(value) => setFormData({ ...formData, item_template_id: value })}
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

          <div>
            <Label htmlFor="monster_id">Монстр (необязательно)</Label>
            <Select
              value={formData.monster_id}
              onValueChange={(value) => setFormData({ ...formData, monster_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите монстра" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Любой монстр</SelectItem>
                {monsters.map((monster) => (
                  <SelectItem key={monster.id} value={monster.monster_id}>
                    {monster.monster_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dungeon_number">Номер подземелья</Label>
              <Input
                id="dungeon_number"
                type="number"
                value={formData.dungeon_number}
                onChange={(e) => setFormData({ ...formData, dungeon_number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="drop_chance">Шанс выпадения (%)</Label>
              <Input
                id="drop_chance"
                type="number"
                step="0.1"
                value={formData.drop_chance}
                onChange={(e) => setFormData({ ...formData, drop_chance: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_quantity">Всего предметов</Label>
              <Input
                id="total_quantity"
                type="number"
                value={formData.total_quantity}
                onChange={(e) => setFormData({ ...formData, total_quantity: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="max_winners">Макс. победителей</Label>
              <Input
                id="max_winners"
                type="number"
                value={formData.max_winners}
                onChange={(e) => setFormData({ ...formData, max_winners: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="reward_amount">Награда (ELL)</Label>
              <Input
                id="reward_amount"
                type="number"
                value={formData.reward_amount}
                onChange={(e) => setFormData({ ...formData, reward_amount: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={createEvent} disabled={loading || !formData.item_template_id}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Создать событие
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Управление событиями</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет созданных событий</p>
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{event.item_name}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                          <div>Всего: {event.total_quantity}</div>
                          <div>Найдено: {event.found_quantity}</div>
                          <div>Макс. победителей: {event.max_winners}</div>
                          <div>Награда: {event.reward_amount} ELL</div>
                          {event.monster_id && <div>Монстр: {event.monster_id}</div>}
                          {event.dungeon_number && <div>Подземелье: #{event.dungeon_number}</div>}
                          <div>Шанс дропа: {event.drop_chance}%</div>
                        </div>
                        {event.started_at && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Начато: {new Date(event.started_at).toLocaleString('ru-RU')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={event.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleEventStatus(event.id, event.is_active)}
                        >
                          {event.is_active ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Стоп
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Старт
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          disabled={event.is_active}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
