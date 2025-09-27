import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { Copy, Users, TrendingUp, Gift, ChevronDown, ChevronRight } from "lucide-react";

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
      case 0: return 'text-game-accent border-game-accent bg-game-accent/10';
      case 1: return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
      case 2: return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
      case 3: return 'text-green-400 border-green-400/50 bg-green-400/10';
      default: return 'text-gray-400 border-gray-400/50 bg-gray-400/10';
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between p-4 rounded-lg border ${getLevelColor(node.level)}`}>
        <div className="flex items-center space-x-3">
          {node.children.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          <div>
            <div className="font-mono font-medium">
              {node.level === 0 ? 'ВЫ' : formatWallet(node.wallet_address)}
            </div>
            <div className="text-xs opacity-75">
              {node.level === 0 ? 'Главный игрок' : `Уровень ${node.level}`}
              {node.joinDate && ` • ${new Date(node.joinDate).toLocaleDateString()}`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">
            {node.children.length} реф.
          </div>
          {node.earnings !== undefined && (
            <div className="text-sm opacity-75">
              {node.earnings} ELL
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && node.children.length > 0 && (
        <div className="ml-8 space-y-2 border-l-2 border-game-accent/20 pl-4">
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
  const { accountId } = useWallet();

  const referralLink = `https://preview--elves-dragons-adventure.lovable.app/auth?ref=${accountId}`;

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
      
      // Check whitelist status for each referral
      const referralsWithWhitelistStatus = await Promise.all(
        (myReferrals || []).map(async (referral) => {
          const { data: isWhitelisted } = await supabase
            .rpc('is_whitelisted', { p_wallet_address: referral.referred_wallet_address });
          return {
            ...referral,
            isWhitelisted: !!isWhitelisted
          };
        })
      );
      
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
          for (const referral of directReferrals) {
            const childNode: ReferralTreeNode = {
              wallet_address: referral.referred_wallet_address,
              level: node.level + 1,
              children: [],
              joinDate: referral.created_at
            };

            // Get earnings for this referral
            const { data: earnings } = await supabase
              .rpc('get_referral_earnings_by_referrer', { p_wallet_address: referral.referred_wallet_address });
            
            childNode.earnings = earnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0;

            node.children.push(childNode);
            await buildLevel(childNode, maxLevel);
          }
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
        <div 
          className="bg-game-surface/80 border border-game-accent rounded-lg p-4 cursor-pointer hover:bg-game-surface/90 transition-colors"
          onClick={openReferralTree}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-game-accent" />
            <span className="text-game-accent font-medium">Мои рефералы</span>
          </div>
          <p className="text-2xl font-bold text-white">{myReferrals.length}</p>
          <p className="text-xs text-game-accent/70 mt-1">Нажмите для просмотра дерева</p>
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

      {/* Referral Tree Dialog */}
      <Dialog open={showReferralTree} onOpenChange={setShowReferralTree}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-game-accent">Дерево рефералов</DialogTitle>
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

      {/* Who Referred Me */}
      {whoReferredMe && (
        <div className="bg-game-surface/80 border border-game-accent rounded-lg p-6 mb-6">
          <h3 className="text-xl text-game-accent mb-4">Кто меня пригласил</h3>
          <div className="flex items-center justify-between p-4 bg-game-surface border border-game-accent/30 rounded">
            <div>
              <p className="text-white font-mono text-sm">
                {whoReferredMe.referrer_wallet_address}
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Дата приглашения: {new Date(whoReferredMe.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={() => navigator.clipboard.writeText(whoReferredMe.referrer_wallet_address)}
              variant="outline"
              size="sm"
              className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-game-surface"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">
                    {referral.referred_wallet_address.slice(0, 8)}...{referral.referred_wallet_address.slice(-8)}
                  </span>
                  {!referral.isWhitelisted && (
                    <span className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded border border-yellow-600/30">
                      no wl
                    </span>
                  )}
                </div>
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