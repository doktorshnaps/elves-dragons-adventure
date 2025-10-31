import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { useItemTemplates } from '@/hooks/useItemTemplates';
import { useCardUpgradeRequirements } from '@/hooks/useCardUpgradeRequirements';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const CardUpgradeManager = () => {
  const { toast } = useToast();
  const { templates } = useItemTemplates();
  const { requirements, loading: loadingReqs, reload } = useCardUpgradeRequirements();
  const { accountId } = useWalletContext();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Фильтруем только материалы
  const materials = Array.from(templates.values()).filter(t => t.type === 'material');

  const [formData, setFormData] = useState({
    card_type: 'hero' as 'hero' | 'dragon',
    card_class: '' as string,
    faction: '' as string,
    from_rarity: 1,
    to_rarity: 2,
    success_chance: 90,
    cost_ell: 0,
    cost_wood: 0,
    cost_stone: 0,
    cost_iron: 0,
    cost_gold: 0,
    required_items: [] as Array<{ item_id: string; name: string; quantity: number }>
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = editingId
        ? await supabase
            .from('card_upgrade_requirements')
            .update({
              success_chance: formData.success_chance,
              cost_ell: formData.cost_ell,
              cost_wood: formData.cost_wood,
              cost_stone: formData.cost_stone,
              cost_iron: formData.cost_iron,
              cost_gold: formData.cost_gold,
              required_items: formData.required_items
            })
            .eq('id', editingId)
        : await supabase
            .from('card_upgrade_requirements')
            .insert([{
              card_type: formData.card_type,
              card_class: formData.card_class || null,
              faction: formData.faction || null,
              rarity: String(formData.from_rarity),
              from_rarity: formData.from_rarity,
              to_rarity: formData.to_rarity,
              success_chance: formData.success_chance,
              cost_ell: formData.cost_ell,
              cost_wood: formData.cost_wood,
              cost_stone: formData.cost_stone,
              cost_iron: formData.cost_iron,
              cost_gold: formData.cost_gold,
              required_items: formData.required_items as any,
              created_by_wallet_address: 'mr_bruts.tg',
              is_active: true
            }]);

      if (error) throw error;

      toast({
        title: editingId ? 'Требование обновлено' : 'Требование создано',
        description: 'Изменения успешно сохранены'
      });

      resetForm();
      reload();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setFormData({
      card_type: req.card_type,
      card_class: req.card_class || '',
      faction: req.faction || '',
      from_rarity: req.from_rarity,
      to_rarity: req.to_rarity,
      success_chance: req.success_chance,
      cost_ell: req.cost_ell,
      cost_wood: req.cost_wood || 0,
      cost_stone: req.cost_stone || 0,
      cost_iron: req.cost_iron || 0,
      cost_gold: req.cost_gold || 0,
      required_items: req.required_items || []
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены что хотите удалить это требование?')) return;
    
    try {
      const walletAddress = accountId;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const { error } = await supabase.rpc('admin_delete_card_upgrade_requirement', {
        p_id: id,
        p_wallet: walletAddress
      });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({
        title: 'Требование удалено',
        description: 'Запись успешно удалена'
      });
      reload();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Недостаточно прав для удаления',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      card_type: 'hero',
      card_class: '',
      faction: '',
      from_rarity: 1,
      to_rarity: 2,
      success_chance: 90,
      cost_ell: 0,
      cost_wood: 0,
      cost_stone: 0,
      cost_iron: 0,
      cost_gold: 0,
      required_items: []
    });
  };

  const addRequiredItem = () => {
    if (materials.length === 0) return;
    const firstMaterial = materials[0];
    setFormData({
      ...formData,
      required_items: [
        ...formData.required_items,
        { item_id: firstMaterial.item_id, name: firstMaterial.name, quantity: 1 }
      ]
    });
  };

  const removeRequiredItem = (index: number) => {
    setFormData({
      ...formData,
      required_items: formData.required_items.filter((_, i) => i !== index)
    });
  };

  const updateRequiredItem = (index: number, field: string, value: any) => {
    const updated = [...formData.required_items];
    if (field === 'item_id') {
      const material = materials.find(m => m.item_id === value);
      if (material) {
        updated[index] = { ...updated[index], item_id: value, name: material.name };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData({ ...formData, required_items: updated });
  };

  if (loadingReqs) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки улучшений карт</CardTitle>
          <CardDescription>
            Управление требованиями для улучшения героев и драконов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Тип карты</Label>
              <Select
                value={formData.card_type}
                onValueChange={(value: 'hero' | 'dragon') =>
                  setFormData({ ...formData, card_type: value, card_class: '', faction: '' })
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Герой</SelectItem>
                  <SelectItem value="dragon">Дракон</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Класс (опционально)</Label>
              <Select
                value={formData.card_class}
                onValueChange={(value) =>
                  setFormData({ ...formData, card_class: value })
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все классы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все классы</SelectItem>
                  {formData.card_type === 'hero' ? (
                    <>
                      <SelectItem value="Рекрут">Рекрут</SelectItem>
                      <SelectItem value="Страж">Страж</SelectItem>
                      <SelectItem value="Ветеран">Ветеран</SelectItem>
                      <SelectItem value="Маг">Маг</SelectItem>
                      <SelectItem value="Мастер Целитель">Мастер Целитель</SelectItem>
                      <SelectItem value="Защитник">Защитник</SelectItem>
                      <SelectItem value="Ветеран Защитник">Ветеран Защитник</SelectItem>
                      <SelectItem value="Стратег">Стратег</SelectItem>
                      <SelectItem value="Верховный Стратег">Верховный Стратег</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Обычный">Обычный</SelectItem>
                      <SelectItem value="Необычный">Необычный</SelectItem>
                      <SelectItem value="Редкий">Редкий</SelectItem>
                      <SelectItem value="Эпический">Эпический</SelectItem>
                      <SelectItem value="Легендарный">Легендарный</SelectItem>
                      <SelectItem value="Мифический">Мифический</SelectItem>
                      <SelectItem value="Этернал">Этернал</SelectItem>
                      <SelectItem value="Империал">Империал</SelectItem>
                      <SelectItem value="Титан">Титан</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Фракция (опционально)</Label>
              <Select
                value={formData.faction}
                onValueChange={(value) =>
                  setFormData({ ...formData, faction: value })
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все фракции" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все фракции</SelectItem>
                  <SelectItem value="Каледор">Каледор</SelectItem>
                  <SelectItem value="Сильванести">Сильванести</SelectItem>
                  <SelectItem value="Фаэлин">Фаэлин</SelectItem>
                  <SelectItem value="Элленар">Элленар</SelectItem>
                  <SelectItem value="Тэлэрион">Тэлэрион</SelectItem>
                  <SelectItem value="Аэлантир">Аэлантир</SelectItem>
                  <SelectItem value="Лиорас">Лиорас</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Исходная редкость</Label>
              <Select
                value={String(formData.from_rarity)}
                onValueChange={(value) => {
                  const fromRarity = parseInt(value);
                  setFormData({ 
                    ...formData, 
                    from_rarity: fromRarity,
                    to_rarity: Math.max(fromRarity + 1, formData.to_rarity)
                  });
                }}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Редкость 1</SelectItem>
                  <SelectItem value="2">Редкость 2</SelectItem>
                  <SelectItem value="3">Редкость 3</SelectItem>
                  <SelectItem value="4">Редкость 4</SelectItem>
                  <SelectItem value="5">Редкость 5</SelectItem>
                  <SelectItem value="6">Редкость 6</SelectItem>
                  <SelectItem value="7">Редкость 7</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Целевая редкость</Label>
              <Select
                value={String(formData.to_rarity)}
                onValueChange={(value) => setFormData({ ...formData, to_rarity: parseInt(value) })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].filter(r => r > formData.from_rarity).map(r => (
                    <SelectItem key={r} value={String(r)}>Редкость {r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Шанс успеха (%)</Label>
              <Input
                type="number"
                value={formData.success_chance}
                onChange={(e) =>
                  setFormData({ ...formData, success_chance: parseInt(e.target.value) || 0 })
                }
                min={0}
                max={100}
              />
            </div>

            <div>
              <Label>Стоимость ELL</Label>
              <Input
                type="number"
                value={formData.cost_ell}
                onChange={(e) =>
                  setFormData({ ...formData, cost_ell: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            <div>
              <Label>Дерево</Label>
              <Input
                type="number"
                value={formData.cost_wood}
                onChange={(e) =>
                  setFormData({ ...formData, cost_wood: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Камень</Label>
              <Input
                type="number"
                value={formData.cost_stone}
                onChange={(e) =>
                  setFormData({ ...formData, cost_stone: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            <div>
              <Label>Железо</Label>
              <Input
                type="number"
                value={formData.cost_iron}
                onChange={(e) =>
                  setFormData({ ...formData, cost_iron: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            <div>
              <Label>Золото</Label>
              <Input
                type="number"
                value={formData.cost_gold}
                onChange={(e) =>
                  setFormData({ ...formData, cost_gold: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Требуемые предметы</Label>
              <Button onClick={addRequiredItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Добавить предмет
              </Button>
            </div>

            {formData.required_items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Select
                  value={item.item_id}
                  onValueChange={(value) => updateRequiredItem(index, 'item_id', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((mat) => (
                      <SelectItem key={mat.item_id} value={mat.item_id}>
                        {mat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateRequiredItem(index, 'quantity', parseInt(e.target.value) || 1)
                  }
                  min={1}
                  className="w-24"
                  placeholder="Кол-во"
                />

                <Button
                  onClick={() => removeRequiredItem(index)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingId ? 'Обновить' : 'Создать'}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline">
                Отмена
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Текущие настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <div className="font-semibold">
                    {req.card_type === 'hero' ? 'Герой' : 'Дракон'} - Редкость {req.from_rarity} → {req.to_rarity}
                    {req.card_class && ` - ${req.card_class}`}
                    {req.faction && ` (${req.faction})`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Шанс: {req.success_chance}% | ELL: {req.cost_ell} | 🪵 {req.cost_wood} | 🪨{' '}
                    {req.cost_stone} | ⛏️ {req.cost_iron}
                  </div>
                  {req.required_items && req.required_items.length > 0 && (
                    <div className="text-sm">
                      Предметы:{' '}
                      {req.required_items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(req)} size="sm" variant="outline">
                    Редактировать
                  </Button>
                  <Button
                    onClick={() => handleDelete(req.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
