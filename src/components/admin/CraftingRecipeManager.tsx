import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { useItemTemplates } from '@/hooks/useItemTemplates';
import { useCraftingRecipes } from '@/hooks/useCraftingRecipes';
import { useAdmin } from '@/contexts/AdminContext';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const CraftingRecipeManager = () => {
  const { toast } = useToast();
  const { templates } = useItemTemplates();
  const { recipes, loading: loadingRecipes, reload } = useCraftingRecipes();
  const { isAdmin } = useAdmin();
  const { accountId } = useWalletContext();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Поиск по предметам
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");

  // Фильтруем только материалы для требований
  const materials = Array.from(templates.values()).filter(t => t.type === 'material');
  // Все предметы для результата
  const allItems = Array.from(templates.values());

  // Фильтруем предметы по поисковому запросу
  const filteredAllItems = allItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );
  const filteredMaterials = materials.filter(mat =>
    mat.name.toLowerCase().includes(materialSearchTerm.toLowerCase())
  );

  const BUILDING_TYPES = [
    { id: 'sawmill', name: 'Лесопилка' },
    { id: 'quarry', name: 'Каменоломня' },
    { id: 'storage', name: 'Склад' },
    { id: 'main_hall', name: 'Главный зал' },
    { id: 'barracks', name: 'Казармы' },
    { id: 'workshop', name: 'Мастерская' },
    { id: 'medical', name: 'Медицинский пункт' },
    { id: 'dragon_lair', name: 'Драконье логово' },
    { id: 'forge', name: 'Кузница' },
    { id: 'clan_hall', name: 'Клановый зал' },
  ];

  const [formData, setFormData] = useState({
    recipe_name: '',
    result_item_id: 0,
    result_quantity: 1,
    required_materials: [] as Array<{ item_id: string; quantity: number }>,
    category: 'general',
    description: '',
    crafting_time_hours: 1,
    required_building_id: '' as string,
    required_building_level: 0
  });

  const handleSave = async () => {
    if (!formData.recipe_name || !formData.result_item_id) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и результат рецепта',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const walletAddress = accountId;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      if (editingId) {
        // Update existing recipe using RPC
        const { error } = await supabase.rpc('admin_update_crafting_recipe', {
          p_wallet_address: walletAddress,
          p_recipe_id: editingId,
          p_recipe_name: formData.recipe_name,
          p_result_item_id: formData.result_item_id,
          p_result_quantity: formData.result_quantity,
          p_required_materials: formData.required_materials as any,
          p_category: formData.category,
          p_description: formData.description,
          p_crafting_time_hours: formData.crafting_time_hours,
          p_required_building_id: formData.required_building_id || null,
          p_required_building_level: formData.required_building_level
        });

        if (error) throw error;
      } else {
        // Check if recipe_name already exists to determine if it's an update
        const { data: existingRecipe } = await supabase
          .from("crafting_recipes")
          .select("id")
          .eq("recipe_name", formData.recipe_name)
          .maybeSingle();

        const isUpdate = !!existingRecipe;

        // Create new recipe using RPC (with ON CONFLICT DO UPDATE)
        const { error } = await supabase.rpc('admin_insert_crafting_recipe', {
          p_recipe_name: formData.recipe_name,
          p_result_item_id: formData.result_item_id,
          p_result_quantity: formData.result_quantity,
          p_required_materials: formData.required_materials as any,
          p_category: formData.category,
          p_description: formData.description,
          p_crafting_time_hours: formData.crafting_time_hours,
          p_required_building_id: formData.required_building_id || null,
          p_required_building_level: formData.required_building_level
        });

        if (error) throw error;

        toast({
          title: isUpdate ? 'Рецепт обновлен' : 'Рецепт создан',
          description: 'Изменения успешно сохранены'
        });
        resetForm();
        reload();
        return;
      }

      toast({
        title: 'Рецепт обновлен',
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

  const handleEdit = (recipe: any) => {
    setEditingId(recipe.id);
    setFormData({
      recipe_name: recipe.recipe_name,
      result_item_id: recipe.result_item_id,
      result_quantity: recipe.result_quantity,
      required_materials: recipe.required_materials || [],
      category: recipe.category || 'general',
      description: recipe.description || '',
      crafting_time_hours: recipe.crafting_time_hours || 1,
      required_building_id: recipe.required_building_id || '',
      required_building_level: recipe.required_building_level || 0
    });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: 'Нет доступа',
        description: 'Только администраторы могут удалять рецепты',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm('Вы уверены что хотите удалить этот рецепт?')) return;

    try {
      const walletAddress = accountId;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const { error } = await supabase.rpc('admin_delete_crafting_recipe', {
        p_id: id,
        p_wallet: walletAddress
      });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({
        title: 'Рецепт удален',
        description: 'Запись успешно удалена'
      });
      reload();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: 'Ошибка удаления',
        description: error.message || 'Не удалось удалить рецепт',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      recipe_name: '',
      result_item_id: 0,
      result_quantity: 1,
      required_materials: [],
      category: 'general',
      description: '',
      crafting_time_hours: 1,
      required_building_id: '',
      required_building_level: 0
    });
  };

  const addMaterial = () => {
    if (materials.length === 0) return;
    const firstMaterial = materials[0];
    setFormData({
      ...formData,
      required_materials: [
        ...formData.required_materials,
        { item_id: firstMaterial.item_id, quantity: 1 }
      ]
    });
  };

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      required_materials: formData.required_materials.filter((_, i) => i !== index)
    });
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const updated = [...formData.required_materials];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, required_materials: updated });
  };

  if (loadingRecipes) {
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
          <CardTitle>Рецепты крафта</CardTitle>
          <CardDescription>
            Управление рецептами для мастерской
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Название рецепта</Label>
              <Input
                value={formData.recipe_name}
                onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
                placeholder="Например: Магический меч"
              />
            </div>

            <div>
              <Label>Категория</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Общее</SelectItem>
                  <SelectItem value="weapon">Оружие</SelectItem>
                  <SelectItem value="armor">Броня</SelectItem>
                  <SelectItem value="material">Материалы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Описание</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание рецепта"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Результат крафта</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {formData.result_item_id === 0
                      ? "Выберите предмет"
                      : allItems.find(i => i.id === formData.result_item_id)?.name || "Выберите предмет"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-2">
                    <Input
                      placeholder="Поиск предмета..."
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-9 mb-2"
                    />
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1">
                      {filteredAllItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => {
                            setFormData({ ...formData, result_item_id: item.id });
                            setItemSearchTerm("");
                          }}
                        >
                          {item.name} ({item.type})
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Количество результата</Label>
              <Input
                type="number"
                value={formData.result_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, result_quantity: parseInt(e.target.value) || 1 })
                }
                min={1}
              />
            </div>

            <div>
              <Label>Время крафта (часов)</Label>
              <Input
                type="number"
                value={formData.crafting_time_hours}
                onChange={(e) =>
                  setFormData({ ...formData, crafting_time_hours: parseInt(e.target.value) || 1 })
                }
                min={1}
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Требуемое здание (опционально)</Label>
              <Select
                value={formData.required_building_id || 'none'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  required_building_id: value === 'none' ? '' : value,
                  required_building_level: value === 'none' ? 0 : formData.required_building_level || 1
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите здание" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не требуется</SelectItem>
                  {BUILDING_TYPES.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Мин. уровень здания</Label>
              <Input
                type="number"
                value={formData.required_building_level}
                onChange={(e) =>
                  setFormData({ ...formData, required_building_level: parseInt(e.target.value) || 0 })
                }
                min={0}
                max={10}
                disabled={!formData.required_building_id}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Требуемые материалы</Label>
              <Button onClick={addMaterial} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Добавить материал
              </Button>
            </div>

            {formData.required_materials.map((material, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      {materials.find(m => m.item_id === material.item_id)?.name || "Выберите материал"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-2">
                      <Input
                        placeholder="Поиск материала..."
                        value={materialSearchTerm}
                        onChange={(e) => setMaterialSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="h-9 mb-2"
                      />
                      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1">
                        {filteredMaterials.map((mat) => (
                          <div
                            key={mat.item_id}
                            className="p-2 hover:bg-accent rounded-md cursor-pointer"
                            onClick={() => {
                              updateMaterial(index, 'item_id', mat.item_id);
                              setMaterialSearchTerm("");
                            }}
                          >
                            {mat.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  type="number"
                  value={material.quantity}
                  onChange={(e) =>
                    updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)
                  }
                  min={1}
                  className="w-24"
                  placeholder="Кол-во"
                />

                <Button
                  onClick={() => removeMaterial(index)}
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
          <CardTitle>Существующие рецепты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipes.map((recipe) => {
              const resultItem = allItems.find(i => i.id === recipe.result_item_id);
              return (
                <div
                  key={recipe.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{recipe.recipe_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Результат: {resultItem?.name} x{recipe.result_quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Время крафта: {recipe.crafting_time_hours || 1} ч
                    </div>
                    {recipe.required_building_id && (
                      <div className="text-sm text-muted-foreground">
                        🏛️ Требуется: {BUILDING_TYPES.find(b => b.id === recipe.required_building_id)?.name || recipe.required_building_id} ур. {recipe.required_building_level || 1}
                      </div>
                    )}
                    {recipe.required_materials && recipe.required_materials.length > 0 && (
                      <div className="text-sm">
                        Материалы:{' '}
                        {recipe.required_materials
                          .map((mat) => {
                            const matItem = materials.find(m => m.item_id === mat.item_id);
                            return `${matItem?.name || mat.item_id} x${mat.quantity}`;
                          })
                          .join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleEdit(recipe)} 
                      size="sm" 
                      variant="outline"
                      disabled={!isAdmin}
                    >
                      Редактировать
                    </Button>
                    <Button
                      onClick={() => handleDelete(recipe.id)}
                      size="sm"
                      variant="destructive"
                      disabled={!isAdmin}
                      title={!isAdmin ? 'Только администраторы могут удалять рецепты' : ''}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
