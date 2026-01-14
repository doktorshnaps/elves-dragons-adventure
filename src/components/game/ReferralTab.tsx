import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Copy, Users, TrendingUp, Gift, ChevronDown, ChevronRight, Link, Award, Info } from "lucide-react";
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
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between p-3 rounded-xl border ${getLevelColor(node.level)}`}>
        <div className="flex items-center space-x-2">
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
            <span className="font-mono text-sm text-white">
              {node.level === 0 ? 'ВЫ' : formatWallet(node.wallet_address)}
            </span>
            <div className="text-xs text-white/60">
              {node.level === 0 ? 'Главный' : `Ур. ${node.level}`}
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="font-bold text-white">{node.children.length} реф.</div>
          {node.earnings !== undefined && node.earnings > 0 && (
            <div className="text-xs text-white/70">{node.earnings} ELL</div>
          )}
        </div>
      </div>
      
      {isExpanded && node.children.length > 0 && (
        <div className="ml-6 space-y-1 border-l border-white/20 pl-3">
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
  const [showRewardInfo, setShowRewardInfo] = useState(false);
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

      const { data: myReferrals, error: referralsError } = await supabase
        .rpc('get_referrals_by_referrer', { p_wallet_address: accountId });

      if (referralsError) throw referralsError;
      
      const referralsWithWhitelistStatus = (myReferrals || []).map((referral) => ({
        ...referral,
        isWhitelisted: true
      }));
      
      const { data: whoReferredMeData } = await supabase
        .rpc('get_referrer_for_wallet', { p_wallet_address: accountId });

      setMyReferrals(referralsWithWhitelistStatus);
      setWhoReferredMe(whoReferredMeData?.[0] || null);

      const { data: earnings, error: earningsError } = await supabase
        .rpc('get_referral_earnings_by_referrer', { p_wallet_address: accountId });

      if (earningsError) throw earningsError;
      setMyEarnings(earnings || []);

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
          const childNodesPromises = directReferrals.map(async (referral) => {
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

          const childNodes = await Promise.all(childNodesPromises);
          node.children = childNodes;

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
      handleSuccess('Ссылка скопирована!');
    } catch (error) {
      handleError(error, 'Ошибка копирования');
    }
  };

  const copyPlayerId = async () => {
    if (!accountId) return;
    try {
      await navigator.clipboard.writeText(accountId);
      handleSuccess('ID скопирован!');
    } catch (error) {
      handleError(error, 'Ошибка копирования');
    }
  };

  const addReferralManually = async () => {
    if (!referralId.trim()) {
      toast({ title: "Ошибка", description: "Введите ID игрока", variant: "destructive" });
      return;
    }

    if (!accountId || referralId.trim() === accountId) {
      toast({ title: "Ошибка", description: "Нельзя указать себя", variant: "destructive" });
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

      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message?: string; code?: string };
        if (result.success) {
          handleSuccess('Пригласивший указан!');
          setReferralId('');
          fetchReferralData();
        } else {
          toast({
            title: "Ошибка",
            description: result.code === 'already_referred' ? 'У вас уже есть реферер' : String(result.message),
            variant: "destructive"
          });
        }
      } else {
        handleSuccess('Пригласивший указан!');
        setReferralId('');
        fetchReferralData();
      }
    } catch (error: any) {
      handleError(error, 'Ошибка');
    } finally {
      setLoading(false);
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
    <div className="space-y-4">
      {/* Компактная статистика */}
      <div className="grid grid-cols-3 gap-2">
        <div 
          className="bg-black/50 border border-white/50 rounded-2xl p-3 cursor-pointer hover:bg-black/70 transition-all backdrop-blur-sm"
          onClick={openReferralTree}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-white/80" />
            <span className="text-xs text-white/70">Рефералы</span>
          </div>
          <p className="text-xl font-bold text-white">{myReferrals.length}</p>
        </div>

        <div className="bg-black/50 border border-white/50 rounded-2xl p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-white/70">Доход</span>
          </div>
          <p className="text-xl font-bold text-white">{totalEarnings}</p>
        </div>

        <div 
          className="bg-black/50 border border-white/50 rounded-2xl p-3 backdrop-blur-sm cursor-pointer hover:bg-black/70"
          onClick={() => setShowRewardInfo(true)}
        >
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-white/70">Уровни</span>
          </div>
          <p className="text-xl font-bold text-white">3</p>
        </div>
      </div>

      {/* Tabs для разделения контента */}
      <Tabs defaultValue="invite" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-white/50 backdrop-blur-sm rounded-2xl h-10">
          <TabsTrigger value="invite" className="text-white text-xs data-[state=active]:bg-white/20 rounded-xl">
            <Link className="w-3 h-3 mr-1" />
            Пригласить
          </TabsTrigger>
          <TabsTrigger value="my" className="text-white text-xs data-[state=active]:bg-white/20 rounded-xl">
            <Users className="w-3 h-3 mr-1" />
            Мои
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-white text-xs data-[state=active]:bg-white/20 rounded-xl">
            <Award className="w-3 h-3 mr-1" />
            Рейтинг
          </TabsTrigger>
        </TabsList>

        {/* Вкладка приглашений */}
        <TabsContent value="invite" className="mt-4 space-y-3">
          {/* Реферальная ссылка */}
          <div className="bg-black/50 border border-white/50 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Link className="h-4 w-4 text-white" />
              <span className="text-sm text-white font-medium">Реферальная ссылка</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-white/10 border-white/30 text-white text-xs rounded-xl h-9"
              />
              <Button onClick={copyReferralLink} size="sm" className="bg-white text-black hover:bg-white/90 rounded-xl h-9 px-3">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* ID игрока */}
          <div className="bg-black/50 border border-white/50 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-white" />
              <span className="text-sm text-white font-medium">Ваш ID</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={accountId || ''}
                readOnly
                className="bg-white/10 border-white/30 text-white font-mono text-xs rounded-xl h-9"
              />
              <Button onClick={copyPlayerId} size="sm" className="bg-white text-black hover:bg-white/90 rounded-xl h-9 px-3">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Кто пригласил / Указать реферера */}
          {whoReferredMe ? (
            <div className="bg-black/50 border border-green-500/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white font-medium">Вас пригласил</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/10 rounded-xl">
                <span className="text-xs text-white font-mono truncate">
                  {whoReferredMe.referrer_wallet_address.slice(0, 10)}...{whoReferredMe.referrer_wallet_address.slice(-6)}
                </span>
                <span className="text-xs text-white/60">
                  {new Date(whoReferredMe.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-black/50 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white font-medium">Указать реферера</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="ID пригласившего"
                  value={referralId}
                  onChange={(e) => setReferralId(e.target.value)}
                  className="bg-white/10 border-white/30 text-white text-xs rounded-xl h-9"
                />
                <Button onClick={addReferralManually} disabled={loading} size="sm" className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl h-9 px-4">
                  {loading ? "..." : "OK"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Вкладка моих рефералов */}
        <TabsContent value="my" className="mt-4 space-y-3">
          {/* Список рефералов */}
          {myReferrals.length > 0 ? (
            <div className="bg-black/50 border border-white/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white font-medium">Мои рефералы ({myReferrals.length})</span>
                <Button onClick={openReferralTree} size="sm" variant="ghost" className="text-xs text-white/70 h-7">
                  Дерево →
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {myReferrals.slice(0, 10).map((referral) => (
                  <div key={referral.id} className="flex justify-between items-center p-2 bg-white/10 rounded-xl">
                    <span className="text-xs text-white font-mono">
                      {referral.referred_wallet_address.slice(0, 8)}...{referral.referred_wallet_address.slice(-6)}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {myReferrals.length > 10 && (
                  <p className="text-xs text-center text-white/50">...и ещё {myReferrals.length - 10}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-black/50 border border-white/30 rounded-2xl p-6 backdrop-blur-sm text-center">
              <Users className="h-8 w-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/60">У вас пока нет рефералов</p>
              <p className="text-xs text-white/40 mt-1">Поделитесь ссылкой с друзьями</p>
            </div>
          )}

          {/* Последние доходы */}
          {myEarnings.length > 0 && (
            <div className="bg-black/50 border border-white/50 rounded-2xl p-4 backdrop-blur-sm">
              <span className="text-sm text-white font-medium mb-3 block">Последние доходы</span>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {myEarnings.slice(0, 5).map((earning) => (
                  <div key={earning.id} className="flex justify-between items-center p-2 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-400">{getLevelPercentage(earning.level)}</span>
                      <span className="text-xs text-white/70 font-mono">
                        {earning.referred_wallet_address.slice(0, 6)}...
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white">+{earning.amount} ELL</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Вкладка рейтинга */}
        <TabsContent value="leaderboard" className="mt-4">
          <ReferralLeaderboard />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showReferralTree} onOpenChange={setShowReferralTree}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto bg-black/95 border border-white/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Дерево рефералов</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
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

      <Dialog open={showRewardInfo} onOpenChange={setShowRewardInfo}>
        <DialogContent className="max-w-sm bg-black/95 border border-white/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-400" />
              Система наград
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between p-3 bg-white/10 rounded-xl">
              <span className="text-sm text-white">1 уровень</span>
              <span className="text-sm font-bold text-green-400">6%</span>
            </div>
            <div className="flex justify-between p-3 bg-white/10 rounded-xl">
              <span className="text-sm text-white">2 уровень</span>
              <span className="text-sm font-bold text-green-400">3%</span>
            </div>
            <div className="flex justify-between p-3 bg-white/10 rounded-xl">
              <span className="text-sm text-white">3 уровень</span>
              <span className="text-sm font-bold text-green-400">1.5%</span>
            </div>
            <p className="text-xs text-white/60 mt-3">
              Вы получаете процент от ELL, заработанных вашими рефералами в подземельях
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
