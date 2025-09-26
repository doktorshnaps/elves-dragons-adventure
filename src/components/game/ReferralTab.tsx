import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { Copy, Users, TrendingUp, Gift } from "lucide-react";

interface Referral {
  id: string;
  referred_wallet_address: string;
  created_at: string;
}

interface ReferralEarning {
  id: string;
  referred_wallet_address: string;
  amount: number;
  level: number;
  created_at: string;
}

export const ReferralTab = () => {
  const [referralId, setReferralId] = useState("");
  const [myReferrals, setMyReferrals] = useState<Referral[]>([]);
  const [myEarnings, setMyEarnings] = useState<ReferralEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const { accountId } = useWallet();

  const referralLink = `${window.location.origin}/register?ref=${accountId}`;

  useEffect(() => {
    if (accountId) {
      fetchReferralData();
    }
  }, [accountId]);

  const fetchReferralData = async () => {
    if (!accountId) return;

    try {
      setLoading(true);

      console.log('Fetching referral data for wallet:', accountId);

      // Use RPC functions to bypass RLS (they have SECURITY DEFINER)
      const { data: myReferrals, error: referralsError } = await supabase
        .rpc('get_referrals_by_referrer', { p_wallet_address: accountId });

      console.log('Referrals RPC result:', { myReferrals, referralsError });

      if (referralsError) throw referralsError;
      
      // Check if I was referred by someone  
      const { data: whoReferredMe, error: referredError } = await supabase
        .rpc('get_referrer_for_wallet', { p_wallet_address: accountId });

      console.log('Who referred me RPC result:', { whoReferredMe, referredError });

      setMyReferrals(myReferrals || []);

      // Fetch my earnings using RPC
      const { data: earnings, error: earningsError } = await supabase
        .rpc('get_referral_earnings_by_referrer', { p_wallet_address: accountId });

      console.log('Earnings RPC result:', { earnings, earningsError });

      if (earningsError) throw earningsError;
      setMyEarnings(earnings || []);

      // Calculate total earnings
      const total = earnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0;
      setTotalEarnings(total);

    } catch (error) {
      console.error('Error in fetchReferralData:', error);
      handleError(error, 'Ошибка загрузки данных рефералов');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      handleSuccess('Реферальная ссылка скопирована!');
    } catch (error) {
      handleError(error, 'Ошибка копирования ссылки');
    }
  };

  const addReferralManually = async () => {
    if (!referralId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID игрока, который вас пригласил",
        variant: "destructive"
      });
      return;
    }

    if (!accountId) {
      toast({
        title: "Ошибка", 
        description: "Кошелек не подключен",
        variant: "destructive"
      });
      return;
    }

    if (referralId.trim() === accountId) {
      toast({
        title: "Ошибка",
        description: "Нельзя указать себя как пригласившего",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('add_referral', {
          p_referrer_wallet_address: referralId.trim(),
          p_referred_wallet_address: accountId
        });

      if (error) throw error;

      handleSuccess('Пригласивший игрок успешно указан!');
      setReferralId('');
      fetchReferralData();

    } catch (error: any) {
      handleError(error, 'Ошибка указания пригласившего игрока');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-blue-400';
      case 3: return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getLevelPercentage = (level: number) => {
    switch (level) {
      case 1: return '6%';
      case 2: return '3%';
      case 3: return '1.5%';
      default: return '0%';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-game-surface/80 border border-game-accent rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-game-accent" />
            <span className="text-game-accent font-medium">Мои рефералы</span>
          </div>
          <p className="text-2xl font-bold text-white">{myReferrals.length}</p>
        </div>

        <div className="bg-game-surface/80 border border-game-accent rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-game-accent" />
            <span className="text-game-accent font-medium">Общий доход</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalEarnings} ELL</p>
        </div>

        <div className="bg-game-surface/80 border border-game-accent rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="h-5 w-5 text-game-accent" />
            <span className="text-game-accent font-medium">Активные уровни</span>
          </div>
          <p className="text-2xl font-bold text-white">3</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6">
        <h3 className="text-xl text-game-accent mb-4">Ваша реферальная ссылка</h3>
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="bg-game-surface border-game-accent text-white"
          />
          <Button
            onClick={copyReferralLink}
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-game-surface"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-300 text-sm mt-2">
          Поделитесь этой ссылкой с друзьями и получайте процент от их заработка в подземельях!
        </p>
      </div>

      {/* Player ID Info */}
      <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6 mb-6">
        <h3 className="text-xl text-game-accent mb-4">Ваш ID игрока</h3>
        <div className="flex gap-2">
          <Input
            value={accountId || ''}
            readOnly
            className="bg-game-surface border-game-accent text-white font-mono text-sm"
          />
          <Button
            onClick={() => accountId && navigator.clipboard.writeText(accountId)}
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-game-surface"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-300 text-sm mt-2">
          Это ваш уникальный ID. Поделитесь им с тем, кто вас пригласил
        </p>
      </div>

      {/* Add Referrer */}
      <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6">
        <h3 className="text-xl text-game-accent mb-4">Указать кто вас пригласил</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Введите ID игрока, который вас пригласил"
            value={referralId}
            onChange={(e) => setReferralId(e.target.value)}
            className="bg-game-surface border-game-accent text-white"
          />
          <Button
            onClick={addReferralManually}
            disabled={loading}
            className="bg-game-accent text-game-surface hover:bg-game-accent/80"
          >
            Указать
          </Button>
        </div>
        <p className="text-gray-300 text-sm mt-2">
          Если вас пригласили, но вы не перешли по ссылке, укажите ID пригласившего вас игрока
        </p>
      </div>

      {/* Referral Levels Info */}
      <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6">
        <h3 className="text-xl text-game-accent mb-4">Система вознаграждений</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-game-surface rounded border border-yellow-400/30">
            <span className="text-yellow-400 font-medium">1-й уровень (прямые рефералы)</span>
            <span className="text-yellow-400 font-bold">6%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-game-surface rounded border border-blue-400/30">
            <span className="text-blue-400 font-medium">2-й уровень (рефералы рефералов)</span>
            <span className="text-blue-400 font-bold">3%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-game-surface rounded border border-green-400/30">
            <span className="text-green-400 font-medium">3-й уровень</span>
            <span className="text-green-400 font-bold">1.5%</span>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-4">
          Вы получаете процент от ELL, которые ваши рефералы зарабатывают в подземельях
        </p>
      </div>

      {/* My Referrals List */}
      {myReferrals.length > 0 && (
        <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6">
          <h3 className="text-xl text-game-accent mb-4">Мои рефералы</h3>
          <div className="space-y-2">
            {myReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex justify-between items-center p-3 bg-game-surface border border-game-accent/30 rounded"
              >
                <span className="text-white font-mono">
                  {referral.referred_wallet_address.slice(0, 8)}...{referral.referred_wallet_address.slice(-8)}
                </span>
                <span className="text-gray-300 text-sm">
                  {new Date(referral.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Earnings */}
      {myEarnings.length > 0 && (
        <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6">
          <h3 className="text-xl text-game-accent mb-4">Последние доходы</h3>
          <div className="space-y-2">
            {myEarnings.slice(0, 10).map((earning) => (
              <div
                key={earning.id}
                className="flex justify-between items-center p-3 bg-game-surface border border-game-accent/30 rounded"
              >
                <div className="flex items-center space-x-3">
                  <span className={`font-bold ${getLevelColor(earning.level)}`}>
                    {getLevelPercentage(earning.level)}
                  </span>
                  <span className="text-white font-mono text-sm">
                    {earning.referred_wallet_address.slice(0, 6)}...{earning.referred_wallet_address.slice(-6)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-game-accent font-bold">+{earning.amount} ELL</span>
                  <div className="text-gray-300 text-xs">
                    {new Date(earning.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};