/**
 * TransferExample Component
 * 
 * Пример перевода USDT с использованием @hot-labs/near-connect
 * Демонстрирует wallet.signAndSendTransaction для FT transfer
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

// USDT контракт на NEAR mainnet
const USDT_CONTRACT_ID = "usdt.tether-token.near";
const USDT_DECIMALS = 6;

// Преобразование человекочитаемой суммы в минимальные единицы
function toMinimalUnits(amount: string, decimals: number): string {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return whole + paddedFraction;
}

interface TransferState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  txHash: string | null;
  errorMessage: string | null;
}

export const TransferExample = observer(function TransferExample() {
  const [receiverId, setReceiverId] = useState("petya.near");
  const [amount, setAmount] = useState("1");
  const [memo, setMemo] = useState("Payment via OMNI");
  
  const [transferState, setTransferState] = useState<TransferState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    txHash: null,
    errorMessage: null,
  });

  // Сброс состояния
  const resetState = useCallback(() => {
    setTransferState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      txHash: null,
      errorMessage: null,
    });
  }, []);

  // Основная функция перевода
  const handleTransfer = useCallback(async () => {
    // Проверка подключения кошелька
    if (!walletStore.isConnected || !walletStore.accountId) {
      toast.error("Сначала подключите кошелёк");
      return;
    }

    // Валидация ввода
    if (!receiverId.trim()) {
      toast.error("Введите адрес получателя");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }

    resetState();
    setTransferState(prev => ({ ...prev, isLoading: true }));

    try {
      const connector = walletStore.getConnector();
      if (!connector) {
        throw new Error("Connector not initialized");
      }

      const wallet = await connector.wallet();
      if (!wallet) {
        throw new Error("No wallet connected");
      }

      console.log("[TransferExample] Starting USDT transfer...");
      console.log("[TransferExample] Receiver:", receiverId);
      console.log("[TransferExample] Amount:", amount, "USDT");
      console.log("[TransferExample] Memo:", memo);

      // Конвертируем сумму в минимальные единицы (6 decimals для USDT)
      const amountInUnits = toMinimalUnits(amount, USDT_DECIMALS);
      console.log("[TransferExample] Amount in units:", amountInUnits);

      // Используем signAndSendTransaction для вызова ft_transfer
      // msg параметр используется для cross-contract calls (DEX, мосты)
      const result = await wallet.signAndSendTransaction({
        receiverId: USDT_CONTRACT_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer",
              args: {
                receiver_id: receiverId.trim(),
                amount: amountInUnits,
                memo: memo || null,
                // msg используется для cross-contract calls
                // Например, для swap на REF Finance:
                // msg: JSON.stringify({ 
                //   force: 0, 
                //   actions: [{ pool_id: 123, token_in: "usdt.tether-token.near", amount_in: amountInUnits, token_out: "wrap.near", min_amount_out: "0" }]
                // }),
              },
              gas: "100000000000000", // 100 TGas
              deposit: "1", // 1 yoctoNEAR для ft_transfer
            },
          },
        ],
      });

      console.log("[TransferExample] Transfer result:", result);

      // Извлекаем hash транзакции из FinalExecutionOutcome
      let txHash = "success";
      if (result && typeof result === "object") {
        const outcome = result as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } };
        txHash = outcome.transaction?.hash || outcome.transaction_outcome?.id || "success";
      }

      setTransferState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        txHash,
        errorMessage: null,
      });

      toast.success(
        `Успешно отправлено ${amount} USDT на ${receiverId}`,
        {
          description: txHash !== "success" ? `TX: ${txHash.slice(0, 8)}...` : undefined,
          duration: 5000,
        }
      );

    } catch (error) {
      console.error("[TransferExample] Transfer error:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Неизвестная ошибка";

      setTransferState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        txHash: null,
        errorMessage,
      });

      toast.error("Ошибка перевода", {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [receiverId, amount, memo, resetState]);

  // Подключение кошелька
  const handleConnect = useCallback(() => {
    walletStore.connect();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Перевод USDT
        </CardTitle>
        <CardDescription>
          Пример использования signAndSendTransaction с msg параметром
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Статус кошелька */}
        <div className="p-3 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Кошелёк:</span>
            {walletStore.isConnected ? (
              <span className="text-sm font-mono text-primary">
                {walletStore.accountId}
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnect}>
                <Wallet className="mr-2 h-4 w-4" />
                Подключить
              </Button>
            )}
          </div>
        </div>

        {/* Форма перевода */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="receiver">Получатель</Label>
            <Input
              id="receiver"
              placeholder="petya.near"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              disabled={transferState.isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (USDT)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={transferState.isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">Memo (опционально)</Label>
            <Input
              id="memo"
              placeholder="Payment via OMNI"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={transferState.isLoading}
            />
          </div>
        </div>

        {/* Кнопка отправки */}
        <Button
          onClick={handleTransfer}
          disabled={transferState.isLoading || !walletStore.isConnected}
          className="w-full"
        >
          {transferState.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Отправить {amount} USDT
            </>
          )}
        </Button>

        {/* Результат */}
        {transferState.isSuccess && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Перевод выполнен!</span>
            </div>
            {transferState.txHash && transferState.txHash !== "success" && (
              <a
                href={`https://nearblocks.io/txns/${transferState.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary mt-1 block"
              >
                TX: {transferState.txHash.slice(0, 16)}...
              </a>
            )}
          </div>
        )}

        {transferState.isError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ошибка</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transferState.errorMessage}
            </p>
          </div>
        )}

        {/* Информация */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• Контракт: {USDT_CONTRACT_ID}</p>
          <p>• Gas: 100 TGas</p>
          <p>• Deposit: 1 yoctoNEAR</p>
        </div>
      </CardContent>
    </Card>
  );
});

export default TransferExample;
