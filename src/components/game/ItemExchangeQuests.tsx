import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useGameData } from "@/hooks/useGameData";
import { useLanguage } from "@/hooks/useLanguage";
import { Gift, CheckCircle2, ArrowRight, Package } from "lucide-react";

interface ItemExchange {
  exchange_id: string;
  template_id: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  icon: string;
  required_items: { template_id: number; quantity: number }[];
  reward_items: { template_id: number; quantity: number }[];
  reward_ell: number;
  is_completed: boolean;
  is_claimed: boolean;
  assigned_date: string;
}

interface ItemInfo {
  id: number;
  name: string;
  rarity: string;
  image_url: string | null;
}

interface OwnedCount {
  template_id: number;
  count: number;
}

export const ItemExchangeQuests = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { updateGameData } = useGameData();
  const { language } = useLanguage();
  const [exchanges, setExchanges] = useState<ItemExchange[]>([]);
  const [itemInfo, setItemInfo] = useState<ItemInfo[]>([]);
  const [ownedCounts, setOwnedCounts] = useState<OwnedCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) loadData();
  }, [accountId]);

  const loadData = async () => {
    if (!accountId) return;
    setLoading(true);

    const [exRes, itemRes, ownedRes] = await Promise.all([
      supabase.rpc("get_user_item_exchanges", { p_wallet_address: accountId }),
      supabase.from("item_templates").select("id, name, rarity, image_url"),
      supabase.from("item_instances").select("template_id"),
    ]);

    if (exRes.data) setExchanges(exRes.data as unknown as ItemExchange[]);
    if (itemRes.data) setItemInfo(itemRes.data as ItemInfo[]);

    // Count owned items by template_id
    if (ownedRes.data) {
      const counts: Record<number, number> = {};
      for (const item of ownedRes.data) {
        if (item.template_id != null) {
          counts[item.template_id] = (counts[item.template_id] || 0) + 1;
        }
      }
      setOwnedCounts(Object.entries(counts).map(([k, v]) => ({ template_id: Number(k), count: v })));
    }

    setLoading(false);
  };

  const getItemInfo = (templateId: number): ItemInfo | undefined => {
    return itemInfo.find(i => i.id === templateId);
  };

  const getOwnedCount = (templateId: number): number => {
    return ownedCounts.find(o => o.template_id === templateId)?.count || 0;
  };

  const canSubmit = (exchange: ItemExchange): boolean => {
    return exchange.required_items.every(
      req => getOwnedCount(req.template_id) >= req.quantity
    );
  };

  const handleSubmit = async (exchange: ItemExchange) => {
    if (!accountId) return;
    setSubmitting(exchange.exchange_id);

    try {
      const { data, error } = await supabase.rpc("submit_item_exchange", {
        p_wallet_address: accountId,
        p_exchange_id: exchange.exchange_id,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string; reward_ell: number; new_balance: number };

      if (!result.success) {
        toast({
          title: language === "ru" ? "Ошибка" : "Error",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      if (result.reward_ell > 0) {
        await updateGameData({ balance: result.new_balance });
      }

      toast({
        title: language === "ru" ? "Обмен выполнен!" : "Exchange completed!",
        description: language === "ru" ? "Предметы обменены успешно" : "Items exchanged successfully",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: language === "ru" ? "Ошибка" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-gray-300";
      case "uncommon": return "text-green-400";
      case "rare": return "text-blue-400";
      case "epic": return "text-purple-400";
      case "legendary": return "text-yellow-400";
      case "mythic": return "text-red-400";
      case "divine": return "text-pink-400";
      default: return "text-white";
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <p className="text-center text-black">
          {language === "ru" ? "Загрузка заказов..." : "Loading orders..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-black" />
          <h2 className="text-xl font-bold text-black">
            {language === "ru" ? "Ежедневные заказы" : "Daily Orders"}
          </h2>
        </div>

        {exchanges.length === 0 ? (
          <p className="text-center text-black/60">
            {language === "ru" ? "Нет доступных заказов" : "No orders available"}
          </p>
        ) : (
          <div className="space-y-4">
            {exchanges.map(exchange => {
              const title = language === "ru" ? exchange.title_ru : exchange.title_en;
              const desc = language === "ru" ? exchange.description_ru : exchange.description_en;
              const completed = exchange.is_completed;
              const hasItems = canSubmit(exchange);

              return (
                <div
                  key={exchange.exchange_id}
                  className={`bg-black/50 border-2 rounded-3xl p-5 backdrop-blur-sm transition-all hover:bg-black/70 ${
                    completed ? "border-green-400/50" : hasItems ? "border-yellow-400/50" : "border-white"
                  }`}
                  style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10">
                      {exchange.icon || "📦"}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{title}</h4>
                          <p className="text-sm text-white/80 mt-1">{desc}</p>
                        </div>

                        <div>
                          {completed ? (
                            <span className="flex items-center gap-1 text-sm text-green-400 font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              {language === "ru" ? "Выполнено" : "Done"}
                            </span>
                          ) : (
                            <Button
                              onClick={() => handleSubmit(exchange)}
                              disabled={!hasItems || submitting === exchange.exchange_id}
                              size="sm"
                              className={`rounded-xl font-semibold ${
                                hasItems
                                  ? "bg-green-500 text-white hover:bg-green-600 border-2 border-green-400"
                                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Gift className="w-4 h-4 mr-1" />
                              {submitting === exchange.exchange_id
                                ? "..."
                                : language === "ru" ? "Сдать" : "Submit"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Required -> Reward */}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="flex flex-wrap gap-2">
                          {exchange.required_items.map((req, i) => {
                            const info = getItemInfo(req.template_id);
                            const owned = getOwnedCount(req.template_id);
                            const enough = owned >= req.quantity;
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${
                                  enough ? "border-green-400/50 bg-green-400/10" : "border-red-400/50 bg-red-400/10"
                                }`}
                              >
                                {info?.image_url && (
                                  <img src={info.image_url} alt="" className="w-6 h-6 rounded object-cover" />
                                )}
                                <span className={info ? getRarityColor(info.rarity) : "text-white"}>
                                  {info?.name || `#${req.template_id}`}
                                </span>
                                <span className={`font-bold ${enough ? "text-green-400" : "text-red-400"}`}>
                                  {owned}/{req.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <ArrowRight className="w-5 h-5 text-white/50" />

                        <div className="flex flex-wrap gap-2">
                          {exchange.reward_items.map((rew, i) => {
                            const info = getItemInfo(rew.template_id);
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-yellow-400/50 bg-yellow-400/10"
                              >
                                {info?.image_url && (
                                  <img src={info.image_url} alt="" className="w-6 h-6 rounded object-cover" />
                                )}
                                <span className={info ? getRarityColor(info.rarity) : "text-white"}>
                                  {info?.name || `#${rew.template_id}`}
                                </span>
                                <span className="font-bold text-yellow-400">x{rew.quantity}</span>
                              </div>
                            );
                          })}
                          {exchange.reward_ell > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-yellow-400/50 bg-yellow-400/10">
                              <span className="text-yellow-400 font-bold">+{exchange.reward_ell} ELL</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
