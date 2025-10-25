import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, X, Upload, Image } from 'lucide-react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BuildingConfig {
  id: string;
  building_id: string;
  building_name: string;
  level: number;
  production_per_hour: number;
  cost_wood: number;
  cost_stone: number;
  cost_iron: number;
  cost_gold: number;
  cost_ell: number;
  cost_gt: number;
  required_items: Array<{ item_id: number; quantity: number }>;
  required_main_hall_level: number;
  upgrade_time_hours: number;
  storage_capacity: number;
  working_hours: number;
  is_active: boolean;
  background_image_url?: string;
}

interface MaterialItem {
  id: number;
  name: string;
  item_id: string;
}

const BUILDING_TYPES = [
  { id: 'sawmill', name: 'Лесопилка' },
  { id: 'quarry', name: 'Каменоломня' },
  { id: 'storage', name: 'Склад' },
  { id: 'main_hall', name: 'Главный зал' },
  { id: 'barracks', name: 'Казармы' },
  { id: 'workshop', name: 'Мастерская' },
  { id: 'medical', name: 'Медицинский пункт' },
  { id: 'dragon_lair', name: 'Драконье логово' },
];

export default function ShelterBuildingSettings() {
  const { accountId } = useWalletContext();
  const [configs, setConfigs] = useState<BuildingConfig[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('sawmill');
  const [editingConfig, setEditingConfig] = useState<Partial<BuildingConfig> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
    loadConfigs();
  }, [selectedBuilding]);

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('item_templates')
        .select('id, name, item_id')
        .eq('type', 'material')
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error('Error loading materials:', error);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('building_configs')
        .select('*')
        .eq('building_id', selectedBuilding)
        .order('level', { ascending: true });

      if (error) throw error;
      
      const formattedData = (data || []).map(item => {
        let requiredItems: Array<{ item_id: number; quantity: number }> = [];
        
        if (item.required_items) {
          if (typeof item.required_items === 'string') {
            try {
              requiredItems = JSON.parse(item.required_items);
            } catch (e) {
              console.error('Error parsing required_items:', e);
            }
          } else if (Array.isArray(item.required_items)) {
            requiredItems = item.required_items as Array<{ item_id: number; quantity: number }>;
          }
        }
        
        return {
          ...item,
          required_items: requiredItems
        };
      }) as BuildingConfig[];
      
      console.log('Loaded configs:', formattedData);
      setConfigs(formattedData);
      
      // Устанавливаем URL фонового изображения для выбранного здания
      if (formattedData.length > 0 && formattedData[0].background_image_url) {
        setCurrentBackgroundUrl(formattedData[0].background_image_url);
      } else {
        setCurrentBackgroundUrl(null);
      }
    } catch (error: any) {
      console.error('Error loading building configs:', error);
      toast.error('Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: Partial<BuildingConfig>) => {
    try {
      setSaving(true);
      
      console.log('Saving config:', config);
      console.log('Required items:', config.required_items);
      
      if (config.id) {
        // Update existing
        const updateData = {
          production_per_hour: config.production_per_hour || 0,
          cost_wood: config.cost_wood || 0,
          cost_stone: config.cost_stone || 0,
          cost_iron: config.cost_iron || 0,
          cost_gold: config.cost_gold || 0,
          cost_ell: config.cost_ell || 0,
          cost_gt: config.cost_gt || 0,
          required_items: config.required_items || [],
          required_main_hall_level: config.required_main_hall_level || 0,
          upgrade_time_hours: config.upgrade_time_hours || 1,
          storage_capacity: config.storage_capacity || 0,
          working_hours: config.working_hours || 0,
        };
        
        console.log('Update data:', updateData);
        
        const { data: updateRpcRes, error } = await supabase
          .rpc('admin_update_building_config', {
            p_id: config.id,
            p_update: updateData as any
          });

        console.log('Update RPC result:', updateRpcRes);
        console.log('Update RPC error:', error);
        
        if (error) throw error;
        toast.success('Настройки обновлены');
      } else {
        // Insert new
        const insertData = {
          building_id: selectedBuilding,
          building_name: BUILDING_TYPES.find(b => b.id === selectedBuilding)?.name || selectedBuilding,
          level: config.level || 1,
          production_per_hour: config.production_per_hour || 0,
          cost_wood: config.cost_wood || 0,
          cost_stone: config.cost_stone || 0,
          cost_iron: config.cost_iron || 0,
          cost_gold: config.cost_gold || 0,
          cost_ell: config.cost_ell || 0,
          cost_gt: config.cost_gt || 0,
          required_items: config.required_items || [],
          required_main_hall_level: config.required_main_hall_level || 0,
          upgrade_time_hours: config.upgrade_time_hours || 1,
          storage_capacity: config.storage_capacity || 0,
          working_hours: config.working_hours || 0,
          created_by_wallet_address: 'admin',
        };
        
        console.log('Insert data:', insertData);
        
        const { data: insertRpcRes, error } = await supabase
          .rpc('admin_insert_building_config', {
            p_data: insertData as any
          });

        console.log('Insert RPC result:', insertRpcRes);
        console.log('Insert RPC error:', error);
        
        if (error) throw error;
        toast.success('Уровень добавлен');
      }

      await loadConfigs();
      setEditingConfig(null);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Ошибка сохранения: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту конфигурацию?')) return;

    try {
      const { error } = await supabase
        .from('building_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Конфигурация удалена');
      await loadConfigs();
    } catch (error: any) {
      console.error('Error deleting config:', error);
      toast.error('Ошибка удаления');
    }
  };

  const startNewConfig = () => {
    const maxLevel = Math.max(...configs.map(c => c.level), 0);
    setEditingConfig({
      level: maxLevel + 1,
      production_per_hour: 0,
      cost_wood: 0,
      cost_stone: 0,
      cost_iron: 0,
      cost_gold: 0,
      cost_ell: 0,
      cost_gt: 0,
      required_items: [],
      required_main_hall_level: 0,
      upgrade_time_hours: 1,
      storage_capacity: 0,
      working_hours: 0,
    });
  };

  const addRequiredItem = (configId: string) => {
    const updated = configs.map(c => {
      if (c.id === configId) {
        return {
          ...c,
          required_items: [...(c.required_items || []), { item_id: materials[0]?.id || 0, quantity: 1 }]
        };
      }
      return c;
    });
    setConfigs(updated);
  };

  const removeRequiredItem = (configId: string, index: number) => {
    const updated = configs.map(c => {
      if (c.id === configId) {
        const items = [...(c.required_items || [])];
        items.splice(index, 1);
        return { ...c, required_items: items };
      }
      return c;
    });
    setConfigs(updated);
  };

  const updateRequiredItem = (configId: string, index: number, field: 'item_id' | 'quantity', value: number) => {
    const updated = configs.map(c => {
      if (c.id === configId) {
        const items = [...(c.required_items || [])];
        items[index] = { ...items[index], [field]: value };
        return { ...c, required_items: items };
      }
      return c;
    });
    setConfigs(updated);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !accountId) {
      toast.error('Выберите файл и убедитесь что вы авторизованы');
      return;
    }

    try {
      setUploading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('Нет токена авторизации');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('filePath', `${selectedBuilding}/${Date.now()}-${file.name}`);
      formData.append('buildingId', selectedBuilding);
      formData.append('walletAddress', accountId);

      const response = await supabase.functions.invoke('upload-building-background', {
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Ошибка загрузки');
      }

      const { url } = response.data;
      setCurrentBackgroundUrl(url);
      toast.success('Фоновое изображение загружено успешно');
      await loadConfigs();
    } catch (error: any) {
      console.error('Error uploading background:', error);
      toast.error(error.message || 'Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Настройки зданий Shelter</h2>
        <Button onClick={startNewConfig} variant="default">
          <Plus className="w-4 h-4 mr-2" />
          Добавить уровень
        </Button>
      </div>

      <Card className="p-4 bg-black/50 border-white/20">
        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <label className="text-white font-medium">Здание:</label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-64 bg-black/50 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILDING_TYPES.map(building => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Секция загрузки фонового изображения */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-white font-medium block mb-2">
                  Фоновое изображение здания:
                </label>
                {currentBackgroundUrl && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-white/20">
                      <img 
                        src={currentBackgroundUrl} 
                        alt="Building background" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm text-white/60 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Текущее изображение
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="background-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('background-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {currentBackgroundUrl ? 'Изменить изображение' : 'Загрузить изображение'}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Загрузите фоновое изображение для этого здания. Оно будет применено ко всем уровням.
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Уровень</TableHead>
                  <TableHead className="text-white">Добыча/час</TableHead>
                  <TableHead className="text-white">Древесина</TableHead>
                  <TableHead className="text-white">Камень</TableHead>
                  <TableHead className="text-white">Железо</TableHead>
                  <TableHead className="text-white">Золото</TableHead>
                  <TableHead className="text-white">ELL</TableHead>
                  <TableHead className="text-white">GT</TableHead>
                  <TableHead className="text-white">Предметы</TableHead>
                  <TableHead className="text-white">Время (ч)</TableHead>
                  <TableHead className="text-white">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map(config => (
                  <TableRow key={config.id}>
                    <TableCell className="text-white">{config.level}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.production_per_hour}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, production_per_hour: parseInt(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-20 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.cost_wood}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, cost_wood: parseInt(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.cost_stone}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, cost_stone: parseInt(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.cost_iron}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, cost_iron: parseInt(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.cost_gold}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, cost_gold: parseInt(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.cost_ell}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, cost_ell: parseInt(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={config.cost_gt}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, cost_gt: parseFloat(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {(config.required_items || []).map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={item.item_id}
                              onChange={(e) => updateRequiredItem(config.id, idx, 'item_id', parseInt(e.target.value))}
                              className="bg-black/50 border border-white/20 text-white rounded px-2 py-1 text-sm"
                            >
                              {materials.map(mat => (
                                <option key={mat.id} value={mat.id}>{mat.name}</option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateRequiredItem(config.id, idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 bg-black/50 border-white/20 text-white"
                            />
                            <Button
                              onClick={() => removeRequiredItem(config.id, idx)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => addRequiredItem(config.id)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Добавить
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.upgrade_time_hours}
                        onChange={(e) => {
                          const updated = configs.map(c =>
                            c.id === config.id
                              ? { ...c, upgrade_time_hours: parseInt(e.target.value) || 1 }
                              : c
                          );
                          setConfigs(updated);
                        }}
                        className="w-20 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(config)}
                          disabled={saving}
                          size="sm"
                          variant="default"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(config.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {editingConfig && (
                  <TableRow className="bg-blue-500/10">
                    <TableCell className="text-white font-bold">
                      <Input
                        type="number"
                        value={editingConfig.level}
                        onChange={(e) => setEditingConfig({ ...editingConfig, level: parseInt(e.target.value) || 1 })}
                        className="w-20 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.production_per_hour}
                        onChange={(e) => setEditingConfig({ ...editingConfig, production_per_hour: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.cost_wood}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cost_wood: parseInt(e.target.value) || 0 })}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.cost_stone}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cost_stone: parseInt(e.target.value) || 0 })}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.cost_iron}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cost_iron: parseInt(e.target.value) || 0 })}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.cost_gold}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cost_gold: parseInt(e.target.value) || 0 })}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.cost_ell}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cost_ell: parseInt(e.target.value) || 0 })}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingConfig.cost_gt}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cost_gt: parseFloat(e.target.value) || 0 })}
                        className="w-24 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {(editingConfig.required_items || []).map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={item.item_id}
                              onChange={(e) => {
                                const items = [...(editingConfig.required_items || [])];
                                items[idx] = { ...items[idx], item_id: parseInt(e.target.value) };
                                setEditingConfig({ ...editingConfig, required_items: items });
                              }}
                              className="bg-black/50 border border-white/20 text-white rounded px-2 py-1 text-sm"
                            >
                              {materials.map(mat => (
                                <option key={mat.id} value={mat.id}>{mat.name}</option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const items = [...(editingConfig.required_items || [])];
                                items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 1 };
                                setEditingConfig({ ...editingConfig, required_items: items });
                              }}
                              className="w-16 bg-black/50 border-white/20 text-white"
                            />
                            <Button
                              onClick={() => {
                                const items = [...(editingConfig.required_items || [])];
                                items.splice(idx, 1);
                                setEditingConfig({ ...editingConfig, required_items: items });
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => {
                            setEditingConfig({
                              ...editingConfig,
                              required_items: [...(editingConfig.required_items || []), { item_id: materials[0]?.id || 0, quantity: 1 }]
                            });
                          }}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Добавить
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editingConfig.upgrade_time_hours}
                        onChange={(e) => setEditingConfig({ ...editingConfig, upgrade_time_hours: parseInt(e.target.value) || 1 })}
                        className="w-20 bg-black/50 border-white/20 text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(editingConfig)}
                          disabled={saving}
                          size="sm"
                          variant="default"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditingConfig(null)}
                          size="sm"
                          variant="outline"
                        >
                          Отмена
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
