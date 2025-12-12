/**
 * TransferExample Component
 * 
 * Пример перевода USDT с использованием @hot-labs/near-connect
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const USDT_CONTRACT_ID = "usdt.tether-token.near";
const USDT_DECIMALS = 6;

function toMinimalUnits(amount: string, decimals: number): string {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return whole + paddedFraction;
}

export const TransferExample = observer(function TransferExample() {
  const [receiverId, setReceiverId] = useState("petya.near");
  const [amount, setAmount] = useState("1");
  const [memo, setMemo] = useState("Payment via OMNI");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; txHash?: string; error?: string } | null>(null);

  const handleTransfer = useCallback(async () => {
    if (!walletStore.isConnected) {
      toast.error("Подключите кошелёк");
      return;
    }

    if (!receiverId.trim() || parseFloat(amount) <= 0) {
      toast.error("Проверьте данные");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();
      if (!wallet) throw new Error("No wallet");

      const amountInUnits = toMinimalUnits(amount, USDT_DECIMALS);

      const txResult = await wallet.signAndSendTransaction({
        receiverId: USDT_CONTRACT_ID,
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "ft_transfer",
            args: {
              receiver_id: receiverId.trim(),
              amount: amountInUnits,
              memo: memo || null,
            },
            gas: "100000000000000",
            deposit: "1",
          },
        }],
      });

      const outcome = txResult as { transaction?: { hash?: string } };
      const txHash = outcome.transaction?.hash || "success";

      setResult({ success: true, txHash });
      toast.success(`Отправлено ${amount} USDT`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Ошибка";
      setResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [receiverId, amount, memo]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Перевод USDT
        </CardTitle>
        <CardDescription>ft_transfer через signAndSendTransaction</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Кошелёк:</span>
          {walletStore.isConnected ? (
            <span className="text-sm font-mono text-primary">{walletStore.accountId}</span>
          ) : (
            <Button variant="outline" size="sm" onClick={() => walletStore.connect()}>
              <Wallet className="mr-2 h-4 w-4" />
              Подключить
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Получатель</Label>
            <Input value={receiverId} onChange={(e) => setReceiverId(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label>Сумма (USDT)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label>Memo</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} disabled={isLoading} />
          </div>
        </div>

        <Button onClick={handleTransfer} disabled={isLoading || !walletStore.isConnected} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {isLoading ? "Отправка..." : `Отправить ${amount} USDT`}
        </Button>

        {result?.success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Успешно! TX: {result.txHash?.slice(0, 12)}...</span>
          </div>
        )}

        {result?.error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{result.error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default TransferExample;
