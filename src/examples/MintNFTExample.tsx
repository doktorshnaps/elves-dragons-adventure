/**
 * MintNFTExample Component
 * 
 * Пример минта NFT через nft_mint
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_NFT_CONTRACT = "nft.example.near";
const STORAGE_DEPOSIT = "100000000000000000000000"; // 0.1 NEAR

export const MintNFTExample = observer(function MintNFTExample() {
  const [contractId, setContractId] = useState(DEFAULT_NFT_CONTRACT);
  const [tokenId, setTokenId] = useState(`token-${Date.now()}`);
  const [title, setTitle] = useState("My NFT");
  const [description, setDescription] = useState("Awesome NFT minted via OMNI");
  const [mediaUrl, setMediaUrl] = useState("https://ipfs.io/ipfs/QmExample...");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; txHash?: string; error?: string } | null>(null);

  const handleMint = useCallback(async () => {
    if (!walletStore.isConnected || !walletStore.accountId) {
      toast.error("Подключите кошелёк");
      return;
    }

    if (!contractId.trim() || !tokenId.trim() || !title.trim()) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();
      if (!wallet) throw new Error("No wallet");

      console.log("[MintNFT] Minting NFT...", { contractId, tokenId, title });

      const txResult = await wallet.signAndSendTransaction({
        receiverId: contractId,
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "nft_mint",
            args: {
              token_id: tokenId,
              receiver_id: walletStore.accountId,
              token_metadata: {
                title,
                description: description || null,
                media: mediaUrl || null,
                copies: 1,
              },
            },
            gas: "300000000000000", // 300 TGas
            deposit: STORAGE_DEPOSIT,
          },
        }],
      });

      const outcome = txResult as { transaction?: { hash?: string } };
      const txHash = outcome.transaction?.hash || "success";

      setResult({ success: true, txHash });
      toast.success("NFT создан!");
      
      // Генерируем новый tokenId для следующего минта
      setTokenId(`token-${Date.now()}`);
    } catch (error) {
      console.error("[MintNFT] Error:", error);
      const errorMsg = error instanceof Error ? error.message : "Ошибка минта";
      setResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [contractId, tokenId, title, description, mediaUrl]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5" />
          Минт NFT
        </CardTitle>
        <CardDescription>nft_mint через signAndSendTransaction</CardDescription>
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
            <Label>NFT Контракт</Label>
            <Input value={contractId} onChange={(e) => setContractId(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label>Token ID</Label>
            <Input value={tokenId} onChange={(e) => setTokenId(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label>Название *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Media URL (IPFS/HTTP)</Label>
            <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} disabled={isLoading} placeholder="https://ipfs.io/ipfs/..." />
          </div>
        </div>

        <Button onClick={handleMint} disabled={isLoading || !walletStore.isConnected} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {isLoading ? "Создание..." : "Создать NFT"}
        </Button>

        <div className="text-xs text-muted-foreground">
          Deposit: 0.1 NEAR (storage) • Gas: 300 TGas
        </div>

        {result?.success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">NFT создан! TX: {result.txHash?.slice(0, 12)}...</span>
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

export default MintNFTExample;
