/**
 * SendNFTExample Component
 * 
 * Пример отправки NFT через nft_transfer
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Send, Wallet, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const SendNFTExample = observer(function SendNFTExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [contractId, setContractId] = useState("nft.example.near");
  const [tokenId, setTokenId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [memo, setMemo] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; txHash?: string; error?: string } | null>(null);

  const handleTransfer = useCallback(async () => {
    if (!walletStore.isConnected) {
      toast.error("Подключите кошелёк");
      return;
    }

    if (!contractId.trim() || !tokenId.trim() || !receiverId.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();
      if (!wallet) throw new Error("No wallet");

      console.log("[SendNFT] Transferring NFT...", { contractId, tokenId, receiverId });

      const txResult = await wallet.signAndSendTransaction({
        receiverId: contractId,
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "nft_transfer",
            args: {
              receiver_id: receiverId.trim(),
              token_id: tokenId.trim(),
              approval_id: null,
              memo: memo || null,
            },
            gas: "100000000000000", // 100 TGas
            deposit: "1", // 1 yoctoNEAR
          },
        }],
      });

      const outcome = txResult as { transaction?: { hash?: string } };
      const txHash = outcome.transaction?.hash || "success";

      setResult({ success: true, txHash });
      toast.success(`NFT отправлен на ${receiverId}`);
      
      // Очищаем форму
      setTokenId("");
      setReceiverId("");
      setMemo("");
    } catch (error) {
      console.error("[SendNFT] Error:", error);
      const errorMsg = error instanceof Error ? error.message : "Ошибка отправки";
      setResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [contractId, tokenId, receiverId, memo]);

  const resetAndClose = () => {
    setResult(null);
    setIsOpen(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Отправка NFT
        </CardTitle>
        <CardDescription>nft_transfer через signAndSendTransaction</CardDescription>
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
            <Label>NFT Контракт *</Label>
            <Input value={contractId} onChange={(e) => setContractId(e.target.value)} disabled={isLoading} placeholder="nft.example.near" />
          </div>
          <div className="space-y-2">
            <Label>Token ID *</Label>
            <Input value={tokenId} onChange={(e) => setTokenId(e.target.value)} disabled={isLoading} placeholder="token-123" />
          </div>
          <div className="space-y-2">
            <Label>Получатель *</Label>
            <Input value={receiverId} onChange={(e) => setReceiverId(e.target.value)} disabled={isLoading} placeholder="recipient.near" />
          </div>
          <div className="space-y-2">
            <Label>Memo (опционально)</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} disabled={isLoading} placeholder="Gift for you!" />
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button disabled={!walletStore.isConnected || !tokenId || !receiverId} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Отправить NFT
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение отправки</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Контракт:</span>
                  <span className="font-mono">{contractId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="font-mono">{tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Получатель:</span>
                  <span className="font-mono">{receiverId}</span>
                </div>
              </div>

              <Button onClick={handleTransfer} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Подтвердить отправку
                  </>
                )}
              </Button>

              {result?.success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">NFT отправлен!</span>
                  </div>
                  {result.txHash && result.txHash !== "success" && (
                    <a
                      href={`https://nearblocks.io/txns/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Посмотреть транзакцию
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={resetAndClose} className="mt-2 w-full">
                    Закрыть
                  </Button>
                </div>
              )}

              {result?.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{result.error}</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-muted-foreground">
          Deposit: 1 yoctoNEAR • Gas: 100 TGas
        </div>
      </CardContent>
    </Card>
  );
});

export default SendNFTExample;
