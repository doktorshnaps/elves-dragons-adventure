import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveMonsterImage } from "@/utils/monsterImageResolver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Loader2, Plus, Trash2, Save, Edit2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Monster {
  id: string;
  monster_id: string;
  monster_name: string;
  monster_type: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MonsterForm {
  monster_id: string;
  monster_name: string;
  monster_type: string;
  description: string;
  image_url: string;
}

export const MonsterManagement = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [monsterForm, setMonsterForm] = useState<MonsterForm>({
    monster_id: "",
    monster_name: "",
    monster_type: "normal",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    loadMonsters();
  }, []);

  const loadMonsters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("monsters")
        .select("*")
        .order("monster_type", { ascending: true })
        .order("monster_name", { ascending: true });

      if (error) throw error;
      setMonsters(data || []);
    } catch (error: any) {
      console.error("Error loading monsters:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
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
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('filePath', filePath);
      formData.append('walletAddress', accountId);

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const functionsUrl = "https://oimhwdymghkwxznjarkv.functions.supabase.co/upload-monster-image";
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
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить изображение",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Выберите файл изображения",
          variant: "destructive",
        });
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

  const handleSaveMonster = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive",
      });
      return;
    }

    if (!monsterForm.monster_id || !monsterForm.monster_name) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Upload image if selected
      let imageUrl = monsterForm.image_url;
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSaving(false);
          return;
        }
      }

      if (editingMonster) {
        // Update existing monster
        const { error } = await supabase
          .from("monsters")
          .update({
            monster_id: monsterForm.monster_id,
            monster_name: monsterForm.monster_name,
            monster_type: monsterForm.monster_type,
            description: monsterForm.description || null,
            image_url: imageUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMonster.id);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Монстр обновлен",
        });
      } else {
        // Insert new monster
        const { error } = await supabase
          .from("monsters")
          .insert({
            monster_id: monsterForm.monster_id,
            monster_name: monsterForm.monster_name,
            monster_type: monsterForm.monster_type,
            description: monsterForm.description || null,
            image_url: imageUrl || null,
            created_by_wallet_address: accountId,
          });

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Монстр добавлен",
        });
      }

      // Reset form and close dialog
      setMonsterForm({
        monster_id: "",
        monster_name: "",
        monster_type: "normal",
        description: "",
        image_url: "",
      });
      setEditingMonster(null);
      setSelectedImage(null);
      setImagePreview("");
      setIsDialogOpen(false);
      loadMonsters();
    } catch (error: any) {
      console.error("Error saving monster:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditMonster = (monster: Monster) => {
    setEditingMonster(monster);
    setMonsterForm({
      monster_id: monster.monster_id,
      monster_name: monster.monster_name,
      monster_type: monster.monster_type,
      description: monster.description || "",
      image_url: monster.image_url || "",
    });
    setSelectedImage(null);
    setImagePreview(monster.image_url || "");
    setIsDialogOpen(true);
  };

  const handleDeleteMonster = async (monsterId: string) => {
    if (!accountId) return;

    if (!confirm("Вы уверены, что хотите удалить этого монстра?")) return;

    try {
      const { error } = await supabase
        .from("monsters")
        .delete()
        .eq("id", monsterId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Монстр удален",
      });

      loadMonsters();
    } catch (error: any) {
      console.error("Error deleting monster:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (monsterId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("monsters")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", monsterId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Монстр ${isActive ? "активирован" : "деактивирован"}`,
      });

      loadMonsters();
    } catch (error: any) {
      console.error("Error toggling monster:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getMonsterTypeLabel = (type: string) => {
    switch (type) {
      case "normal": return "Обычный";
      case "miniboss": return "Минибосс";
      case "boss": return "Босс";
      default: return type;
    }
  };

  const getMonsterTypeBadgeColor = (type: string) => {
    switch (type) {
      case "normal": return "bg-blue-500/20 text-blue-500";
      case "miniboss": return "bg-purple-500/20 text-purple-500";
      case "boss": return "bg-red-500/20 text-red-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление монстрами</h2>
          <p className="text-muted-foreground">
            Добавляйте и редактируйте монстров для подземелий
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMonster(null);
              setMonsterForm({
                monster_id: "",
                monster_name: "",
                monster_type: "normal",
                description: "",
                image_url: "",
              });
              setSelectedImage(null);
              setImagePreview("");
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить монстра
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMonster ? "Редактировать монстра" : "Добавить монстра"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID монстра *</Label>
                  <Input
                    placeholder="spider_skeleton"
                    value={monsterForm.monster_id}
                    onChange={(e) =>
                      setMonsterForm({ ...monsterForm, monster_id: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Уникальный идентификатор (латиница, подчеркивания)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Название монстра *</Label>
                  <Input
                    placeholder="Паучок-скелет"
                    value={monsterForm.monster_name}
                    onChange={(e) =>
                      setMonsterForm({ ...monsterForm, monster_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Тип монстра</Label>
                <Select
                  value={monsterForm.monster_type}
                  onValueChange={(value) =>
                    setMonsterForm({ ...monsterForm, monster_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="miniboss">Минибосс</SelectItem>
                    <SelectItem value="boss">Босс</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  placeholder="Описание монстра..."
                  value={monsterForm.description}
                  onChange={(e) =>
                    setMonsterForm({ ...monsterForm, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Загрузить изображение</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Максимальный размер файла: 5MB. Форматы: JPG, PNG, WEBP
                </p>
              </div>

              <div className="space-y-2">
                <Label>Или введите URL изображения</Label>
                <Input
                  placeholder="https://example.com/monster.png"
                  value={monsterForm.image_url}
                  onChange={(e) =>
                    setMonsterForm({ ...monsterForm, image_url: e.target.value })
                  }
                />
              </div>

              {(imagePreview || monsterForm.image_url || editingMonster) && (
                <div className="space-y-2">
                  <Label>Предпросмотр</Label>
                  <div className="border rounded-lg p-4 bg-accent/20">
                    <img
                      src={imagePreview || monsterForm.image_url || (editingMonster ? resolveMonsterImage(editingMonster) : '/placeholder.svg')}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingMonster(null);
                  }}
                >
                  Отмена
                </Button>
                <Button onClick={handleSaveMonster} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingMonster ? "Сохранить" : "Добавить"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monsters.map((monster) => (
          <Card key={monster.id} className={!monster.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{monster.monster_name}</CardTitle>
                  <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getMonsterTypeBadgeColor(monster.monster_type)}`}>
                    {getMonsterTypeLabel(monster.monster_type)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={monster.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleActive(monster.id, checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full h-32 rounded-lg overflow-hidden bg-accent/20">
                <img
                  src={resolveMonsterImage(monster)}
                  alt={monster.monster_name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">ID:</span> {monster.monster_id}
                </p>
                {monster.description && (
                  <p className="text-muted-foreground line-clamp-2">
                    {monster.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditMonster(monster)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Изменить
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteMonster(monster.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {monsters.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Нет добавленных монстров</p>
            <p className="text-sm text-muted-foreground mt-1">
              Нажмите "Добавить монстра" чтобы начать
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
