import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { itemTemplateSchema, formatValidationErrors } from "@/utils/validationSchemas";
import { z } from "zod";

interface ItemTemplate {
  id: number;
  item_id: string;
  name: string;
  type: string;
  rarity: string;
  description: string | null;
  source_type: string;
  image_url: string | null;
  slot: string | null;
  value: number;
  sell_price: number;
  level_requirement: number;
  drop_chance: number | null;
  stats: any;
  source_details: any;
}

const ITEM_TYPES = [
  "material",
  "worker",
  "weapon",
  "armor",
  "accessory",
  "consumable",
  "cardPack",
  "healthPotion",
  "woodChunks",
  "magicalRoots",
  "rockStones",
  "blackCrystals",
  "illusionManuscript",
  "darkMonocle",
  "etherVine",
  "dwarvenTongs",
  "healingOil",
  "shimmeringCrystal",
  "lifeCrystal",
];

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "divine"];
const SOURCE_TYPES = ["dungeon", "shop", "quest", "craft", "event", "monster_drop", "boss_drop", "crafting", "quest_reward"];
const SLOTS = ["head", "chest", "hands", "legs", "feet", "neck", "ring", "weapon", "offhand"];

export const ItemTemplateManager = () => {
  const { accountId } = useWalletContext();
  const [items, setItems] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    item_id: "",
    name: "",
    type: "",
    rarity: "",
    description: "",
    source_type: "",
    image_url: "",
    slot: "",
    value: 0,
    sell_price: 0,
    level_requirement: 1,
    drop_chance: 0,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("item_templates")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
      toast({ title: "Ошибка", description: "Ошибка при загрузке предметов", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      if (!accountId) {
        throw new Error('Wallet not connected');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || undefined;

      const formData = new FormData();
      formData.append('image', file);
      formData.append('filePath', filePath);
      formData.append('walletAddress', accountId);

      const functionsUrl = "https://oimhwdymghkwxznjarkv.functions.supabase.co/upload-item-image";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch(functionsUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || 'Upload failed');
      }

      const json = await resp.json();
      const { url } = json;
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit triggered, formData:', formData);
    console.log('Editing item:', editingItem);
    
    // Validate form data with zod schema
    try {
      const validatedData = itemTemplateSchema.parse(formData);
      console.log('✅ Validation passed:', validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = formatValidationErrors(error);
        console.error('❌ Validation failed:', errorMessage);
        toast({ 
          title: "Ошибка валидации", 
          description: errorMessage, 
          variant: "destructive" 
        });
        return;
      }
      throw error;
    }
    
    console.log('Validation passed, proceeding...');

    try {
      setLoading(true);

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (selectedImage) {
        console.log('Uploading image...');
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('Image uploaded:', imageUrl);
        } else {
          toast({ title: "Ошибка", description: "Не удалось загрузить изображение", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      if (editingItem) {
        // Update existing item using security definer function
        console.log('Updating item with value:', formData.value);
        
        const { data, error } = await supabase.rpc('admin_update_item_template', {
          p_wallet_address: accountId,
          p_id: editingItem.id,
          p_item_id: formData.item_id,
          p_name: formData.name,
          p_type: formData.type,
          p_rarity: formData.rarity,
          p_description: formData.description || null,
          p_source_type: formData.source_type,
          p_image_url: imageUrl || null,
          p_slot: formData.slot === "none" ? null : formData.slot,
          p_value: formData.value,
          p_sell_price: formData.sell_price,
          p_level_requirement: formData.level_requirement,
          p_drop_chance: formData.drop_chance || null,
        });

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Item updated successfully, new data:', data);
        toast({ title: "Успех", description: "Предмет успешно обновлен" });
      } else {
        // Insert new item using security definer function
        console.log('Inserting item with value:', formData.value);
        
        const { data, error } = await supabase.rpc('admin_insert_item_template', {
          p_wallet_address: accountId,
          p_item_id: formData.item_id,
          p_name: formData.name,
          p_type: formData.type,
          p_rarity: formData.rarity,
          p_description: formData.description || null,
          p_source_type: formData.source_type,
          p_image_url: imageUrl || null,
          p_slot: formData.slot === "none" ? null : formData.slot,
          p_value: formData.value,
          p_sell_price: formData.sell_price,
          p_level_requirement: formData.level_requirement,
          p_drop_chance: formData.drop_chance || null,
        });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Item inserted successfully, new data:', data);
        toast({ title: "Успех", description: "Предмет успешно добавлен" });
      }

      resetForm();
      setIsDialogOpen(false);
      await loadItems();
    } catch (error: any) {
      console.error("Error saving item:", error);
      const isDuplicate = error?.code === '23505' && error?.message?.includes('item_id');
      toast({ 
        title: "Ошибка", 
        description: isDuplicate 
          ? `Предмет с ID "${formData.item_id}" уже существует. Используйте другой ID.`
          : error?.message || "Ошибка при сохранении предмета", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ItemTemplate) => {
    console.log('Editing item:', item);
    setEditingItem(item);
    setFormData({
      item_id: item.item_id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      description: item.description || "",
      source_type: item.source_type,
      image_url: item.image_url || "",
      slot: item.slot || "none",
      value: item.value,
      sell_price: item.sell_price || 0,
      level_requirement: item.level_requirement,
      drop_chance: item.drop_chance || 0,
    });
    setSelectedImage(null);
    setImagePreview(item.image_url || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот предмет?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("item_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Успех", description: "Предмет успешно удален" });
      loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ title: "Ошибка", description: "Ошибка при удалении предмета", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      item_id: "",
      name: "",
      type: "",
      rarity: "",
      description: "",
      source_type: "",
      image_url: "",
      slot: "none",
      value: 0,
      sell_price: 0,
      level_requirement: 1,
      drop_chance: 0,
    });
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Ошибка", description: "Размер файла не должен превышать 5MB", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Ошибка", description: "Выберите файл изображения", variant: "destructive" });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <Card className="p-6 bg-black/50 border-2 border-white backdrop-blur-sm" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Управление предметами</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="menu" className="gap-2" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              Добавить предмет
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-game-dark border-2 border-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingItem ? "Редактировать предмет" : "Добавить новый предмет"}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Заполните все поля для {editingItem ? "обновления" : "создания"} предмета
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_id" className="text-white">ID предмета *</Label>
                  <Input
                    id="item_id"
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                    placeholder="unique_item_id"
                    required
                    className="bg-black/50 border-white text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Название предмета"
                    required
                    className="bg-black/50 border-white text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-white">Тип *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="bg-black/50 border-white text-white">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rarity" className="text-white">Редкость *</Label>
                  <Select value={formData.rarity} onValueChange={(value) => setFormData({ ...formData, rarity: value })}>
                    <SelectTrigger className="bg-black/50 border-white text-white">
                      <SelectValue placeholder="Выберите редкость" />
                    </SelectTrigger>
                    <SelectContent>
                      {RARITIES.map((rarity) => (
                        <SelectItem key={rarity} value={rarity}>
                          {rarity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_type" className="text-white">Источник *</Label>
                  <Select value={formData.source_type} onValueChange={(value) => setFormData({ ...formData, source_type: value })}>
                    <SelectTrigger className="bg-black/50 border-white text-white">
                      <SelectValue placeholder="Выберите источник" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot" className="text-white">Слот</Label>
                  <Select value={formData.slot} onValueChange={(value) => setFormData({ ...formData, slot: value })}>
                    <SelectTrigger className="bg-black/50 border-white text-white">
                      <SelectValue placeholder="Выберите слот" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Нет</SelectItem>
                      {SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value" className="text-white">Цена покупки</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                    className="bg-black/50 border-white text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell_price" className="text-white">Цена продажи</Label>
                  <Input
                    id="sell_price"
                    type="number"
                    value={formData.sell_price}
                    onChange={(e) => setFormData({ ...formData, sell_price: parseInt(e.target.value) || 0 })}
                    className="bg-black/50 border-white text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level_requirement" className="text-white">Требуемый уровень</Label>
                  <Input
                    id="level_requirement"
                    type="number"
                    value={formData.level_requirement}
                    onChange={(e) => setFormData({ ...formData, level_requirement: parseInt(e.target.value) || 1 })}
                    className="bg-black/50 border-white text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drop_chance" className="text-white">Шанс дропа (%)</Label>
                  <Input
                    id="drop_chance"
                    type="number"
                    step="0.01"
                    value={formData.drop_chance}
                    onChange={(e) => setFormData({ ...formData, drop_chance: parseFloat(e.target.value) || 0 })}
                    className="bg-black/50 border-white text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_file" className="text-white">Изображение предмета</Label>
                <Input
                  id="image_file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-black/50 border-white text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded border-2 border-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание предмета"
                  rows={3}
                  className="bg-black/50 border-white text-white"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Отмена
                </Button>
                <Button type="submit" variant="menu" disabled={loading}>
                  {loading ? "Сохранение..." : editingItem ? "Обновить" : "Добавить"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/70 border-white hover:bg-black/70">
              <TableHead className="text-white">ID</TableHead>
              <TableHead className="text-white">Изображение</TableHead>
              <TableHead className="text-white">Название</TableHead>
              <TableHead className="text-white">Тип</TableHead>
              <TableHead className="text-white">Редкость</TableHead>
              <TableHead className="text-white">Источник</TableHead>
              <TableHead className="text-white">Цена покупки</TableHead>
              <TableHead className="text-white">Цена продажи</TableHead>
              <TableHead className="text-white text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-white/70">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-white/70">
                  Нет предметов
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-white/30 hover:bg-white/10">
                  <TableCell className="text-white/90">{item.item_id}</TableCell>
                  <TableCell>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white/50 text-xs">
                        Нет
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-white">{item.name}</TableCell>
                  <TableCell className="text-white/90">{item.type}</TableCell>
                  <TableCell className="text-white/90">{item.rarity}</TableCell>
                  <TableCell className="text-white/90">{item.source_type}</TableCell>
                  <TableCell className="text-white/90">{item.value}</TableCell>
                  <TableCell className="text-white/90">{item.sell_price || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Изменить
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
