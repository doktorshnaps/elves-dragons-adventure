/**
 * BackendSendExample Component
 * 
 * Пример вызова backend Edge Function для отправки NFT с seed/nonce
 * Показывает как безопасно отправлять NFT с сервера
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Server, Wallet, CheckCircle2, XCircle, Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BackendSendResult {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  receiverId?: string;
  error?: string;
}

export const BackendSendExample = observer(function BackendSendExample() {
  const [contractId, setContractId] = useState("nft.example.near");
  const [tokenId, setTokenId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BackendSendResult | null>(null);

  const handleBackendSend = useCallback(async () => {
    if (!walletStore.isConnected) {
      toast.error("Подключите кошелёк для верификации");
      return;
    }

    if (!contractId.trim() || !tokenId.trim() || !receiverId.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log("[BackendSend] Calling Edge Function...", { contractId, tokenId, receiverId });

      // Вызываем Edge Function через Supabase
      // Edge Function использует приватный ключ сервера для отправки
      const { data, error } = await supabase.functions.invoke<BackendSendResult>("send-nft", {
        body: {
          contractId: contractId.trim(),
          tokenId: tokenId.trim(),
          receiverId: receiverId.trim(),
          // Можно добавить nonce для дополнительной безопасности
          nonce: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      });

      if (error) {
        throw new Error(error.message || "Edge Function error");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Unknown error");
      }

      console.log("[BackendSend] Success:", data);
      setResult(data);
      toast.success("NFT отправлен через сервер!");
      
      // Очищаем форму
      setTokenId("");
      setReceiverId("");
    } catch (error) {
      console.error("[BackendSend] Error:", error);
      const errorMsg = error instanceof Error ? error.message : "Ошибка сервера";
      setResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [contractId, tokenId, receiverId]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Backend отправка NFT
        </CardTitle>
        <CardDescription>Серверная отправка с seed/nonce через Edge Function</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Информация о безопасности */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-primary">Серверная подпись</p>
              <p className="text-muted-foreground">
                Приватный ключ хранится в Supabase Secrets. 
                Транзакции подписываются на сервере с проверкой nonce.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ваш кошелёк:</span>
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
            <Label>NFT Контракт (сервера) *</Label>
            <Input 
              value={contractId} 
              onChange={(e) => setContractId(e.target.value)} 
              disabled={isLoading} 
              placeholder="nft.example.near" 
            />
            <p className="text-xs text-muted-foreground">
              Контракт, на котором сервер владеет NFT
            </p>
          </div>
          <div className="space-y-2">
            <Label>Token ID *</Label>
            <Input 
              value={tokenId} 
              onChange={(e) => setTokenId(e.target.value)} 
              disabled={isLoading} 
              placeholder="token-123" 
            />
          </div>
          <div className="space-y-2">
            <Label>Получатель *</Label>
            <Input 
              value={receiverId} 
              onChange={(e) => setReceiverId(e.target.value)} 
              disabled={isLoading} 
              placeholder="winner.near" 
            />
          </div>
        </div>

        <Button 
          onClick={handleBackendSend} 
          disabled={isLoading || !walletStore.isConnected || !tokenId || !receiverId} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка через сервер...
            </>
          ) : (
            <>
              <Server className="mr-2 h-4 w-4" />
              Отправить через Backend
            </>
          )}
        </Button>

        {result?.success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">NFT отправлен!</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p>Token: {result.tokenId}</p>
              <p>Получатель: {result.receiverId}</p>
              {result.transactionHash && (
                <a
                  href={`https://nearblocks.io/txns/${result.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  TX: {result.transactionHash.slice(0, 16)}...
                </a>
              )}
            </div>
          </div>
        )}

        {result?.error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ошибка</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{result.error}</p>
          </div>
        )}

        {/* Информация о требуемых секретах */}
        <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
          <p className="font-medium">Требуемые Supabase Secrets:</p>
          <p>• NEAR_PRIVATE_KEY - ed25519:xxx...</p>
          <p>• NEAR_ACCOUNT_ID - server.near</p>
        </div>
      </CardContent>
    </Card>
  );
});

export default BackendSendExample;
