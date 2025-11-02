import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DungeonItemDrops } from "./DungeonItemDrops";
import { MonsterManagement } from "./MonsterManagement";
import { Checkbox } from "@/components/ui/checkbox";

interface MonsterWithCount {
  id: string;
  count: number;
}

interface LevelMonsterConfig {
  level: number;
  monsters: MonsterWithCount[];
}

interface MonsterSpawnConfig {
  normal: { min_level: number; max_level: number };
  miniboss: { levels: number[] };
  boss50: { level: number };
  boss100: { level: number };
  level_monsters?: LevelMonsterConfig[];
}

interface BossMultipliers {
  boss50: number;
  boss100: number;
}

interface DungeonSetting {
  id: string;
  dungeon_type: string;
  dungeon_name: string;
  dungeon_number: number;
  base_hp: number;
  base_armor: number;
  base_atk: number;
  hp_growth: number;
  armor_growth: number;
  atk_growth: number;
  monster_spawn_config: MonsterSpawnConfig;
  miniboss_hp_multiplier: number;
  miniboss_armor_multiplier: number;
  miniboss_atk_multiplier: number;
  boss_hp_multipliers: BossMultipliers;
  boss_armor_multipliers: BossMultipliers;
  boss_atk_multipliers: BossMultipliers;
}

interface Monster {
  id: string;
  monster_id: string;
  monster_name: string;
  monster_type: string;
}

export const DungeonSettings = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dungeons, setDungeons] = useState<DungeonSetting[]>([]);
  const [openDungeons, setOpenDungeons] = useState<Set<string>>(new Set());
  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => {
    loadDungeons();
    loadMonsters();
  }, []);

  const loadMonsters = async () => {
    try {
      const { data, error } = await supabase
        .from('monsters')
        .select('*')
        .eq('is_active', true)
        .order('monster_type', { ascending: true })
        .order('monster_name', { ascending: true });

      if (error) throw error;
      if (data) {
        setMonsters(data);
      }
    } catch (error) {
      console.error('Error loading monsters:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить список монстров",
      });
    }
  };

  const loadDungeons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dungeon_settings')
        .select('*')
        .order('dungeon_number');

      if (error) throw error;
      if (data) {
        const dungeonSettings: DungeonSetting[] = data.map(d => {
          // Преобразуем старый формат (массив строк) в новый (массив объектов)
          const spawnConfig = d.monster_spawn_config as any;
          if (spawnConfig?.level_monsters) {
            spawnConfig.level_monsters = spawnConfig.level_monsters.map((lm: any) => {
              if (Array.isArray(lm.monsters) && lm.monsters.length > 0 && typeof lm.monsters[0] === 'string') {
                // Старый формат - массив строк
                return {
                  level: lm.level,
                  monsters: lm.monsters.map((id: string) => ({ id, count: 1 }))
                };
              }
              // Новый формат - массив объектов
              return lm;
            });
          }
          
          return {
            ...d,
            monster_spawn_config: spawnConfig as unknown as MonsterSpawnConfig,
            miniboss_hp_multiplier: d.miniboss_hp_multiplier || 1.5,
            miniboss_armor_multiplier: d.miniboss_armor_multiplier || 1.5,
            miniboss_atk_multiplier: d.miniboss_atk_multiplier || 1.5,
            boss_hp_multipliers: d.boss_hp_multipliers as unknown as BossMultipliers,
            boss_armor_multipliers: d.boss_armor_multipliers as unknown as BossMultipliers,
            boss_atk_multipliers: d.boss_atk_multipliers as unknown as BossMultipliers,
          };
        });
        setDungeons(dungeonSettings);
      }
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

  const updateDungeon = (dungeonId: string, field: keyof DungeonSetting, value: number | MonsterSpawnConfig | BossMultipliers) => {
    setDungeons(dungeons.map(d => 
      d.id === dungeonId ? { ...d, [field]: value } : d
    ));
  };

  const updateMinibossLevels = (dungeonId: string, levels: string) => {
    const levelsArray = levels.split(',').map(l => parseInt(l.trim())).filter(l => !isNaN(l));
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (dungeon) {
      updateDungeon(dungeonId, 'monster_spawn_config', {
        ...dungeon.monster_spawn_config,
        miniboss: { levels: levelsArray }
      });
    }
  };

  const addLevelMonsterConfig = (dungeonId: string) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (dungeon) {
      const levelMonsters = dungeon.monster_spawn_config.level_monsters || [];
      const newLevel = levelMonsters.length > 0 ? Math.max(...levelMonsters.map(lm => lm.level)) + 1 : 1;
      updateDungeon(dungeonId, 'monster_spawn_config', {
        ...dungeon.monster_spawn_config,
        level_monsters: [...levelMonsters, { level: newLevel, monsters: [] }]
      });
    }
  };

  const updateLevelMonster = (dungeonId: string, levelIndex: number, field: 'level' | 'monsters', value: number | MonsterWithCount[]) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (dungeon && dungeon.monster_spawn_config.level_monsters) {
      const updatedLevelMonsters = [...dungeon.monster_spawn_config.level_monsters];
      updatedLevelMonsters[levelIndex] = {
        ...updatedLevelMonsters[levelIndex],
        [field]: value
      };
      updateDungeon(dungeonId, 'monster_spawn_config', {
        ...dungeon.monster_spawn_config,
        level_monsters: updatedLevelMonsters
      });
    }
  };

  const updateMonsterCount = (dungeonId: string, levelIndex: number, monsterId: string, count: number) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (dungeon && dungeon.monster_spawn_config.level_monsters) {
      const levelMonsters = dungeon.monster_spawn_config.level_monsters[levelIndex];
      const updatedMonsters = levelMonsters.monsters.map(m => 
        m.id === monsterId ? { ...m, count } : m
      );
      updateLevelMonster(dungeonId, levelIndex, 'monsters', updatedMonsters);
    }
  };

  const removeLevelMonsterConfig = (dungeonId: string, levelIndex: number) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (dungeon && dungeon.monster_spawn_config.level_monsters) {
      const updatedLevelMonsters = dungeon.monster_spawn_config.level_monsters.filter((_, idx) => idx !== levelIndex);
      updateDungeon(dungeonId, 'monster_spawn_config', {
        ...dungeon.monster_spawn_config,
        level_monsters: updatedLevelMonsters
      });
    }
  };

  const updateBossMultiplier = (dungeonId: string, multiplierType: 'boss_hp_multipliers' | 'boss_armor_multipliers' | 'boss_atk_multipliers', bossType: 'boss50' | 'boss100', value: number) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (dungeon) {
      updateDungeon(dungeonId, multiplierType, {
        ...dungeon[multiplierType],
        [bossType]: value
      });
    }
  };

  const saveDungeon = async (dungeon: DungeonSetting) => {
    console.log('💾 Saving dungeon:', dungeon.dungeon_name, 'AccountId:', accountId);
    
    // Разрешаем попытку сохранения без проверки кошелька на клиенте — доступ контролируется RLS в БД
    // if (!accountId) {
    //   toast({
    //     variant: "destructive",
    //     title: "Ошибка",
    //     description: "Необходимо подключить кошелек",
    //   });
    //   return;
    // }

    setSaving(true);
    try {
      console.log('📤 Sending update for dungeon:', dungeon.id);
      console.log('📋 monster_spawn_config:', JSON.stringify(dungeon.monster_spawn_config, null, 2));
      
      const { data: updatedRows, error } = await supabase
        .from('dungeon_settings')
        .update({
          base_hp: dungeon.base_hp,
          base_armor: dungeon.base_armor,
          base_atk: dungeon.base_atk,
          hp_growth: dungeon.hp_growth || 1.15,
          armor_growth: dungeon.armor_growth || 1.10,
          atk_growth: dungeon.atk_growth || 1.12,
          monster_spawn_config: dungeon.monster_spawn_config as any,
          miniboss_hp_multiplier: dungeon.miniboss_hp_multiplier || 1.5,
          miniboss_armor_multiplier: dungeon.miniboss_armor_multiplier || 1.5,
          miniboss_atk_multiplier: dungeon.miniboss_atk_multiplier || 1.5,
          boss_hp_multipliers: dungeon.boss_hp_multipliers as any,
          boss_armor_multipliers: dungeon.boss_armor_multipliers as any,
          boss_atk_multipliers: dungeon.boss_atk_multipliers as any,
        })
        .eq('id', dungeon.id)
        .select('id, monster_spawn_config')
        .limit(1);

      if (error) {
        console.error('❌ Error saving dungeon:', error);
        throw error;
      }

      console.log('✅ Dungeon saved successfully');
      if (updatedRows && updatedRows[0]) {
        console.log('🔎 DB monster_spawn_config after update:', JSON.stringify(updatedRows[0].monster_spawn_config, null, 2));
      }
      
      toast({
        title: "Успешно",
        description: `Настройки подземелья "${dungeon.dungeon_name}" сохранены`,
      });
      
      // Reload dungeons to get fresh data
      await loadDungeons();
    } catch (error) {
      console.error('💥 Error saving dungeon:', error);
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
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="settings">Настройки подземелий</TabsTrigger>
        <TabsTrigger value="drops">Настройки дропа</TabsTrigger>
        <TabsTrigger value="monsters">Управление монстрами</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-4">
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

                {/* Коэффициенты роста по уровням */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Коэффициенты роста по уровням</h4>
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

                {/* Настройки появления монстров */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Настройки появления монстров</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Уровни минибоссов (через запятую)</Label>
                      <Input
                        type="text"
                        value={dungeon.monster_spawn_config.miniboss.levels.join(', ')}
                        onChange={(e) => updateMinibossLevels(dungeon.id, e.target.value)}
                        placeholder="10, 20, 30, 40, 60, 70, 80, 90"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        На этих уровнях будут появляться минибоссы
                      </p>
                    </div>
                  </div>
                </div>

                {/* Настройка монстров по уровням */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Монстры по уровням подземелья</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addLevelMonsterConfig(dungeon.id)}
                    >
                      Добавить уровень
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Настройте, какие монстры появляются на каждом уровне подземелья
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(dungeon.monster_spawn_config.level_monsters || []).map((levelConfig, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Уровень {levelConfig.level}</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLevelMonsterConfig(dungeon.id, idx)}
                          >
                            Удалить
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Номер уровня</Label>
                            <Input
                              type="number"
                              value={levelConfig.level}
                              onChange={(e) => updateLevelMonster(dungeon.id, idx, 'level', parseInt(e.target.value) || 1)}
                              min={1}
                              max={100}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Выберите монстров и укажите количество</Label>
                            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                              {monsters.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Загрузка монстров...</p>
                              ) : (
                                monsters.map((monster) => {
                                  const monsterData = levelConfig.monsters.find(m => m.id === monster.monster_id);
                                  const isChecked = !!monsterData;
                                  
                                  return (
                                    <div key={monster.monster_id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${dungeon.id}-${idx}-${monster.monster_id}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const currentMonsters = levelConfig.monsters;
                                          const newMonsters = checked
                                            ? [...currentMonsters, { id: monster.monster_id, count: 1 }]
                                            : currentMonsters.filter(m => m.id !== monster.monster_id);
                                          updateLevelMonster(dungeon.id, idx, 'monsters', newMonsters);
                                        }}
                                      />
                                      <label
                                        htmlFor={`${dungeon.id}-${idx}-${monster.monster_id}`}
                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        {monster.monster_name} <span className="text-muted-foreground">({monster.monster_type})</span>
                                      </label>
                                      {isChecked && (
                                        <Input
                                          type="number"
                                          min={1}
                                          value={monsterData.count}
                                          onChange={(e) => updateMonsterCount(dungeon.id, idx, monster.monster_id, parseInt(e.target.value) || 1)}
                                          className="w-16 h-7 text-xs"
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Выбрано монстров: {levelConfig.monsters.length > 0 
                            ? levelConfig.monsters.map(m => {
                                const monster = monsters.find(mon => mon.monster_id === m.id);
                                return `${monster?.monster_name || m.id} (x${m.count})`;
                              }).join(', ')
                            : 'не указаны'}
                        </p>
                      </div>
                    ))}
                    {(!dungeon.monster_spawn_config.level_monsters || dungeon.monster_spawn_config.level_monsters.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Нет настроенных уровней. Нажмите "Добавить уровень" чтобы начать.
                      </p>
                    )}
                  </div>
                </div>

                {/* Множители минибоссов */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Множители характеристик минибоссов</h4>
                  <p className="text-xs text-muted-foreground">
                    Эти множители применяются к базовым характеристикам монстров для минибоссов
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">HP множитель</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dungeon.miniboss_hp_multiplier}
                        onChange={(e) => updateDungeon(dungeon.id, 'miniboss_hp_multiplier', parseFloat(e.target.value) || 1.5)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Armor множитель</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dungeon.miniboss_armor_multiplier}
                        onChange={(e) => updateDungeon(dungeon.id, 'miniboss_armor_multiplier', parseFloat(e.target.value) || 1.5)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ATK множитель</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dungeon.miniboss_atk_multiplier}
                        onChange={(e) => updateDungeon(dungeon.id, 'miniboss_atk_multiplier', parseFloat(e.target.value) || 1.5)}
                      />
                    </div>
                  </div>
                </div>

                {/* Множители боссов (независимые от базовых характеристик) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Множители характеристик боссов</h4>
                  <p className="text-xs text-muted-foreground">
                    Эти множители применяются к базовым характеристикам монстров для боссов
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="font-medium text-xs">Босс 50 уровня</p>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">HP множитель</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={dungeon.boss_hp_multipliers.boss50}
                            onChange={(e) => updateBossMultiplier(dungeon.id, 'boss_hp_multipliers', 'boss50', parseFloat(e.target.value) || 2.5)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Armor множитель</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={dungeon.boss_armor_multipliers.boss50}
                            onChange={(e) => updateBossMultiplier(dungeon.id, 'boss_armor_multipliers', 'boss50', parseFloat(e.target.value) || 1.3)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ATK множитель</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={dungeon.boss_atk_multipliers.boss50}
                            onChange={(e) => updateBossMultiplier(dungeon.id, 'boss_atk_multipliers', 'boss50', parseFloat(e.target.value) || 1.1)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="font-medium text-xs">Босс 100 уровня</p>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">HP множитель</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={dungeon.boss_hp_multipliers.boss100}
                            onChange={(e) => updateBossMultiplier(dungeon.id, 'boss_hp_multipliers', 'boss100', parseFloat(e.target.value) || 4.0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Armor множитель</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={dungeon.boss_armor_multipliers.boss100}
                            onChange={(e) => updateBossMultiplier(dungeon.id, 'boss_armor_multipliers', 'boss100', parseFloat(e.target.value) || 1.5)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ATK множитель</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={dungeon.boss_atk_multipliers.boss100}
                            onChange={(e) => updateBossMultiplier(dungeon.id, 'boss_atk_multipliers', 'boss100', parseFloat(e.target.value) || 1.15)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Предпросмотр характеристик */}
                <div className="space-y-3 bg-accent/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm">Предпросмотр монстров</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-medium mb-2">Уровень 1 (Normal):</p>
                      <p>HP: {Math.floor(dungeon.base_hp * Math.pow(1.2, dungeon.dungeon_number - 1))}</p>
                      <p>Armor: {Math.floor(dungeon.base_armor * Math.pow(1.2, dungeon.dungeon_number - 1))}</p>
                      <p>ATK: {Math.floor(dungeon.base_atk * Math.pow(1.2, dungeon.dungeon_number - 1))}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Уровень 50 (Boss):</p>
                      <p>HP: {Math.floor(dungeon.base_hp * Math.pow(dungeon.hp_growth || 1.15, 4.9) * Math.pow(1.2, dungeon.dungeon_number - 1) * dungeon.boss_hp_multipliers.boss50)}</p>
                      <p>Armor: {Math.floor(dungeon.base_armor * Math.pow(dungeon.armor_growth || 1.10, 4.9) * Math.pow(1.2, dungeon.dungeon_number - 1) * dungeon.boss_armor_multipliers.boss50)}</p>
                      <p>ATK: {Math.floor(dungeon.base_atk * Math.pow(dungeon.atk_growth || 1.12, 4.9) * Math.pow(1.2, dungeon.dungeon_number - 1) * dungeon.boss_atk_multipliers.boss50)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Минибоссы появляются на уровнях: {dungeon.monster_spawn_config.miniboss.levels.join(', ')}
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
      </TabsContent>

      <TabsContent value="drops">
        <DungeonItemDrops />
      </TabsContent>

      <TabsContent value="monsters">
        <MonsterManagement />
      </TabsContent>
    </Tabs>
  );
};
