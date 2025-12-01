import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Loader2, Save } from "lucide-react";
import { refreshGameSettings } from "@/utils/cardUtils";
import { RecalculateNFTStatsButton } from "./RecalculateNFTStatsButton";
import { RecalculateAllCardsButton } from "./RecalculateAllCardsButton";
import { RecalculateCardTemplatesButton } from "./RecalculateCardTemplatesButton";
import { useQueryClient } from '@tanstack/react-query';
import { 
  useHeroBaseStats, 
  useDragonBaseStats, 
  useRarityMultipliers, 
  useClassMultipliers, 
  useDragonClassMultipliers 
} from '@/hooks/useGameStatsData';

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
  const { accountId } = useWalletContext();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Use cached queries
  const { data: heroBaseStatsData, isLoading: heroLoading } = useHeroBaseStats();
  const { data: dragonBaseStatsData, isLoading: dragonLoading } = useDragonBaseStats();
  const { data: rarityMultipliersData = [], isLoading: rarityLoading } = useRarityMultipliers();
  const { data: classMultipliersData = [], isLoading: classLoading } = useClassMultipliers();
  const { data: dragonClassMultipliersData = [], isLoading: dragonClassLoading } = useDragonClassMultipliers();

  // Local state for editing
  const [heroBaseStats, setHeroBaseStats] = useState<HeroBaseStats | null>(null);
  const [dragonBaseStats, setDragonBaseStats] = useState<DragonBaseStats | null>(null);
  const [rarityMultipliers, setRarityMultipliers] = useState<RarityMultiplier[]>([]);
  const [classMultipliers, setClassMultipliers] = useState<ClassMultiplier[]>([]);
  const [dragonClassMultipliers, setDragonClassMultipliers] = useState<ClassMultiplier[]>([]);

  const loading = heroLoading || dragonLoading || rarityLoading || classLoading || dragonClassLoading;

  // Sync cached data to local state when it loads
  useEffect(() => {
    if (heroBaseStatsData) setHeroBaseStats(heroBaseStatsData);
  }, [heroBaseStatsData]);

  useEffect(() => {
    if (dragonBaseStatsData) setDragonBaseStats(dragonBaseStatsData);
  }, [dragonBaseStatsData]);

  useEffect(() => {
    if (rarityMultipliersData.length > 0) setRarityMultipliers(rarityMultipliersData);
  }, [rarityMultipliersData]);

  useEffect(() => {
    if (classMultipliersData.length > 0) setClassMultipliers(classMultipliersData);
  }, [classMultipliersData]);

  useEffect(() => {
    if (dragonClassMultipliersData.length > 0) setDragonClassMultipliers(dragonClassMultipliersData);
  }, [dragonClassMultipliersData]);

  const saveHeroBaseStats = async () => {
    if (!heroBaseStats) return;
    setSaving(true);
    try {
      console.log('Saving hero stats via RPC:', heroBaseStats);
      const { data, error } = await supabase.rpc('admin_update_hero_base_stats', {
        p_health: heroBaseStats.health,
        p_defense: heroBaseStats.defense,
        p_power: heroBaseStats.power,
        p_magic: heroBaseStats.magic,
        p_admin_wallet_address: accountId
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      console.log('Save successful (RPC):', data);
      
      // Пересчитываем все card_templates с новыми базовыми характеристиками
      const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_card_templates');
      if (recalcError) {
        console.error('Error recalculating card templates:', recalcError);
      } else {
        console.log('Recalculated card templates:', recalcData);
      }
      
      toast({
        title: "Успешно",
        description: `Базовые параметры героев сохранены. Обновлено шаблонов: ${recalcData || 0}`,
      });
      
      // Обновляем кеш настроек
      await refreshGameSettings();
      
      // Invalidate cache to reload
      queryClient.invalidateQueries({ queryKey: ['heroBaseStats'] });
      queryClient.invalidateQueries({ queryKey: ['cardTemplates'] });
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
      console.log('Saving dragon stats via RPC:', dragonBaseStats);
      const { data, error } = await supabase.rpc('admin_update_dragon_base_stats', {
        p_health: dragonBaseStats.health,
        p_defense: dragonBaseStats.defense,
        p_power: dragonBaseStats.power,
        p_magic: dragonBaseStats.magic,
        p_admin_wallet_address: accountId
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      console.log('Save successful (RPC):', data);
      
      // Пересчитываем все card_templates с новыми базовыми характеристиками
      const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_card_templates');
      if (recalcError) {
        console.error('Error recalculating card templates:', recalcError);
      } else {
        console.log('Recalculated card templates:', recalcData);
      }
      
      toast({
        title: "Успешно",
        description: `Базовые параметры драконов сохранены. Обновлено шаблонов: ${recalcData || 0}`,
      });
      
      // Обновляем кеш настроек
      await refreshGameSettings();
      
      // Invalidate cache to reload
      queryClient.invalidateQueries({ queryKey: ['dragonBaseStats'] });
      queryClient.invalidateQueries({ queryKey: ['cardTemplates'] });
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
      
      // Пересчитываем все card_templates с новыми мультипликаторами
      const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_card_templates');
      if (recalcError) {
        console.error('Error recalculating card templates:', recalcError);
      } else {
        console.log('Recalculated card templates:', recalcData);
      }
      
      toast({
        title: "Успешно",
        description: `Множители редкости сохранены. Обновлено шаблонов: ${recalcData || 0}`,
      });
      
      // Обновляем кеш настроек
      await refreshGameSettings();
      
      // Invalidate cache to reload
      queryClient.invalidateQueries({ queryKey: ['rarityMultipliers'] });
      queryClient.invalidateQueries({ queryKey: ['cardTemplates'] });
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
      
      // Пересчитываем все card_templates с новыми мультипликаторами
      const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_card_templates');
      if (recalcError) {
        console.error('Error recalculating card templates:', recalcError);
      } else {
        console.log('Recalculated card templates:', recalcData);
      }
      
      toast({
        title: "Успешно",
        description: `Множители классов героев сохранены. Обновлено шаблонов: ${recalcData || 0}`,
      });
      
      // Обновляем кеш настроек
      await refreshGameSettings();
      
      // Invalidate cache to reload
      queryClient.invalidateQueries({ queryKey: ['classMultipliers'] });
      queryClient.invalidateQueries({ queryKey: ['cardTemplates'] });
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
      
      // Пересчитываем все card_templates с новыми мультипликаторами
      const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_card_templates');
      if (recalcError) {
        console.error('Error recalculating card templates:', recalcError);
      } else {
        console.log('Recalculated card templates:', recalcData);
      }
      
      toast({
        title: "Успешно",
        description: `Множители классов драконов сохранены. Обновлено шаблонов: ${recalcData || 0}`,
      });
      
      // Обновляем кеш настроек
      await refreshGameSettings();
      
      // Invalidate cache to reload
      queryClient.invalidateQueries({ queryKey: ['dragonClassMultipliers'] });
      queryClient.invalidateQueries({ queryKey: ['cardTemplates'] });
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
      <div className="mb-4 flex gap-2">
        <RecalculateNFTStatsButton />
        <RecalculateAllCardsButton />
        <RecalculateCardTemplatesButton />
      </div>

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
