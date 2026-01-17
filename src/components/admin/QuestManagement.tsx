import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Plus, Upload, X } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletConnectContext";

interface Quest {
  id: string;
  title: string;
  description: string;
  link_url: string;
  image_url: string | null;
  reward_coins: number;
  is_active: boolean;
  display_order: number;
}

export const QuestManagement = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link_url: "",
    reward_coins: 100,
    display_order: 0,
  });

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setQuests(data || []);
    } catch (error) {
      console.error("Error loading quests:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задания",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("quest-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("quest-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrl = editingQuest?.image_url || null;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const { data, error } = await supabase.rpc('admin_upsert_quest', {
        p_admin_wallet_address: accountId || '',
        p_id: editingQuest?.id || null,
        p_title: formData.title,
        p_description: formData.description,
        p_link_url: formData.link_url,
        p_image_url: imageUrl,
        p_reward_coins: formData.reward_coins,
        p_is_active: true,
        p_display_order: formData.display_order,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: editingQuest ? "Задание обновлено" : "Задание создано",
      });

      resetForm();
      loadQuests();
    } catch (error) {
      console.error("Error saving quest:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить задание",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description,
      link_url: quest.link_url,
      reward_coins: quest.reward_coins,
      display_order: quest.display_order,
    });
    setImagePreview(quest.image_url);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это задание?")) return;

    try {
      const { error } = await supabase.rpc('admin_delete_quest', {
        p_admin_wallet_address: accountId || '',
        p_id: id,
      });

      if (error) throw error;
      toast({
        title: "Успешно",
        description: "Задание удалено",
      });
      loadQuests();
    } catch (error) {
      console.error("Error deleting quest:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить задание",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (quest: Quest) => {
    try {
      const { error } = await supabase
        .from("quests")
        .update({ is_active: !quest.is_active })
        .eq("id", quest.id);

      if (error) throw error;
      toast({
        title: "Успешно",
        description: `Задание ${!quest.is_active ? "активировано" : "деактивировано"}`,
      });
      loadQuests();
    } catch (error) {
      console.error("Error toggling quest:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус задания",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      link_url: "",
      reward_coins: 100,
      display_order: 0,
    });
    setEditingQuest(null);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center p-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-game-accent">Управление заданиями</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-game-accent hover:bg-game-accent/90"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Отмена" : "Добавить задание"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-game-surface border-game-accent">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Название задания</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-game-background border-game-accent text-game-primary"
              />
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="bg-game-background border-game-accent text-game-primary"
              />
            </div>

            <div>
              <Label htmlFor="link_url">Ссылка на задание</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                required
                placeholder="https://t.me/channel"
                className="bg-game-background border-game-accent text-game-primary"
              />
            </div>

            <div>
              <Label htmlFor="reward_coins">Награда (ELL)</Label>
              <Input
                id="reward_coins"
                type="number"
                min="0"
                value={formData.reward_coins}
                onChange={(e) => setFormData({ ...formData, reward_coins: parseInt(e.target.value) })}
                required
                className="bg-game-background border-game-accent text-game-primary"
              />
            </div>

            <div>
              <Label htmlFor="display_order">Порядок отображения</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="bg-game-background border-game-accent text-game-primary"
              />
            </div>

            <div>
              <Label htmlFor="image">Изображение</Label>
              <div className="mt-2 space-y-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-game-background border-game-accent text-game-primary"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded border border-game-accent"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-game-accent hover:bg-game-accent/90"
              >
                {editingQuest ? "Обновить" : "Создать"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-game-accent text-game-accent"
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {quests.map((quest) => (
          <Card key={quest.id} className="p-4 bg-game-surface border-game-accent">
            <div className="flex items-start gap-4">
              {quest.image_url && (
                <img
                  src={quest.image_url}
                  alt={quest.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-game-primary">{quest.title}</h3>
                <p className="text-sm text-gray-400">{quest.description}</p>
                <p className="text-sm text-blue-400 mt-1">{quest.link_url}</p>
                <p className="text-sm text-game-accent mt-1">Награда: {quest.reward_coins} ELL</p>
                <p className="text-xs text-gray-500">Порядок: {quest.display_order}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={quest.is_active ? "default" : "outline"}
                  onClick={() => toggleActive(quest)}
                  className={quest.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {quest.is_active ? "Активно" : "Неактивно"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(quest)}
                  className="border-game-accent text-game-accent"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(quest.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
