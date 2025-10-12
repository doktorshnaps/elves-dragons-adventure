import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flame, Trophy, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";

interface DonationStats {
  wallet_address: string;
  total_donated: number;
  donation_count: number;
  last_donation_at: string;
  rank: number;
}

interface DonationHistory {
  id: string;
  amount: number;
  created_at: string;
}

export const SoulAltarTab = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  
  const [leaderboard, setLeaderboard] = useState<DonationStats[]>([]);
  const [myStats, setMyStats] = useState<DonationStats | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  const soulCrystals = gameData.inventory?.filter(
    (item: any) => item.name === "Кристалл Жизни"
  ).length || 0;

  useEffect(() => {
    loadDonationStats();
  }, [accountId]);

  const loadDonationStats = async () => {
    try {
      setLoading(true);
      
      // Загрузить топ доноров
      const { data, error } = await supabase.rpc('get_soul_donations_stats');

      if (error) {
        console.error('Error loading donation stats:', error);
        throw error;
      }

      const stats = (data || []) as DonationStats[];
      setLeaderboard(stats.slice(0, 10)); // Топ 10

      // Найти статистику текущего пользователя
      if (accountId) {
        const userStats = stats.find(s => s.wallet_address === accountId);
        setMyStats(userStats || null);
      }
    } catch (error) {
      console.error('Error loading donation stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику пожертвований",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(donationAmount);
    
    if (isNaN(amount) || amount < 1) {
      toast({
        title: "Ошибка",
        description: "Введите корректное количество (минимум 1)",
        variant: "destructive",
      });
      return;
    }

    if (amount > soulCrystals) {
      toast({
        title: "Недостаточно кристаллов",
        description: `У вас есть только ${soulCrystals} Кристаллов Жизни`,
        variant: "destructive",
      });
      return;
    }

    try {
      setDonating(true);

      // Удаляем кристаллы из инвентаря
      const updatedInventory = [...(gameData.inventory || [])];
      let removed = 0;
      
      for (let i = updatedInventory.length - 1; i >= 0 && removed < amount; i--) {
        if (updatedInventory[i].name === "Кристалл Жизни") {
          updatedInventory.splice(i, 1);
          removed++;
        }
      }

      // Обновляем игровые данные
      await updateGameData({ inventory: updatedInventory });

      // Записываем пожертвование
      const { error } = await supabase
        .from('soul_donations')
        .insert({
          wallet_address: accountId,
          amount: amount,
        });

      if (error) throw error;

      toast({
        title: "Пожертвование принято!",
        description: `Вы пожертвовали ${amount} Кристаллов Жизни`,
      });

      setDonationAmount("");
      await loadDonationStats();

    } catch (error) {
      console.error('Error making donation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось совершить пожертвование",
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-orange-400";
    return "text-white";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className={`w-6 h-6 ${getRankColor(rank)}`} />;
    return <div className="text-2xl font-bold text-white w-8">{rank}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Панель пожертвования */}
      <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Flame className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Алтарь Душ</h3>
              <p className="text-sm text-white/60">
                Пожертвуйте Кристаллы Жизни и поднимитесь в рейтинге
              </p>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">В вашем инвентаре:</span>
              <span className="text-xl font-bold text-purple-400">{soulCrystals} кристаллов</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Количество кристаллов"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              min="1"
              max={soulCrystals}
              className="flex-1 bg-black/40 border-white/20 text-white"
              disabled={donating || soulCrystals === 0}
            />
            <Button
              onClick={handleDonate}
              disabled={donating || soulCrystals === 0 || !donationAmount}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              {donating ? "Пожертвование..." : "Пожертвовать"}
            </Button>
          </div>

          {soulCrystals === 0 && (
            <p className="text-sm text-orange-400 mt-2">
              У вас нет Кристаллов Жизни. Получите их в данжах!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ваша статистика */}
      {myStats && (
        <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${getRankColor(myStats.rank)}`}>
                  #{myStats.rank}
                </div>
                <div>
                  <div className="text-sm text-white/70">Ваш ранг</div>
                  <div className="text-lg font-bold text-white">
                    {myStats.total_donated} пожертвовано
                  </div>
                  <div className="text-xs text-white/60">
                    {myStats.donation_count} пожертвований
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/70 mb-1">Последнее</div>
                <div className="text-sm text-white">
                  {new Date(myStats.last_donation_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Топ доноров */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Топ доноров
        </h3>
        
        {loading ? (
          <div className="text-center py-8 text-white">Загрузка...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            Пока нет пожертвований. Будьте первым!
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((stat) => (
              <Card 
                key={stat.wallet_address} 
                variant="menu" 
                style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                className={stat.wallet_address === accountId ? "border-2 border-purple-500" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getRankIcon(stat.rank)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-white flex items-center gap-2">
                          {stat.wallet_address}
                          {stat.wallet_address === accountId && (
                            <span className="text-xs text-purple-400">(Вы)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                          <Flame className="w-3 h-3" />
                          <span>{stat.donation_count} пожертвований</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{new Date(stat.last_donation_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        {stat.total_donated}
                      </div>
                      <div className="text-xs text-white/60">кристаллов</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
