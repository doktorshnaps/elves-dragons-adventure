import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Play, Pause } from "lucide-react";

interface TreasureHuntEvent {
  id: string;
  item_name: string;
  item_image_url: string | null;
  total_quantity: number;
  found_quantity: number;
  max_winners: number;
  reward_amount: number;
  is_active: boolean;
  started_at: string | null;
  ended_at: string | null;
}

export const TreasureHuntAdmin = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<TreasureHuntEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    item_image_url: "",
    total_quantity: 100,
    max_winners: 10,
    reward_amount: 1000,
  });

  useEffect(() => {
    loadEvents();
  }, []);

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
      
      const { error } = await supabase
        .from('treasure_hunt_events')
        .insert({
          ...formData,
          created_by_wallet_address: 'admin',
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Событие создано",
      });

      setFormData({
        item_name: "",
        item_image_url: "",
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
            <Label htmlFor="item_name">Название предмета</Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="Редкий артефакт"
            />
          </div>

          <div>
            <Label htmlFor="item_image_url">URL изображения предмета</Label>
            <Input
              id="item_image_url"
              value={formData.item_image_url}
              onChange={(e) => setFormData({ ...formData, item_image_url: e.target.value })}
              placeholder="https://..."
            />
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

          <Button onClick={createEvent} disabled={loading || !formData.item_name}>
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
