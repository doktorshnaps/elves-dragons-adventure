import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, History, AlertCircle } from "lucide-react";
import mgtTokenImg from "@/assets/items/mgt-token.webp";

interface MgtExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

const MIN_EXCHANGE_AMOUNT = 2000;

export const MgtExchangeModal = ({ isOpen, onClose, currentBalance }: MgtExchangeModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();

  // Fetch user's exchange history
  const { data: exchangeHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['mgtExchangeHistory', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('mgt_exchange_requests')
        .select('*')
        .eq('wallet_address', accountId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!accountId,
  });

  const hasPendingRequest = exchangeHistory?.some(r => r.status === 'pending');

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Кошелек не подключен",
        variant: "destructive",
      });
      return;
    }

    if (numAmount < MIN_EXCHANGE_AMOUNT) {
      toast({
        title: "Недостаточно mGT",
        description: `Минимальная сумма для обмена: ${MIN_EXCHANGE_AMOUNT.toLocaleString()} mGT`,
        variant: "destructive",
      });
      return;
    }

    if (numAmount > currentBalance) {
      toast({
        title: "Недостаточно средств",
        description: `У вас только ${currentBalance.toLocaleString()} mGT`,
        variant: "destructive",
      });
      return;
    }

    if (hasPendingRequest) {
      toast({
        title: "Есть активная заявка",
        description: "Дождитесь обработки предыдущей заявки",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('submit_mgt_exchange_request', {
        p_wallet_address: accountId,
        p_amount: numAmount,
      });

      if (error) throw error;

      toast({
        title: "Заявка отправлена!",
        description: `Запрос на обмен ${numAmount.toLocaleString()} mGT отправлен администратору`,
      });

      queryClient.invalidateQueries({ queryKey: ['mgtExchangeHistory'] });
      setAmount("");
      onClose();
    } catch (error) {
      console.error('Error submitting exchange request:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заявку",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Ожидает</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Одобрено</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Отклонено</span>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-2 border-purple-500/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img src={mgtTokenImg} alt="mGT" className="w-6 h-6 rounded-full" />
            Обмен mGT → GT
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Запросите обмен mGT токенов на GT. Минимальная сумма: {MIN_EXCHANGE_AMOUNT.toLocaleString()} mGT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current balance */}
          <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
            <div className="text-sm text-gray-400">Ваш баланс mGT</div>
            <div className="text-2xl font-bold text-purple-300">{currentBalance.toLocaleString()}</div>
          </div>

          {/* Warning if not enough */}
          {currentBalance < MIN_EXCHANGE_AMOUNT && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 rounded-lg border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Недостаточно mGT. Нужно минимум {MIN_EXCHANGE_AMOUNT.toLocaleString()}</span>
            </div>
          )}

          {/* Pending request warning */}
          {hasPendingRequest && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>У вас есть активная заявка на рассмотрении</span>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">Сумма для обмена</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder={`Мин. ${MIN_EXCHANGE_AMOUNT}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white"
                disabled={currentBalance < MIN_EXCHANGE_AMOUNT || hasPendingRequest}
              />
              <Button
                variant="outline"
                onClick={() => setAmount(String(currentBalance))}
                disabled={currentBalance < MIN_EXCHANGE_AMOUNT || hasPendingRequest}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-900/30"
              >
                Всё
              </Button>
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || currentBalance < MIN_EXCHANGE_AMOUNT || hasPendingRequest || !amount}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              "Запросить обмен"
            )}
          </Button>

          {/* History section */}
          {exchangeHistory && exchangeHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <History className="w-4 h-4" />
                История заявок
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {exchangeHistory.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 bg-black/30 rounded text-sm">
                    <div>
                      <span className="text-white font-medium">{Number(req.amount).toLocaleString()} mGT</span>
                      <span className="text-gray-500 ml-2">
                        {new Date(req.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
