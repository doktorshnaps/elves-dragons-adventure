import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Coins, 
  Swords, 
  Library,
  RefreshCw,
  UserPlus,
  Activity,
  Target
} from 'lucide-react';

interface GameMetricsData {
  players: {
    total: number;
    dau: number;
    wau: number;
    mau: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
  };
  retention: {
    d1: number;
    d7: number;
    d30: number;
  };
  engagement: {
    avgSessionMinutes: number;
    dauMauRatio: number;
  };
  economy: {
    totalEllSpent: number;
    playersWithPurchases: number;
    conversionRate: number;
  };
  dungeons: {
    avgLevel: number;
    maxLevel: number;
  };
  cards: {
    totalCards: number;
    totalHeroes: number;
    totalDragons: number;
    uniqueTypes: number;
    playersWithFullCollection: number;
    fullCollectionRate: number;
  };
  generatedAt: string;
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full bg-primary/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RetentionBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className="text-white font-medium">{value}%</span>
    </div>
    <Progress value={value} className="h-2" style={{ ['--progress-color' as string]: color }} />
  </div>
);

export const GameMetrics = () => {
  const { accountId } = useWalletContext();

  const { data: metrics, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['gameMetrics', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('No wallet connected');
      
      const { data, error } = await supabase.rpc('get_game_metrics', {
        p_admin_wallet_address: accountId
      });
      
      if (error) throw error;
      return data as unknown as GameMetricsData;
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-white/70">Загрузка метрик...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-red-400 mb-4">Ошибка загрузки метрик</p>
          <Button onClick={() => refetch()} variant="outline">
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">KPI Метрики</h2>
          <p className="text-white/60 text-sm">
            Обновлено: {new Date(metrics.generatedAt).toLocaleString('ru-RU')}
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Игроки */}
      <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Игроки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Всего игроков" 
              value={metrics.players.total.toLocaleString()} 
              icon={Users} 
            />
            <MetricCard 
              title="DAU (24ч)" 
              value={metrics.players.dau.toLocaleString()} 
              subtitle={`${metrics.engagement.dauMauRatio}% от MAU`}
              icon={Activity} 
            />
            <MetricCard 
              title="WAU (7д)" 
              value={metrics.players.wau.toLocaleString()} 
              icon={TrendingUp} 
            />
            <MetricCard 
              title="MAU (30д)" 
              value={metrics.players.mau.toLocaleString()} 
              icon={Target} 
            />
          </div>
          
          {/* Новые игроки */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm mb-3">Новые игроки</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <UserPlus className="h-5 w-5 mx-auto text-green-400 mb-1" />
                <p className="text-xl font-bold text-white">{metrics.players.newToday}</p>
                <p className="text-xs text-white/50">Сегодня</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <UserPlus className="h-5 w-5 mx-auto text-blue-400 mb-1" />
                <p className="text-xl font-bold text-white">{metrics.players.newWeek}</p>
                <p className="text-xs text-white/50">За неделю</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <UserPlus className="h-5 w-5 mx-auto text-purple-400 mb-1" />
                <p className="text-xl font-bold text-white">{metrics.players.newMonth}</p>
                <p className="text-xs text-white/50">За месяц</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Удержание */}
      <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Удержание (Retention)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RetentionBar 
            label="D1 (вернулись через день)" 
            value={metrics.retention.d1} 
            color="hsl(142, 76%, 36%)" 
          />
          <RetentionBar 
            label="D7 (вернулись через неделю)" 
            value={metrics.retention.d7} 
            color="hsl(217, 91%, 60%)" 
          />
          <RetentionBar 
            label="D30 (вернулись через месяц)" 
            value={metrics.retention.d30} 
            color="hsl(280, 87%, 65%)" 
          />
        </CardContent>
      </Card>

      {/* Вовлеченность и Экономика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Вовлеченность */}
        <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Вовлеченность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Среднее время сессии</span>
              <span className="text-xl font-bold text-white">
                {metrics.engagement.avgSessionMinutes.toFixed(1)} мин
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">DAU/MAU Ratio</span>
              <span className="text-xl font-bold text-white">
                {metrics.engagement.dauMauRatio}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Экономика */}
        <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Экономика (ELL)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Всего потрачено ELL</span>
              <span className="text-xl font-bold text-white">
                {metrics.economy.totalEllSpent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Игроков с покупками</span>
              <span className="text-xl font-bold text-white">
                {metrics.economy.playersWithPurchases}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Конверсия</span>
              <span className="text-xl font-bold text-green-400">
                {metrics.economy.conversionRate}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Подземелья и Карты */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Подземелья */}
        <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Подземелья
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Средний уровень</span>
              <span className="text-xl font-bold text-white">
                {metrics.dungeons.avgLevel}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Максимальный уровень</span>
              <span className="text-xl font-bold text-yellow-400">
                {metrics.dungeons.maxLevel}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Карты */}
        <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Library className="h-5 w-5 text-primary" />
              Коллекция карт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-white">{metrics.cards.totalCards.toLocaleString()}</p>
                <p className="text-xs text-white/50">Всего карт</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-blue-400">{metrics.cards.totalHeroes.toLocaleString()}</p>
                <p className="text-xs text-white/50">Героев</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-purple-400">{metrics.cards.totalDragons.toLocaleString()}</p>
                <p className="text-xs text-white/50">Драконов</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Уникальных типов</span>
              <span className="text-white font-medium">{metrics.cards.uniqueTypes}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Полная коллекция</span>
              <span className="text-green-400 font-medium">
                {metrics.cards.playersWithFullCollection} ({metrics.cards.fullCollectionRate}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
