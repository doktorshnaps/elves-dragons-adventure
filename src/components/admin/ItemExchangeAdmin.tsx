import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Plus, X, Save, Settings } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Switch } from "@/components/ui/switch";

interface ItemTemplate {
  id: number;
  name: string;
  rarity: string;
  type: string;
  image_url: string | null;
}

interface ExchangeTemplate {
  id: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  icon: string;
  required_items: { template_id: number; quantity: number }[];
  reward_items: { template_id: number; quantity: number }[];
  reward_ell: number;
  weight: number;
  min_level: number;
  is_active: boolean;
}

interface ExchangeSettings {
  id: string;
  min_quests_per_day: number;
  max_quests_per_day: number;
}

const defaultForm = {
  title_ru: "",
  title_en: "",
  description_ru: "",
  description_en: "",
  icon: "📦",
  required_items: [{ template_id: 0, quantity: 1 }] as { template_id: number; quantity: number }[],
  reward_items: [{ template_id: 0, quantity: 1 }] as { template_id: number; quantity: number }[],
  reward_ell: 0,
  weight: 5,
  min_level: 1,
  is_active: true,
};

export const ItemExchangeAdmin = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const [templates, setTemplates] = useState<ExchangeTemplate[]>([]);
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([]);
  const [settings, setSettings] = useState<ExchangeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [settingsForm, setSettingsForm] = useState({ min: 3, max: 5 });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    if (!accountId) return;
    setLoading(true);
    const [tRes, iRes, sRes] = await Promise.all([
      supabase.rpc("admin_get_item_exchange_templates", { p_admin_wallet_address: accountId }),
      supabase.from("item_templates").select("id, name, rarity, type, image_url").order("id"),
      supabase.rpc("admin_get_item_exchange_settings", { p_admin_wallet_address: accountId }),
    ]);

    if (tRes.data) setTemplates(tRes.data as unknown as ExchangeTemplate[]);
    if (iRes.data) setItemTemplates(iRes.data as ItemTemplate[]);
    if (sRes.data) {
      const rows = sRes.data as unknown as ExchangeSettings[];
      if (Array.isArray(rows) && rows.length > 0) {
        setSettings(rows[0]);
        setSettingsForm({ min: rows[0].min_quests_per_day, max: rows[0].max_quests_per_day });
      }
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!accountId) return;
    const { error } = await supabase.rpc("admin_update_item_exchange_settings", {
      p_admin_wallet_address: accountId,
      p_min_quests_per_day: settingsForm.min,
      p_max_quests_per_day: settingsForm.max,
    });

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Настройки сохранены" });
      loadAll();
    }
  };

  const openEdit = (t: ExchangeTemplate) => {
    setEditingId(t.id);
    setForm({
      title_ru: t.title_ru,
      title_en: t.title_en,
      description_ru: t.description_ru,
      description_en: t.description_en,
      icon: t.icon,
      required_items: t.required_items.length ? t.required_items : [{ template_id: 0, quantity: 1 }],
      reward_items: t.reward_items.length ? t.reward_items : [{ template_id: 0, quantity: 1 }],
      reward_ell: t.reward_ell,
      weight: t.weight,
      min_level: t.min_level,
      is_active: t.is_active,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...defaultForm, required_items: [{ template_id: 0, quantity: 1 }], reward_items: [{ template_id: 0, quantity: 1 }] });
    setShowForm(true);
  };

  const saveTemplate = async () => {
    const payload = {
      title_ru: form.title_ru,
      title_en: form.title_en,
      description_ru: form.description_ru,
      description_en: form.description_en,
      icon: form.icon,
      required_items: form.required_items.filter(i => i.template_id > 0),
      reward_items: form.reward_items.filter(i => i.template_id > 0),
      reward_ell: form.reward_ell,
      weight: form.weight,
      min_level: form.min_level,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("item_exchange_templates").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("item_exchange_templates").insert(payload));
    }

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Шаблон обновлён" : "Шаблон создан" });
      setShowForm(false);
      loadAll();
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    const { error } = await supabase.from("item_exchange_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Шаблон удалён" });
      loadAll();
    }
  };

  const getItemName = (templateId: number) => {
    const item = itemTemplates.find(i => i.id === templateId);
    return item ? `${item.name} (${item.rarity})` : `ID: ${templateId}`;
  };

  const updateListItem = (
    listKey: "required_items" | "reward_items",
    index: number,
    field: "template_id" | "quantity",
    value: number
  ) => {
    setForm(prev => {
      const list = [...prev[listKey]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [listKey]: list };
    });
  };

  const addListItem = (listKey: "required_items" | "reward_items") => {
    setForm(prev => ({
      ...prev,
      [listKey]: [...prev[listKey], { template_id: 0, quantity: 1 }],
    }));
  };

  const removeListItem = (listKey: "required_items" | "reward_items", index: number) => {
    setForm(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== index),
    }));
  };

  if (loading) return <p className="text-white">Загрузка...</p>;

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <Card className="p-6 bg-black/50 border-2 border-white backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-white" />
          <h3 className="text-lg font-bold text-white">Настройки системы обмена</h3>
        </div>
        <div className="flex gap-4 items-end">
          <div>
            <Label className="text-white">Мин. заданий/день</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={settingsForm.min}
              onChange={e => setSettingsForm(s => ({ ...s, min: Number(e.target.value) }))}
              className="w-24 bg-black/30 text-white border-white/30"
            />
          </div>
          <div>
            <Label className="text-white">Макс. заданий/день</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={settingsForm.max}
              onChange={e => setSettingsForm(s => ({ ...s, max: Number(e.target.value) }))}
              className="w-24 bg-black/30 text-white border-white/30"
            />
          </div>
          <Button onClick={saveSettings} className="gap-1">
            <Save className="w-4 h-4" /> Сохранить
          </Button>
        </div>
      </Card>

      {/* Templates List */}
      <Card className="p-6 bg-black/50 border-2 border-white backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Шаблоны заданий ({templates.length})</h3>
          <Button onClick={openNew} className="gap-1">
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>

        <div className="space-y-3">
          {templates.map(t => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border ${t.is_active ? 'border-white/30 bg-white/5' : 'border-red-500/30 bg-red-500/5'} flex justify-between items-start`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-semibold text-white">{t.title_ru}</span>
                  <span className="text-white/50 text-sm">/ {t.title_en}</span>
                  {!t.is_active && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Неактивно</span>}
                </div>
                <p className="text-sm text-white/60 mt-1">{t.description_ru}</p>
                <div className="flex gap-4 mt-2 text-xs text-white/50">
                  <span>Требуется: {t.required_items.map(i => `${getItemName(i.template_id)} x${i.quantity}`).join(", ")}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-white/50">
                  <span>Награда: {t.reward_items.map(i => `${getItemName(i.template_id)} x${i.quantity}`).join(", ")}{t.reward_ell > 0 ? ` + ${t.reward_ell} ELL` : ""}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-white/40">
                  <span>Вес: {t.weight}</span>
                  <span>Мин. уровень: {t.min_level}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="border-white/30 text-white hover:bg-white/10">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteTemplate(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <p className="text-white/50 text-center py-4">Нет шаблонов</p>}
        </div>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-black/50 border-2 border-yellow-400/50 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">{editingId ? "Редактировать шаблон" : "Новый шаблон"}</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}><X className="w-4 h-4 text-white" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Название (RU)</Label>
              <Input value={form.title_ru} onChange={e => setForm(f => ({ ...f, title_ru: e.target.value }))} className="bg-black/30 text-white border-white/30" />
            </div>
            <div>
              <Label className="text-white">Название (EN)</Label>
              <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} className="bg-black/30 text-white border-white/30" />
            </div>
            <div>
              <Label className="text-white">Описание (RU)</Label>
              <Input value={form.description_ru} onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))} className="bg-black/30 text-white border-white/30" />
            </div>
            <div>
              <Label className="text-white">Описание (EN)</Label>
              <Input value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} className="bg-black/30 text-white border-white/30" />
            </div>
            <div>
              <Label className="text-white">Иконка (emoji)</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="bg-black/30 text-white border-white/30 w-24" />
            </div>
            <div className="flex gap-4">
              <div>
                <Label className="text-white">Вес (1-10)</Label>
                <Input type="number" min={1} max={10} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} className="bg-black/30 text-white border-white/30 w-24" />
              </div>
              <div>
                <Label className="text-white">Мин. уровень</Label>
                <Input type="number" min={1} value={form.min_level} onChange={e => setForm(f => ({ ...f, min_level: Number(e.target.value) }))} className="bg-black/30 text-white border-white/30 w-24" />
              </div>
              <div>
                <Label className="text-white">Доп. ELL</Label>
                <Input type="number" min={0} value={form.reward_ell} onChange={e => setForm(f => ({ ...f, reward_ell: Number(e.target.value) }))} className="bg-black/30 text-white border-white/30 w-24" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label className="text-white">Активен</Label>
          </div>

          {/* Required Items */}
          <div className="mt-4">
            <Label className="text-white font-semibold">Требуемые предметы</Label>
            {form.required_items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center mt-2">
                <select
                  value={item.template_id}
                  onChange={e => updateListItem("required_items", i, "template_id", Number(e.target.value))}
                  className="bg-black/30 text-white border border-white/30 rounded-md px-2 py-1.5 flex-1"
                >
                  <option value={0}>-- Выберите предмет --</option>
                  {itemTemplates.map(it => (
                    <option key={it.id} value={it.id}>{it.name} ({it.rarity})</option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => updateListItem("required_items", i, "quantity", Number(e.target.value))}
                  className="w-20 bg-black/30 text-white border-white/30"
                />
                <Button size="sm" variant="ghost" onClick={() => removeListItem("required_items", i)}>
                  <X className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="mt-2 text-white" onClick={() => addListItem("required_items")}>
              <Plus className="w-4 h-4 mr-1" /> Добавить предмет
            </Button>
          </div>

          {/* Reward Items */}
          <div className="mt-4">
            <Label className="text-white font-semibold">Награды (предметы)</Label>
            {form.reward_items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center mt-2">
                <select
                  value={item.template_id}
                  onChange={e => updateListItem("reward_items", i, "template_id", Number(e.target.value))}
                  className="bg-black/30 text-white border border-white/30 rounded-md px-2 py-1.5 flex-1"
                >
                  <option value={0}>-- Выберите предмет --</option>
                  {itemTemplates.map(it => (
                    <option key={it.id} value={it.id}>{it.name} ({it.rarity})</option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => updateListItem("reward_items", i, "quantity", Number(e.target.value))}
                  className="w-20 bg-black/30 text-white border-white/30"
                />
                <Button size="sm" variant="ghost" onClick={() => removeListItem("reward_items", i)}>
                  <X className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="mt-2 text-white" onClick={() => addListItem("reward_items")}>
              <Plus className="w-4 h-4 mr-1" /> Добавить награду
            </Button>
          </div>

          <Button onClick={saveTemplate} className="mt-6 w-full gap-1">
            <Save className="w-4 h-4" /> {editingId ? "Сохранить" : "Создать"}
          </Button>
        </Card>
      )}
    </div>
  );
};
