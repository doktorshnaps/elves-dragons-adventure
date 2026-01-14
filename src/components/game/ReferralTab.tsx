import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Copy, Users, TrendingUp, Gift, ChevronDown, ChevronRight } from "lucide-react";
import { ReferralLeaderboard } from "./ReferralLeaderboard";
interface Referral {
  id: string;
  referred_wallet_address: string;
  created_at: string;
  isWhitelisted?: boolean;
}

interface ReferralEarning {
  id: string;
  referred_wallet_address: string;
  amount: number;
  level: number;
  created_at: string;
}

interface ReferralTreeNode {
  wallet_address: string;
  level: number;
  children: ReferralTreeNode[];
  earnings?: number;
  joinDate?: string;
  isWhitelisted?: boolean;
}

const ReferralTreeView = ({ node, isExpanded, onToggle }: {
  node: ReferralTreeNode;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const [childrenExpanded, setChildrenExpanded] = useState<Record<string, boolean>>({});

  const toggleChild = (wallet: string) => {
    setChildrenExpanded(prev => ({
      ...prev,
      [wallet]: !prev[wallet]
    }));
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'text-white border-white bg-white/20';
      case 1: return 'text-white border-white bg-white/15';
      case 2: return 'text-white border-white bg-white/15';
      case 3: return 'text-white border-white bg-white/15';
      default: return 'text-white border-white bg-white/10';
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${getLevelColor(node.level)}`}>
        <div className="flex items-center space-x-3">
          {node.children.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 h-6 w-6 text-white hover:bg-white/20"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-medium text-white">
                {node.level === 0 ? 'ВЫ' : formatWallet(node.wallet_address)}
              </span>
            </div>
            <div className="text-xs text-white/70">
              {node.level === 0 ? 'Главный игрок' : `Уровень ${node.level}`}
              {node.joinDate && ` • ${new Date(node.joinDate).toLocaleDateString()}`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-white">
            {node.children.length} реф.
          </div>
          {node.earnings !== undefined && (
            <div className="text-sm text-white/70">
              {node.earnings} ELL
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && node.children.length > 0 && (
        <div className="ml-8 space-y-2 border-l-2 border-white/20 pl-4">
          {node.children.map((child) => (
            <ReferralTreeView
              key={child.wallet_address}
              node={child}
              isExpanded={childrenExpanded[child.wallet_address] || false}
              onToggle={() => toggleChild(child.wallet_address)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ReferralTab = () => {
  const [referralId, setReferralId] = useState("");
  const [myReferrals, setMyReferrals] = useState<Referral[]>([]);
  const [myEarnings, setMyEarnings] = useState<ReferralEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showReferralTree, setShowReferralTree] = useState(false);
  const [referralTree, setReferralTree] = useState<ReferralTreeNode | null>(null);
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [whoReferredMe, setWhoReferredMe] = useState<{referrer_wallet_address: string, created_at: string} | null>(null);
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const { accountId } = useWalletContext();

  const referralLink = `https://elleonorai.xyz/auth?ref=${accountId}`;

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
      
      // Game is now open access - all users are considered whitelisted
      const referralsWithWhitelistStatus = (myReferrals || []).map((referral) => ({
        ...referral,
        isWhitelisted: true
      }));
      
      // Check if I was referred by someone  
      const { data: whoReferredMeData, error: referredError } = await supabase
        .rpc('get_referrer_for_wallet', { p_wallet_address: accountId });

      console.log('Who referred me RPC result:', { whoReferredMeData, referredError });

      setMyReferrals(referralsWithWhitelistStatus);
      setWhoReferredMe(whoReferredMeData?.[0] || null);

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

  const buildReferralTree = async (rootWallet: string): Promise<ReferralTreeNode> => {
    const tree: ReferralTreeNode = {
      wallet_address: rootWallet,
      level: 0,
      children: []
    };

    const buildLevel = async (node: ReferralTreeNode, maxLevel = 3) => {
      if (node.level >= maxLevel) return;

      try {
        const { data: directReferrals } = await supabase
          .rpc('get_referrals_by_referrer', { p_wallet_address: node.wallet_address });

        if (directReferrals && directReferrals.length > 0) {
          // Параллельная загрузка данных для всех рефералов этого уровня
          const childNodesPromises = directReferrals.map(async (referral) => {
            // Game is open access - all users considered whitelisted
            const earningsResult = await supabase.rpc('get_referral_earnings_by_referrer', { p_wallet_address: referral.referred_wallet_address });

            const childNode: ReferralTreeNode = {
              wallet_address: referral.referred_wallet_address,
              level: node.level + 1,
              children: [],
              joinDate: referral.created_at,
              isWhitelisted: true
            };

            childNode.earnings = earningsResult.data?.reduce((sum, earning) => sum + earning.amount, 0) || 0;

            return childNode;
          });

          // Ждем завершения всех параллельных запросов
          const childNodes = await Promise.all(childNodesPromises);
          node.children = childNodes;

          // Рекурсивно строим следующий уровень для всех детей параллельно
          await Promise.all(
            childNodes.map(childNode => buildLevel(childNode, maxLevel))
          );
        }
      } catch (error) {
        console.error('Error building referral tree level:', error);
      }
    };

    await buildLevel(tree);
    return tree;
  };

  const openReferralTree = async () => {
    if (!accountId) return;
    
    setLoading(true);
    try {
      const tree = await buildReferralTree(accountId);
      setReferralTree(tree);
      setShowReferralTree(true);
    } catch (error) {
      handleError(error, 'Ошибка загрузки дерева рефералов');
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

      // Проверяем результат из базы данных
      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message?: string; code?: string };
        if (result.success) {
          handleSuccess(String(result.message) || 'Пригласивший игрок успешно указан!');
          setReferralId('');
          fetchReferralData();
        } else {
          // Показываем понятное сообщение об ошибке
          const errorMessage = result.code === 'already_referred' 
            ? 'У вас уже есть пригласивший игрок'
            : (String(result.message) || 'Не удалось добавить реферала');
          
          toast({
            title: "Внимание",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } else {
        handleSuccess('Пригласивший игрок успешно указан!');
        setReferralId('');
        fetchReferralData();
      }

    } catch (error: any) {
      console.error('Referral error:', error);
      handleError(error, 'Ошибка указания пригласившего игрока');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-white';
      case 2: return 'text-white';
      case 3: return 'text-white';
      default: return 'text-white/70';
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
        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 cursor-pointer hover:bg-black/70 transition-all backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={openReferralTree}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-white" />
            <span className="text-white font-medium">Мои рефералы</span>
          </div>
          <p className="text-2xl font-bold text-white">{myReferrals.length}</p>
          <p className="text-xs text-white/70 mt-1">Нажмите для просмотра дерева</p>
        </div>

        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-white" />
            <span className="text-white font-medium">Общий доход</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalEarnings} ELL</p>
        </div>

        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="h-5 w-5 text-white" />
            <span className="text-white font-medium">Активные уровни</span>
          </div>
          <p className="text-2xl font-bold text-white">3</p>
        </div>
      </div>

      {/* Referral Tree Dialog */}
      <Dialog open={showReferralTree} onOpenChange={setShowReferralTree}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-black/90 border-2 border-white backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Дерево рефералов</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {referralTree && (
              <ReferralTreeView
                node={referralTree}
                isExpanded={treeExpanded}
                onToggle={() => setTreeExpanded(!treeExpanded)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Link Section */}
      <div 
        className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <h3 className="text-xl text-white font-semibold mb-4">Ваша реферальная ссылка</h3>
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="bg-white/10 border-2 border-white text-white rounded-xl"
          />
          <Button
            onClick={copyReferralLink}
            className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-white/80 text-sm mt-2">
          Поделитесь этой ссылкой с друзьями и получайте процент от их заработка в подземельях!
        </p>
      </div>

      {/* Player ID Info */}
      <div 
        className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <h3 className="text-xl text-white font-semibold mb-4">Ваш ID игрока</h3>
        <div className="flex gap-2">
          <Input
            value={accountId || ''}
            readOnly
            className="bg-white/10 border-2 border-white text-white font-mono text-sm rounded-xl"
          />
          <Button
            onClick={() => accountId && navigator.clipboard.writeText(accountId)}
            className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-white/80 text-sm mt-2">
          Это ваш уникальный ID. Поделитесь им с тем, кто вас пригласил
        </p>
      </div>

      {/* Who Referred Me */}
      {whoReferredMe && (
        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <h3 className="text-xl text-white font-semibold mb-4">Кто меня пригласил</h3>
          <div className="flex items-center justify-between p-4 bg-white/10 border-2 border-white rounded-xl">
            <div>
              <p className="text-white font-mono text-sm">
                {whoReferredMe.referrer_wallet_address}
              </p>
              <p className="text-white/80 text-xs mt-1">
                Дата приглашения: {new Date(whoReferredMe.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={() => navigator.clipboard.writeText(whoReferredMe.referrer_wallet_address)}
              size="sm"
              className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Referrer - только если еще не указан пригласивший */}
      {!whoReferredMe && (
        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <h3 className="text-xl text-white font-semibold mb-4">Указать кто вас пригласил</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Введите ID игрока, который вас пригласил"
              value={referralId}
              onChange={(e) => setReferralId(e.target.value)}
              className="bg-white/10 border-2 border-white text-white rounded-xl"
            />
            <Button
              onClick={addReferralManually}
              disabled={loading}
              className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? "Обработка..." : "Указать"}
            </Button>
          </div>
          <p className="text-white/80 text-sm mt-2">
            Если вас пригласили, но вы не перешли по ссылке, укажите ID пригласившего вас игрока
          </p>
        </div>
      )}

      {/* Referral Levels Info */}
      <div 
        className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <h3 className="text-xl text-white font-semibold mb-4">Система вознаграждений</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border-2 border-white">
            <span className="text-white font-medium">1-й уровень (прямые рефералы)</span>
            <span className="text-white font-bold">6%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border-2 border-white">
            <span className="text-white font-medium">2-й уровень (рефералы рефералов)</span>
            <span className="text-white font-bold">3%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border-2 border-white">
            <span className="text-white font-medium">3-й уровень</span>
            <span className="text-white font-bold">1.5%</span>
          </div>
        </div>
        <p className="text-white/80 text-sm mt-4">
          Вы получаете процент от ELL, которые ваши рефералы зарабатывают в подземельях
        </p>
      </div>

      {/* My Referrals List */}
      {myReferrals.length > 0 && (
        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <h3 className="text-xl text-white font-semibold mb-4">Мои рефералы</h3>
          <div className="space-y-2">
            {myReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex justify-between items-center p-3 bg-white/10 border-2 border-white rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">
                    {referral.referred_wallet_address.slice(0, 8)}...{referral.referred_wallet_address.slice(-8)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded border font-medium ${
                    referral.isWhitelisted 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {referral.isWhitelisted ? 'WL ✓' : 'Без WL'}
                  </span>
                </div>
                <span className="text-white/80 text-sm">
                  {new Date(referral.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Earnings */}
      {myEarnings.length > 0 && (
        <div 
          className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <h3 className="text-xl text-white font-semibold mb-4">Последние доходы</h3>
          <div className="space-y-2">
            {myEarnings.slice(0, 10).map((earning) => (
              <div
                key={earning.id}
                className="flex justify-between items-center p-3 bg-white/10 border-2 border-white rounded-xl"
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
                  <span className="text-white font-bold">+{earning.amount} ELL</span>
                  <div className="text-white/80 text-xs">
                    {new Date(earning.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Рейтинг рефералов и статистика */}
      <ReferralLeaderboard />
    </div>
  );
};