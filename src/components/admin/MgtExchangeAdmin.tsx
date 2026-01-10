import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, Eye, Search, RefreshCw } from "lucide-react";

interface ExchangeRequest {
  id: string;
  wallet_address: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

interface MgtClaim {
  id: string;
  wallet_address: string;
  amount: number;
  claim_type: string;
  source_item_id: string | null;
  created_at: string;
}

export const MgtExchangeAdmin = () => {
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchWallet, setSearchWallet] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all exchange requests
  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['adminMgtExchangeRequests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('mgt_exchange_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ExchangeRequest[];
    },
  });

  // Fetch mGT claims for selected wallet
  const { data: playerClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ['adminPlayerMgtClaims', selectedRequest?.wallet_address],
    queryFn: async () => {
      if (!selectedRequest?.wallet_address) return [];
      const { data, error } = await supabase
        .from('mgt_claims')
        .select('*')
        .eq('wallet_address', selectedRequest.wallet_address)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as MgtClaim[];
    },
    enabled: !!selectedRequest?.wallet_address,
  });

  // Fetch player's current mGT balance
  const { data: playerBalance } = useQuery({
    queryKey: ['adminPlayerMgtBalance', selectedRequest?.wallet_address],
    queryFn: async () => {
      if (!selectedRequest?.wallet_address) return 0;
      const { data, error } = await supabase
        .from('game_data')
        .select('mgt_balance')
        .eq('wallet_address', selectedRequest.wallet_address)
        .single();
      
      if (error) return 0;
      return Number(data?.mgt_balance) || 0;
    },
    enabled: !!selectedRequest?.wallet_address,
  });

  const handleApprove = async () => {
    if (!selectedRequest || !accountId) return;
    
    setIsProcessing(true);
    try {
      // First deduct mGT from player
      const { data: gameData, error: fetchError } = await supabase
        .from('game_data')
        .select('mgt_balance')
        .eq('wallet_address', selectedRequest.wallet_address)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = Number(gameData?.mgt_balance) || 0;
      const newBalance = currentBalance - selectedRequest.amount;

      if (newBalance < 0) {
        toast({
          title: "Ошибка",
          description: "У игрока недостаточно mGT",
          variant: "destructive",
        });
        return;
      }

      // Update player's mGT balance
      const { error: updateError } = await supabase
        .from('game_data')
        .update({ mgt_balance: newBalance })
        .eq('wallet_address', selectedRequest.wallet_address);

      if (updateError) throw updateError;

      // Update request status
      const { error: requestError } = await supabase
        .from('mgt_exchange_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          processed_by: accountId,
          processed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      toast({
        title: "Заявка одобрена",
        description: `${selectedRequest.amount.toLocaleString()} mGT списано с ${selectedRequest.wallet_address}`,
      });

      queryClient.invalidateQueries({ queryKey: ['adminMgtExchangeRequests'] });
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось одобрить заявку",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !accountId) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('mgt_exchange_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || null,
          processed_by: accountId,
          processed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Заявка отклонена",
        description: "mGT остались у игрока",
      });

      queryClient.invalidateQueries({ queryKey: ['adminMgtExchangeRequests'] });
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Ожидает</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">Одобрено</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">Отклонено</Badge>;
      default:
        return null;
    }
  };

  const getClaimTypeLabel = (type: string) => {
    switch (type) {
      case 'box_opening':
        return '📦 Открытие сундука';
      case 'quest_reward':
        return '🎯 Награда за квест';
      case 'admin_grant':
        return '👑 Выдано админом';
      default:
        return type;
    }
  };

  const filteredRequests = requests?.filter(r => 
    !searchWallet || r.wallet_address.toLowerCase().includes(searchWallet.toLowerCase())
  );

  const totalClaimedAmount = playerClaims?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-purple-300">Заявки на обмен mGT → GT</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchRequests()}
            className="border-purple-500/50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Обновить
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск по кошельку..."
              value={searchWallet}
              onChange={(e) => setSearchWallet(e.target.value)}
              className="pl-10 bg-black/30 border-purple-500/30"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-black/30">
              <TabsTrigger value="pending">Ожидают</TabsTrigger>
              <TabsTrigger value="approved">Одобрены</TabsTrigger>
              <TabsTrigger value="rejected">Отклонены</TabsTrigger>
              <TabsTrigger value="all">Все</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Requests list */}
        {requestsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : filteredRequests && filteredRequests.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRequests.map((req) => (
              <div 
                key={req.id}
                className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-white">{req.wallet_address}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(req.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div className="text-right mr-4">
                  <div className="text-lg font-bold text-purple-300">
                    {Number(req.amount).toLocaleString()} mGT
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(req);
                    setAdminNotes(req.admin_notes || "");
                  }}
                  className="border-purple-500/50"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Нет заявок
          </div>
        )}

        {/* Request details modal */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="bg-black/95 border-purple-500/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purple-300">
                Детали заявки на обмен
              </DialogTitle>
              <DialogDescription>
                {selectedRequest?.wallet_address}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                {/* Request info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-gray-400">Запрошено</div>
                    <div className="text-xl font-bold text-purple-300">
                      {Number(selectedRequest.amount).toLocaleString()} mGT
                    </div>
                  </div>
                  <div className="p-3 bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-gray-400">Текущий баланс</div>
                    <div className="text-xl font-bold text-white">
                      {playerBalance?.toLocaleString() || 0} mGT
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Статус:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {/* mGT Claims history */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">История получения mGT</h4>
                    <span className="text-sm text-purple-300">
                      Всего получено: {totalClaimedAmount.toLocaleString()} mGT
                    </span>
                  </div>
                  
                  {claimsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : playerClaims && playerClaims.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-black/30 rounded-lg p-2">
                      {playerClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-2 text-sm border-b border-purple-500/10 last:border-0">
                          <div>
                            <span className="text-gray-300">{getClaimTypeLabel(claim.claim_type)}</span>
                            <div className="text-xs text-gray-500">
                              {new Date(claim.created_at).toLocaleString('ru-RU')}
                            </div>
                          </div>
                          <span className="font-medium text-green-400">
                            +{Number(claim.amount).toLocaleString()} mGT
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Нет записей о получении mGT
                    </div>
                  )}
                </div>

                {/* Admin notes */}
                {selectedRequest.status === 'pending' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Заметка администратора</label>
                    <Textarea
                      placeholder="Опционально..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="bg-black/30 border-purple-500/30"
                    />
                  </div>
                )}

                {/* Existing notes */}
                {selectedRequest.admin_notes && selectedRequest.status !== 'pending' && (
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="text-sm text-gray-400">Заметка админа:</div>
                    <div className="text-white">{selectedRequest.admin_notes}</div>
                  </div>
                )}

                {/* Action buttons */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing || (playerBalance || 0) < selectedRequest.amount}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Одобрить и списать mGT
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isProcessing}
                      variant="destructive"
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Отклонить
                    </Button>
                  </div>
                )}

                {/* Processed info */}
                {selectedRequest.processed_by && (
                  <div className="text-sm text-gray-500 text-center">
                    Обработано: {selectedRequest.processed_by} • {selectedRequest.processed_at && new Date(selectedRequest.processed_at).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
