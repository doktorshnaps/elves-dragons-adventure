import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, Save } from "lucide-react";

interface HeroBaseStats {
  id: string;
  health: number;
  defense: number;
  power: number;
  magic: number;
}

interface DragonBaseStats {
  id: string;
  health: number;
  defense: number;
  power: number;
  magic: number;
}

interface RarityMultiplier {
  id: string;
  rarity: number;
  multiplier: number;
}

interface ClassMultiplier {
  id: string;
  class_name: string;
  health_multiplier: number;
  defense_multiplier: number;
  power_multiplier: number;
  magic_multiplier: number;
}

export const GameSettings = () => {
  const { toast } = useToast();
  const { accountId } = useWallet();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for all settings
  const [heroBaseStats, setHeroBaseStats] = useState<HeroBaseStats | null>(null);
  const [dragonBaseStats, setDragonBaseStats] = useState<DragonBaseStats | null>(null);
  const [rarityMultipliers, setRarityMultipliers] = useState<RarityMultiplier[]>([]);
  const [classMultipliers, setClassMultipliers] = useState<ClassMultiplier[]>([]);
  const [dragonClassMultipliers, setDragonClassMultipliers] = useState<ClassMultiplier[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load all settings
      const [heroRes, dragonRes, rarityRes, classRes, dragonClassRes] = await Promise.all([
        supabase.from('hero_base_stats').select('*').limit(1).single(),
        supabase.from('dragon_base_stats').select('*').limit(1).single(),
        supabase.from('rarity_multipliers').select('*').order('rarity'),
        supabase.from('class_multipliers').select('*').order('class_name'),
        supabase.from('dragon_class_multipliers').select('*').order('class_name'),
      ]);

      if (heroRes.data) setHeroBaseStats(heroRes.data);
      if (dragonRes.data) setDragonBaseStats(dragonRes.data);
      if (rarityRes.data) setRarityMultipliers(rarityRes.data);
      if (classRes.data) setClassMultipliers(classRes.data);
      if (dragonClassRes.data) setDragonClassMultipliers(dragonClassRes.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить настройки",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveHeroBaseStats = async () => {
    if (!heroBaseStats) return;
    setSaving(true);
    try {
      console.log('Saving hero stats:', heroBaseStats);
      const { data, error } = await supabase
        .from('hero_base_stats')
        .update({
          health: heroBaseStats.health,
          defense: heroBaseStats.defense,
          power: heroBaseStats.power,
          magic: heroBaseStats.magic,
        })
        .eq('id', heroBaseStats.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Save successful:', data);
      toast({
        title: "Успешно",
        description: "Базовые параметры героев сохранены",
      });
      
      // Reload settings to ensure sync
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving hero stats:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveDragonBaseStats = async () => {
    if (!dragonBaseStats) return;
    setSaving(true);
    try {
      console.log('Saving dragon stats:', dragonBaseStats);
      const { data, error } = await supabase
        .from('dragon_base_stats')
        .update({
          health: dragonBaseStats.health,
          defense: dragonBaseStats.defense,
          power: dragonBaseStats.power,
          magic: dragonBaseStats.magic,
        })
        .eq('id', dragonBaseStats.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Save successful:', data);
      toast({
        title: "Успешно",
        description: "Базовые параметры драконов сохранены",
      });
      
      // Reload settings to ensure sync
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving dragon stats:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveRarityMultipliers = async () => {
    if (!accountId) return;
    setSaving(true);
    try {
      console.log('Saving rarity multipliers via RPC:', rarityMultipliers);
      
      for (const rm of rarityMultipliers) {
        const { error } = await supabase.rpc('admin_update_rarity_multiplier', {
          p_id: rm.id,
          p_multiplier: rm.multiplier,
          p_admin_wallet_address: accountId
        });
        
        if (error) {
          console.error('Error updating rarity multiplier:', rm.id, error);
          throw error;
        }
      }

      console.log('All rarity multipliers saved successfully');
      toast({
        title: "Успешно",
        description: "Множители редкости сохранены",
      });
      
      // Reload settings to ensure sync
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving rarity multipliers:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveClassMultipliers = async () => {
    if (!accountId) return;
    setSaving(true);
    try {
      console.log('Saving class multipliers via RPC:', classMultipliers);
      
      for (const cm of classMultipliers) {
        const { error } = await supabase.rpc('admin_update_class_multiplier', {
          p_id: cm.id,
          p_health_multiplier: cm.health_multiplier,
          p_defense_multiplier: cm.defense_multiplier,
          p_power_multiplier: cm.power_multiplier,
          p_magic_multiplier: cm.magic_multiplier,
          p_admin_wallet_address: accountId
        });
        
        if (error) {
          console.error('Error updating class multiplier:', cm.id, error);
          throw error;
        }
      }

      console.log('All class multipliers saved successfully');
      toast({
        title: "Успешно",
        description: "Множители классов героев сохранены",
      });
      
      // Reload settings to ensure sync
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving class multipliers:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveDragonClassMultipliers = async () => {
    if (!accountId) return;
    setSaving(true);
    try {
      console.log('Saving dragon class multipliers via RPC:', dragonClassMultipliers);
      
      for (const cm of dragonClassMultipliers) {
        const { error } = await supabase.rpc('admin_update_dragon_class_multiplier', {
          p_id: cm.id,
          p_health_multiplier: cm.health_multiplier,
          p_defense_multiplier: cm.defense_multiplier,
          p_power_multiplier: cm.power_multiplier,
          p_magic_multiplier: cm.magic_multiplier,
          p_admin_wallet_address: accountId
        });
        
        if (error) {
          console.error('Error updating dragon class multiplier:', cm.id, error);
          throw error;
        }
      }

      console.log('All dragon class multipliers saved successfully');
      toast({
        title: "Успешно",
        description: "Множители классов драконов сохранены",
      });
      
      // Reload settings to ensure sync
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving dragon class multipliers:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
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
    <div className="space-y-6">
      <Tabs defaultValue="heroes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="heroes">Герои</TabsTrigger>
          <TabsTrigger value="dragons">Драконы</TabsTrigger>
          <TabsTrigger value="rarity">Редкость</TabsTrigger>
          <TabsTrigger value="classes">Классы</TabsTrigger>
        </TabsList>

        <TabsContent value="heroes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Базовые параметры героев</CardTitle>
              <CardDescription>Настройка начальных характеристик для героев</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {heroBaseStats && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Здоровье</Label>
                      <Input
                        type="number"
                        value={heroBaseStats.health}
                        onChange={(e) => setHeroBaseStats({
                          ...heroBaseStats,
                          health: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Защита</Label>
                      <Input
                        type="number"
                        value={heroBaseStats.defense}
                        onChange={(e) => setHeroBaseStats({
                          ...heroBaseStats,
                          defense: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Сила</Label>
                      <Input
                        type="number"
                        value={heroBaseStats.power}
                        onChange={(e) => setHeroBaseStats({
                          ...heroBaseStats,
                          power: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Магия</Label>
                      <Input
                        type="number"
                        value={heroBaseStats.magic}
                        onChange={(e) => setHeroBaseStats({
                          ...heroBaseStats,
                          magic: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={saveHeroBaseStats} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Применить изменения
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Множители классов героев</CardTitle>
              <CardDescription>Модификаторы характеристик для разных классов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {classMultipliers.map((cm) => (
                <div key={cm.id} className="border p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold">{cm.class_name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Здоровье x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.health_multiplier}
                        onChange={(e) => {
                          const updated = classMultipliers.map(c => 
                            c.id === cm.id ? { ...c, health_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setClassMultipliers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Защита x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.defense_multiplier}
                        onChange={(e) => {
                          const updated = classMultipliers.map(c => 
                            c.id === cm.id ? { ...c, defense_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setClassMultipliers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Сила x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.power_multiplier}
                        onChange={(e) => {
                          const updated = classMultipliers.map(c => 
                            c.id === cm.id ? { ...c, power_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setClassMultipliers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Магия x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.magic_multiplier}
                        onChange={(e) => {
                          const updated = classMultipliers.map(c => 
                            c.id === cm.id ? { ...c, magic_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setClassMultipliers(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={saveClassMultipliers} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Применить изменения
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dragons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Базовые параметры драконов</CardTitle>
              <CardDescription>Настройка начальных характеристик для драконов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dragonBaseStats && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Здоровье</Label>
                      <Input
                        type="number"
                        value={dragonBaseStats.health}
                        onChange={(e) => setDragonBaseStats({
                          ...dragonBaseStats,
                          health: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Защита</Label>
                      <Input
                        type="number"
                        value={dragonBaseStats.defense}
                        onChange={(e) => setDragonBaseStats({
                          ...dragonBaseStats,
                          defense: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Сила</Label>
                      <Input
                        type="number"
                        value={dragonBaseStats.power}
                        onChange={(e) => setDragonBaseStats({
                          ...dragonBaseStats,
                          power: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Магия</Label>
                      <Input
                        type="number"
                        value={dragonBaseStats.magic}
                        onChange={(e) => setDragonBaseStats({
                          ...dragonBaseStats,
                          magic: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={saveDragonBaseStats} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Применить изменения
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Множители классов драконов</CardTitle>
              <CardDescription>Модификаторы характеристик для разных классов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dragonClassMultipliers.map((cm) => (
                <div key={cm.id} className="border p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold">{cm.class_name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Здоровье x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.health_multiplier}
                        onChange={(e) => {
                          const updated = dragonClassMultipliers.map(c => 
                            c.id === cm.id ? { ...c, health_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setDragonClassMultipliers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Защита x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.defense_multiplier}
                        onChange={(e) => {
                          const updated = dragonClassMultipliers.map(c => 
                            c.id === cm.id ? { ...c, defense_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setDragonClassMultipliers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Сила x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.power_multiplier}
                        onChange={(e) => {
                          const updated = dragonClassMultipliers.map(c => 
                            c.id === cm.id ? { ...c, power_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setDragonClassMultipliers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Магия x</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cm.magic_multiplier}
                        onChange={(e) => {
                          const updated = dragonClassMultipliers.map(c => 
                            c.id === cm.id ? { ...c, magic_multiplier: parseFloat(e.target.value) || 0 } : c
                          );
                          setDragonClassMultipliers(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={saveDragonClassMultipliers} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Применить изменения
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Множители по редкости (R1-R8)</CardTitle>
              <CardDescription>Влияние редкости на характеристики карт</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {rarityMultipliers.map((rm) => (
                  <div key={rm.id} className="space-y-2">
                    <Label>R{rm.rarity} Множитель</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={rm.multiplier}
                      onChange={(e) => {
                        const updated = rarityMultipliers.map(r => 
                          r.id === rm.id ? { ...r, multiplier: parseFloat(e.target.value) || 0 } : r
                        );
                        setRarityMultipliers(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" onClick={saveRarityMultipliers} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Применить изменения
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Классы героев</CardTitle>
                <CardDescription>Управление множителями классов героев</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Настройки классов героев находятся во вкладке "Герои"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Классы драконов</CardTitle>
                <CardDescription>Управление множителями классов драконов</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Настройки классов драконов находятся во вкладке "Драконы"
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
