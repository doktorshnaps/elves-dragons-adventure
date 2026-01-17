import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Список монстров будет загружаться из БД
const DUNGEON_MONSTERS: Record<number, string[]> = {};

interface ItemTemplate {
  id: number;
  name: string;
  type: string;
  rarity: string;
  drop_chance?: number;
  description?: string;
  image_url?: string;
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
  allowed_monsters: string[] | null;
}

export const DungeonItemDrops = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([]);
  const [drops, setDrops] = useState<DungeonItemDrop[]>([]);
  const [allMonsters, setAllMonsters] = useState<Record<number, string[]>>({});
  const [treasureHuntEvents, setTreasureHuntEvents] = useState<any[]>([]);
  
  // Поиск
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [monsterSearchTerm, setMonsterSearchTerm] = useState("");
  
  // Форма для нового дропа
  const [newDrop, setNewDrop] = useState({
    item_template_id: "",
    dungeon_number: "1",
    min_dungeon_level: "1",
    max_dungeon_level: "",
    drop_chance: "5.00",
    allowed_monsters: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загрузка монстров из БД
      const { data: monsters, error: monstersError } = await supabase
        .from("monsters")
        .select("monster_name")
        .eq("is_active", true);

      if (monstersError) {
        console.error("Monsters error:", monstersError);
      } else if (monsters) {
        // Группируем монстров по подземельям (пока все в одну группу, можно расширить)
        const monstersByDungeon: Record<number, string[]> = {
          1: monsters.map(m => m.monster_name)
        };
        setAllMonsters(monstersByDungeon);
        // Обновляем глобальный объект для использования в других местах
        Object.assign(DUNGEON_MONSTERS, monstersByDungeon);
      }

      // Загрузка шаблонов предметов
      const { data: templates, error: templatesError } = await supabase
        .from("item_templates")
        .select("id, name, type, rarity, drop_chance, description, image_url")
        .order("name");

      if (templatesError) throw templatesError;
      setItemTemplates(templates || []);

      // Загрузка активных treasure hunt events
      const { data: eventsData, error: eventsError } = await supabase
        .from("treasure_hunt_events")
        .select("*")
        .eq("is_active", true);

      if (eventsError) {
        console.error("Error loading treasure hunt events:", eventsError);
      } else {
        setTreasureHuntEvents(eventsData || []);
      }

      // Загрузка настроек дропа
      const { data: dropsData, error: dropsError } = await supabase
        .from("dungeon_item_drops" as any)
        .select("*")
        .order("dungeon_number")
        .order("min_dungeon_level");

      console.log("Drops data:", dropsData);
      console.log("Drops error:", dropsError);

      if (dropsError) {
        console.error("Error loading drops:", dropsError);
        throw dropsError;
      }
      
      // Добавляем названия предметов из templates
      const formattedDrops = (dropsData || []).map((drop: any) => {
        const template = templates?.find((t) => t.id === drop.item_template_id);
        return {
          ...drop,
          item_name: template?.name || "Unknown Item",
        };
      });
      
      console.log("Formatted drops:", formattedDrops);
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

      // Проверяем, существует ли уже запись (для правильного сообщения)
      const { data: existingDrop } = await supabase
        .from("dungeon_item_drops")
        .select("id")
        .eq("item_template_id", parseInt(newDrop.item_template_id))
        .eq("dungeon_number", parseInt(newDrop.dungeon_number))
        .eq("min_dungeon_level", parseInt(newDrop.min_dungeon_level))
        .maybeSingle();

      const isUpdate = !!existingDrop;

      // 1. Обновляем базовый шанс дропа в item_templates через admin функцию
      const { error: updateError } = await supabase.rpc("admin_update_item_drop_chance", {
        p_item_id: parseInt(newDrop.item_template_id),
        p_drop_chance: parseFloat(newDrop.drop_chance),
      });

      if (updateError) {
        console.error("Error updating item drop chance:", updateError);
        throw new Error(`Ошибка обновления базового шанса: ${updateError.message}`);
      }

      console.log(`✅ Updated drop_chance for item ${newDrop.item_template_id} to ${newDrop.drop_chance}%`);

      // 2. Добавляем настройку дропа для подземелья
      const { error } = await supabase.rpc("admin_add_dungeon_item_drop" as any, {
        p_item_template_id: parseInt(newDrop.item_template_id),
        p_dungeon_number: parseInt(newDrop.dungeon_number),
        p_min_dungeon_level: parseInt(newDrop.min_dungeon_level),
        p_max_dungeon_level: newDrop.max_dungeon_level ? parseInt(newDrop.max_dungeon_level) : null,
        p_drop_chance: parseFloat(newDrop.drop_chance),
        p_allowed_monsters: newDrop.allowed_monsters.length > 0 ? newDrop.allowed_monsters : null,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: isUpdate 
          ? "Настройка дропа обновлена" 
          : "Настройка дропа добавлена",
      });

      // Сброс формы
      setNewDrop({
        item_template_id: "",
        dungeon_number: "1",
        min_dungeon_level: "1",
        max_dungeon_level: "",
        drop_chance: "5.00",
        allowed_monsters: [],
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
      // 1. Обновляем базовый шанс дропа в item_templates через admin функцию
      const { error: updateTemplateError } = await supabase.rpc("admin_update_item_drop_chance", {
        p_item_id: drop.item_template_id,
        p_drop_chance: drop.drop_chance,
      });

      if (updateTemplateError) {
        console.error("Error updating item drop chance:", updateTemplateError);
        throw new Error(`Ошибка обновления базового шанса: ${updateTemplateError.message}`);
      }

      console.log(`✅ Updated drop_chance for item ${drop.item_template_id} to ${drop.drop_chance}%`);

      // 2. Обновляем настройку дропа для подземелья
      const { error } = await supabase.rpc("admin_update_dungeon_item_drop" as any, {
        p_drop_id: drop.id,
        p_min_dungeon_level: drop.min_dungeon_level,
        p_max_dungeon_level: drop.max_dungeon_level,
        p_drop_chance: drop.drop_chance,
        p_is_active: drop.is_active,
        p_allowed_monsters: drop.allowed_monsters && drop.allowed_monsters.length > 0 ? drop.allowed_monsters : null,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройка и базовый шанс обновлены",
      });
      
      loadData();
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

  // Фильтруем предметы по поисковому запросу
  const filteredItemTemplates = itemTemplates.filter((item) =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

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
              <div className="space-y-2">
                <Input
                  placeholder="Поиск предмета..."
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  className="h-9"
                />
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
                    {filteredItemTemplates.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.rarity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

          {/* Выбор монстров */}
          <div className="space-y-2">
            <Label>Монстры (опционально)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {newDrop.allowed_monsters.length === 0
                    ? "Все монстры подземелья"
                    : `Выбрано монстров: ${newDrop.allowed_monsters.length}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-2">
                  <div className="font-semibold mb-2">Выберите монстров</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Если не выбрано - предмет может выпасть с любого монстра
                  </div>
                  <Input
                    placeholder="Поиск монстра..."
                    value={monsterSearchTerm}
                    onChange={(e) => setMonsterSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-9 mb-2"
                  />
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                    {allMonsters[parseInt(newDrop.dungeon_number)]
                      ?.filter((monster) =>
                        monster.toLowerCase().includes(monsterSearchTerm.toLowerCase())
                      )
                      .map((monster) => (
                    <div key={monster} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-${monster}`}
                        checked={newDrop.allowed_monsters.includes(monster)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewDrop({
                              ...newDrop,
                              allowed_monsters: [...newDrop.allowed_monsters, monster],
                            });
                          } else {
                            setNewDrop({
                              ...newDrop,
                              allowed_monsters: newDrop.allowed_monsters.filter((m) => m !== monster),
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`new-${monster}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {monster}
                      </label>
                    </div>
                      ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {newDrop.allowed_monsters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {newDrop.allowed_monsters.map((monster) => (
                  <Badge key={monster} variant="secondary" className="gap-1">
                    {monster}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setNewDrop({
                          ...newDrop,
                          allowed_monsters: newDrop.allowed_monsters.filter((m) => m !== monster),
                        });
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
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
                <div className="col-span-2">Предмет</div>
                <div className="col-span-1">Подз.</div>
                <div className="col-span-2">Уровни</div>
                <div className="col-span-1">Шанс</div>
                <div className="col-span-2">Монстры</div>
                <div className="col-span-1">Статус</div>
                <div className="col-span-3">Действия</div>
              </div>
              
              {drops.map((drop) => (
                <div
                  key={drop.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 bg-card border rounded-lg items-start hover:bg-accent/50 transition-colors"
                >
                  <div className="col-span-2">
                    <p className="font-medium text-sm">{drop.item_name}</p>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <p className="text-sm">{drop.dungeon_number}</p>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm">
                      {drop.min_dungeon_level}
                      {drop.max_dungeon_level ? ` - ${drop.max_dungeon_level}` : '+'}
                    </p>
                  </div>
                  
                  <div className="col-span-1">
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
                  
                  <div className="col-span-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                          {!drop.allowed_monsters || drop.allowed_monsters.length === 0
                            ? "Все"
                            : `${drop.allowed_monsters.length} монстров`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4" align="start">
                        <div className="space-y-2">
                          <div className="font-semibold text-sm">Выберите монстров</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Пусто = все монстры
                          </div>
                          <Input
                            placeholder="Поиск монстра..."
                            value={monsterSearchTerm}
                            onChange={(e) => setMonsterSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="h-8 mb-2"
                          />
                          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                            {allMonsters[drop.dungeon_number]
                              ?.filter((monster) =>
                                monster.toLowerCase().includes(monsterSearchTerm.toLowerCase())
                              )
                              .map((monster) => (
                            <div key={monster} className="flex items-center space-x-2">
                              <Checkbox
                                id={`drop-${drop.id}-${monster}`}
                                checked={drop.allowed_monsters?.includes(monster) || false}
                                onCheckedChange={(checked) => {
                                  const updated = drops.map((d) => {
                                    if (d.id === drop.id) {
                                      const current = d.allowed_monsters || [];
                                      return {
                                        ...d,
                                        allowed_monsters: checked
                                          ? [...current, monster]
                                          : current.filter((m) => m !== monster),
                                      };
                                    }
                                    return d;
                                  });
                                  setDrops(updated);
                                }}
                              />
                              <label
                                htmlFor={`drop-${drop.id}-${monster}`}
                                className="text-xs leading-none cursor-pointer"
                              >
                                {monster}
                              </label>
                            </div>
                          ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {drop.allowed_monsters && drop.allowed_monsters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {drop.allowed_monsters.slice(0, 2).map((monster) => (
                          <Badge key={monster} variant="secondary" className="text-xs py-0 px-1">
                            {monster.length > 12 ? `${monster.slice(0, 12)}...` : monster}
                          </Badge>
                        ))}
                        {drop.allowed_monsters.length > 2 && (
                          <Badge variant="secondary" className="text-xs py-0 px-1">
                            +{drop.allowed_monsters.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-1 flex items-center">
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

      <Card>
        <CardHeader>
          <CardTitle>Все предметы из базы данных ({itemTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {itemTemplates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Предметы не найдены
            </p>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Поиск предмета..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 rounded-lg font-semibold text-sm">
                <div className="col-span-3">Предмет</div>
                <div className="col-span-2">Тип</div>
                <div className="col-span-1">Редкость</div>
                <div className="col-span-2">Базовый шанс</div>
                <div className="col-span-4">Настройки дропа в подземельях</div>
              </div>
              
              {filteredItemTemplates.map((item) => {
                // Находим все настройки дропа для этого предмета
                const itemDrops = drops.filter(d => d.item_template_id === item.id && d.is_active);
                
                // Находим активные treasure hunt events для этого предмета
                const treasureEvents = treasureHuntEvents.filter(e => e.item_template_id === item.id);
                
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 bg-card border rounded-lg items-start hover:bg-accent/50 transition-colors"
                  >
                    <div className="col-span-3">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-sm capitalize">{item.type}</p>
                    </div>
                    
                    <div className="col-span-1">
                      <p className="text-sm capitalize">{item.rarity}</p>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-sm font-semibold">
                        {item.drop_chance !== undefined && item.drop_chance !== null ? `${item.drop_chance}%` : 'null%'}
                      </p>
                    </div>
                    
                    <div className="col-span-4">
                      {itemDrops.length === 0 && treasureEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Нет настроек дропа
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {itemDrops.map((drop) => (
                            <div key={drop.id} className="text-xs bg-muted/50 px-2 py-1 rounded">
                              <span className="font-semibold">Подз. {drop.dungeon_number}:</span>{' '}
                              Ур. {drop.min_dungeon_level}
                              {drop.max_dungeon_level ? `-${drop.max_dungeon_level}` : '+'},
                              {' '}Шанс: {drop.drop_chance}%
                            </div>
                          ))}
                          {treasureEvents.map((event) => (
                            <div key={event.id} className="text-xs bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded">
                              <span className="font-semibold text-amber-600 dark:text-amber-400">🔍 Искатели:</span>{' '}
                              Подз. {event.dungeon_number || 'все'},{' '}
                              Шанс: {event.drop_chance}%,{' '}
                              Найдено: {event.found_quantity}/{event.total_quantity}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
