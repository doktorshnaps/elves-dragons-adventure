import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Loader2, Sword, Shield, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface BonusReward {
  type: "hero_card" | "dragon_card" | "item";
  template_id: string;
  name: string;
  rarity?: number;
  quantity: number;
}

interface CardTemplate {
  id: string;
  card_name: string;
  card_type: string;
  rarity: number;
  faction: string | null;
}

interface ItemTemplate {
  id: number;
  item_id: string;
  name: string;
  type: string;
  rarity: string;
}

interface BonusRewardEditorProps {
  rewards: BonusReward[];
  onChange: (rewards: BonusReward[]) => void;
  compact?: boolean;
}

const RARITY_LABELS: Record<number, string> = {
  1: "★1",
  2: "★2",
  3: "★3",
  4: "★4",
  5: "★5",
  6: "★6",
  7: "★7",
  8: "★8",
};

const TYPE_LABELS: Record<string, string> = {
  hero_card: "Герой",
  dragon_card: "Дракон",
  item: "Предмет",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  hero_card: <Sword className="w-3 h-3" />,
  dragon_card: <Shield className="w-3 h-3" />,
  item: <Package className="w-3 h-3" />,
};

export const BonusRewardEditor: React.FC<BonusRewardEditorProps> = ({ rewards, onChange, compact }) => {
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // New reward form state
  const [newType, setNewType] = useState<"hero_card" | "dragon_card" | "item">("hero_card");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const [cardsRes, itemsRes] = await Promise.all([
      supabase.from("card_templates").select("id, card_name, card_type, rarity, faction").order("card_type").order("rarity").order("card_name"),
      supabase.from("item_templates").select("id, item_id, name, type, rarity").order("name"),
    ]);
    if (cardsRes.data) setCardTemplates(cardsRes.data);
    if (itemsRes.data) setItemTemplates(itemsRes.data as ItemTemplate[]);
    setLoading(false);
  };

  const filteredCards = cardTemplates.filter(c => {
    const matchType = newType === "hero_card" ? c.card_type === "hero" : c.card_type === "dragon";
    const matchSearch = !searchQuery || c.card_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const filteredItems = itemTemplates.filter(i => {
    return !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAdd = () => {
    if (!newTemplateId) return;

    let name = "";
    let rarity: number | undefined;

    if (newType === "item") {
      const item = itemTemplates.find(i => String(i.id) === newTemplateId);
      if (!item) return;
      name = item.name;
    } else {
      const card = cardTemplates.find(c => c.id === newTemplateId);
      if (!card) return;
      name = card.card_name;
      rarity = card.rarity;
    }

    const newReward: BonusReward = {
      type: newType,
      template_id: newTemplateId,
      name,
      rarity,
      quantity: newType === "item" ? newQuantity : 1,
    };

    onChange([...rewards, newReward]);
    setNewTemplateId("");
    setNewQuantity(1);
    setSearchQuery("");
    setAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(rewards.filter((_, i) => i !== index));
  };

  if (loading) {
    return <Loader2 className="w-3 h-3 animate-spin text-white/50" />;
  }

  return (
    <div className="space-y-1.5">
      {/* Existing rewards */}
      {rewards.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rewards.map((reward, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-[10px] gap-1 pr-0.5 bg-white/5"
            >
              {TYPE_ICONS[reward.type]}
              <span>{reward.name}</span>
              {reward.rarity && <span className="opacity-60">{RARITY_LABELS[reward.rarity]}</span>}
              {reward.type === "item" && reward.quantity > 1 && (
                <span className="opacity-60">×{reward.quantity}</span>
              )}
              <button
                onClick={() => handleRemove(index)}
                className="ml-0.5 p-0.5 hover:bg-white/10 rounded"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add button / form */}
      {adding ? (
        <div className="p-2 bg-white/5 rounded-lg space-y-2">
          <div className="flex gap-2">
            <Select value={newType} onValueChange={(v) => { setNewType(v as any); setNewTemplateId(""); setSearchQuery(""); }}>
              <SelectTrigger className="w-28 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero_card">Герой</SelectItem>
                <SelectItem value="dragon_card">Дракон</SelectItem>
                <SelectItem value="item">Предмет</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>

          {/* Template selector */}
          <Select value={newTemplateId} onValueChange={setNewTemplateId}>
            <SelectTrigger className="h-7 text-xs w-full">
              <SelectValue placeholder="Выберите шаблон..." />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {newType === "item" ? (
                filteredItems.slice(0, 30).map(item => (
                  <SelectItem key={item.id} value={String(item.id)} className="text-xs">
                    {item.name} ({item.rarity})
                  </SelectItem>
                ))
              ) : (
                filteredCards.slice(0, 30).map(card => (
                  <SelectItem key={card.id} value={card.id} className="text-xs">
                    {card.card_name} {card.faction ? `[${card.faction}]` : ''} {RARITY_LABELS[card.rarity]}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {newType === "item" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Кол-во:</span>
              <Input
                type="number"
                min={1}
                value={newQuantity}
                onChange={e => setNewQuantity(parseInt(e.target.value) || 1)}
                className="w-16 h-7 text-xs"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd} disabled={!newTemplateId}>
              Добавить
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-white/50 hover:text-white/80 px-1"
          onClick={() => setAdding(true)}
        >
          <Plus className="w-3 h-3 mr-0.5" />
          Бонус
        </Button>
      )}
    </div>
  );
};

// Read-only display of bonus rewards (for non-edit mode)
export const BonusRewardDisplay: React.FC<{ rewards?: BonusReward[] }> = ({ rewards }) => {
  if (!rewards || rewards.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {rewards.map((reward, index) => (
        <Badge key={index} variant="outline" className="text-[10px] gap-1 bg-white/5">
          {TYPE_ICONS[reward.type]}
          <span>{reward.name}</span>
          {reward.rarity && <span className="opacity-60">{RARITY_LABELS[reward.rarity]}</span>}
          {reward.type === "item" && reward.quantity > 1 && (
            <span className="opacity-60">×{reward.quantity}</span>
          )}
        </Badge>
      ))}
    </div>
  );
};
