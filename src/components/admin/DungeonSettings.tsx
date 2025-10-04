import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DungeonSetting {
  id: string;
  dungeon_type: string;
  dungeon_name: string;
  dungeon_number: number;
  base_hp: number;
  base_armor: number;
  base_atk: number;
  hp_growth_coefficient: number;
  armor_growth_coefficient: number;
  atk_growth_coefficient: number;
  s_mob_base: number;
  dungeon_alpha: number;
  level_beta: number;
  level_g_coefficient: number;
  hp_growth: number;
  armor_growth: number;
  atk_growth: number;
}

export const DungeonSettings = () => {
  const { toast } = useToast();
  const { accountId } = useWallet();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dungeons, setDungeons] = useState<DungeonSetting[]>([]);
  const [openDungeons, setOpenDungeons] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDungeons();
  }, []);

  const loadDungeons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dungeon_settings')
        .select('*')
        .order('dungeon_number');

      if (error) throw error;
      if (data) setDungeons(data);
    } catch (error) {
      console.error('Error loading dungeons:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить настройки подземелий",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDungeon = (dungeonId: string) => {
    const newOpen = new Set(openDungeons);
    if (newOpen.has(dungeonId)) {
      newOpen.delete(dungeonId);
    } else {
      newOpen.add(dungeonId);
    }
    setOpenDungeons(newOpen);
  };

  const updateDungeon = (dungeonId: string, field: keyof DungeonSetting, value: number) => {
    setDungeons(dungeons.map(d => 
      d.id === dungeonId ? { ...d, [field]: value } : d
    ));
  };

  const saveDungeon = async (dungeon: DungeonSetting) => {
    if (!accountId) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Необходимо подключить кошелек",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_dungeon_setting', {
        p_id: dungeon.id,
        p_base_hp: dungeon.base_hp,
        p_base_armor: dungeon.base_armor,
        p_base_atk: dungeon.base_atk,
        p_hp_growth: dungeon.hp_growth_coefficient,
        p_armor_growth: dungeon.armor_growth_coefficient,
        p_atk_growth: dungeon.atk_growth_coefficient,
        p_s_mob_base: dungeon.s_mob_base,
        p_dungeon_alpha: dungeon.dungeon_alpha,
        p_level_beta: dungeon.level_beta,
        p_level_g_coefficient: dungeon.level_g_coefficient,
        p_admin_wallet_address: accountId
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Настройки подземелья "${dungeon.dungeon_name}" сохранены`,
      });
      
      // Reload dungeons to get fresh data
      await loadDungeons();
    } catch (error) {
      console.error('Error saving dungeon:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить настройки",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Настройки подземелий</h2>
        <p className="text-muted-foreground">
          Управление характеристиками монстров и формулами расчета для каждого подземелья
        </p>
      </div>

      {dungeons.map((dungeon) => (
        <Collapsible
          key={dungeon.id}
          open={openDungeons.has(dungeon.id)}
          onOpenChange={() => toggleDungeon(dungeon.id)}
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {dungeon.dungeon_number}
                    </div>
                    <div className="text-left">
                      <CardTitle>{dungeon.dungeon_name}</CardTitle>
                      <CardDescription className="text-xs">{dungeon.dungeon_type}</CardDescription>
                    </div>
                  </div>
                  {openDungeons.has(dungeon.id) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="space-y-6 pt-6">
                {/* Базовые характеристики */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Базовые характеристики монстров</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Base HP</Label>
                      <Input
                        type="number"
                        value={dungeon.base_hp}
                        onChange={(e) => updateDungeon(dungeon.id, 'base_hp', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Base Armor</Label>
                      <Input
                        type="number"
                        value={dungeon.base_armor}
                        onChange={(e) => updateDungeon(dungeon.id, 'base_armor', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Base ATK</Label>
                      <Input
                        type="number"
                        value={dungeon.base_atk}
                        onChange={(e) => updateDungeon(dungeon.id, 'base_atk', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Новые коэффициенты роста (формула эмулятора) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Коэффициенты роста по уровням (новая формула)</h4>
                  <p className="text-xs text-muted-foreground">
                    Формула: stat = base × growth^((L-1)/10) × 1.2^(D-1)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">HP Growth</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dungeon.hp_growth || 1.15}
                        onChange={(e) => updateDungeon(dungeon.id, 'hp_growth', parseFloat(e.target.value) || 1.15)}
                      />
                      <p className="text-[10px] text-muted-foreground">По умолчанию: 1.15</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Armor Growth</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dungeon.armor_growth || 1.10}
                        onChange={(e) => updateDungeon(dungeon.id, 'armor_growth', parseFloat(e.target.value) || 1.10)}
                      />
                      <p className="text-[10px] text-muted-foreground">По умолчанию: 1.10</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ATK Growth</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dungeon.atk_growth || 1.12}
                        onChange={(e) => updateDungeon(dungeon.id, 'atk_growth', parseFloat(e.target.value) || 1.12)}
                      />
                      <p className="text-[10px] text-muted-foreground">По умолчанию: 1.12</p>
                    </div>
                  </div>
                </div>

                {/* Старые коэффициенты (для совместимости) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Старые коэффициенты роста (устарело)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Рост HP (старый)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dungeon.hp_growth_coefficient}
                        onChange={(e) => updateDungeon(dungeon.id, 'hp_growth_coefficient', parseFloat(e.target.value) || 0)}
                        disabled
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Рост Armor (старый)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dungeon.armor_growth_coefficient}
                        onChange={(e) => updateDungeon(dungeon.id, 'armor_growth_coefficient', parseFloat(e.target.value) || 0)}
                        disabled
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Рост ATK (старый)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dungeon.atk_growth_coefficient}
                        onChange={(e) => updateDungeon(dungeon.id, 'atk_growth_coefficient', parseFloat(e.target.value) || 0)}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Параметры формулы S_mob */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Параметры формулы S_mob</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">S_mob (Базовый множитель)</Label>
                      <Input
                        type="number"
                        value={dungeon.s_mob_base}
                        onChange={(e) => updateDungeon(dungeon.id, 's_mob_base', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Рост по уровню (g)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={dungeon.level_g_coefficient}
                        onChange={(e) => updateDungeon(dungeon.id, 'level_g_coefficient', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Рост по данжу (α)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dungeon.dungeon_alpha}
                        onChange={(e) => updateDungeon(dungeon.id, 'dungeon_alpha', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Рост по уровню (β)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dungeon.level_beta}
                        onChange={(e) => updateDungeon(dungeon.id, 'level_beta', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Формула: S_mob = {dungeon.s_mob_base} × D^{dungeon.dungeon_alpha} × (1 + {dungeon.level_g_coefficient} × L)^{dungeon.level_beta}
                  </p>
                </div>

                <Button 
                  onClick={() => saveDungeon(dungeon)} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Применить изменения
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
};
