// Тестовая панель для HotConnector (wibe3)
// Позволяет протестировать основные функции: подключение, переводы, NFT

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { initWibe3 } from '@/lib/wibe3';
import { Wallet, Send, Image, LogOut, RefreshCw, Coins } from 'lucide-react';
import { OmniToken } from '@hot-labs/kit';

// Token options for UI
const tokenOptions = [
  { key: 'USDC', token: OmniToken.USDC, label: 'USDC' },
  { key: 'USDT', token: OmniToken.USDT, label: 'USDT' },
  { key: 'NEAR', token: OmniToken.NEAR, label: 'NEAR' },
];

const Wibe3TestPanel: React.FC = () => {
  const { toast } = useToast();
  const [wibe3, setWibe3] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Wallet state
  const [nearAddress, setNearAddress] = useState<string | null>(null);
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [tonAddress, setTonAddress] = useState<string | null>(null);
  
  // Transfer form
  const [transferRecipient, setTransferRecipient] = useState('petya.near');
  const [transferAmount, setTransferAmount] = useState('1');
  const [transferToken, setTransferToken] = useState(OmniToken.USDC);
  
  // NFT form
  const [nftContractId, setNftContractId] = useState('test.nfts.tg');
  const [nftTokenId, setNftTokenId] = useState('13');
  const [nftRecipient, setNftRecipient] = useState('my_wallet.near');

  // Initialize wibe3
  useEffect(() => {
    const init = async () => {
      try {
        const connector = await initWibe3();
        setWibe3(connector);
        
        // Update addresses from connected wallets
        updateWalletAddresses(connector);
        
        console.log('✅ Wibe3 initialized:', connector);
      } catch (error) {
        console.error('❌ Failed to init wibe3:', error);
        toast({
          title: 'Ошибка инициализации',
          description: 'Не удалось инициализировать HotConnector',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const updateWalletAddresses = (connector: any) => {
    if (!connector) return;
    
    setNearAddress(connector.near?.address || null);
    setEvmAddress(connector.evm?.address || null);
    setSolanaAddress(connector.solana?.address || null);
    setTonAddress(connector.ton?.address || null);
  };

  // 1. Подключение кошелька
  const handleConnect = async () => {
    if (!wibe3) return;
    
    setActionLoading('connect');
    try {
      await wibe3.connect();
      updateWalletAddresses(wibe3);
      
      toast({
        title: 'Кошелёк подключен',
        description: `Адрес: ${wibe3.priorityWallet?.address || 'Неизвестно'}`,
      });
    } catch (error: any) {
      console.error('Connect error:', error);
      toast({
        title: 'Ошибка подключения',
        description: error.message || 'Не удалось подключить кошелёк',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Отключение кошелька
  const handleDisconnect = async () => {
    if (!wibe3) return;
    
    setActionLoading('disconnect');
    try {
      await wibe3.disconnect();
      updateWalletAddresses(wibe3);
      
      toast({
        title: 'Кошелёк отключен',
      });
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Ошибка отключения',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Сделать перевод (Omni Chain / Intents)
  // Используем intentsBuilder().transfer().depositAndExecute()
  const handleTransfer = async () => {
    if (!wibe3) return;
    
    setActionLoading('transfer');
    try {
      const wallet = wibe3.priorityWallet;
      if (!wallet) {
        throw new Error('Сначала подключите кошелёк');
      }
      
      const amount = parseFloat(transferAmount);
      
      // Используем intentsBuilder для создания transfer intent
      // depositAndExecute откроет UI для депозита если нужно
      const txHash = await wibe3.intentsBuilder(wallet)
        .transfer({
          amount: amount,
          token: transferToken,
          recipient: transferRecipient,
          // ВАЖНО: msg приводит к ft_transfer_call и требует, чтобы получатель был контрактом.
          // Для обычного аккаунта используем memo.
          memo: JSON.stringify({
            type: 'game_payment',
            timestamp: Date.now(),
          }),
        })
        .depositAndExecute({
          title: `Перевод ${amount}`,
          message: `Отправка на ${transferRecipient}`,
        });
      
      console.log('Transfer completed:', txHash);
      
      toast({
        title: 'Перевод выполнен',
        description: `Транзакция: ${txHash}`,
      });
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: 'Ошибка перевода',
        description: error.message || 'Не удалось выполнить перевод',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Минт NFT (authCall intent)
  const handleMintNFT = async () => {
    if (!wibe3) return;
    
    setActionLoading('mint');
    try {
      const wallet = wibe3.priorityWallet;
      if (!wallet) {
        throw new Error('Подключите кошелёк');
      }
      
      // NFT mint via authCall
      const mintMsg = {
        msg: wallet.omniAddress || wallet.address,
        token_owner_id: wallet.omniAddress || wallet.address,
        token_id: `nft_${Date.now()}`,
        token_metadata: {
          title: 'Test NFT',
          description: 'NFT minted via HotConnector',
          media: 'https://placekitten.com/200/200',
        },
      };
      
      const txHash = await wibe3.intentsBuilder(wallet)
        .authCall({
          contractId: nftContractId,
          msg: JSON.stringify(mintMsg),
          attachNear: BigInt(1e23), // 0.1 NEAR for storage
          tgas: 50,
        })
        .depositAndExecute({
          title: 'Минт NFT',
          message: `Создание NFT в ${nftContractId}`,
        });
      
      console.log('NFT minted:', txHash);
      
      toast({
        title: 'NFT создан',
        description: `Token ID: ${mintMsg.token_id}`,
      });
    } catch (error: any) {
      console.error('Mint error:', error);
      toast({
        title: 'Ошибка минта NFT',
        description: error.message || 'Не удалось создать NFT',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Отправка NFT
  const handleSendNFT = async () => {
    if (!wibe3) return;
    
    setActionLoading('sendNft');
    try {
      const wallet = wibe3.priorityWallet;
      if (!wallet) {
        throw new Error('Подключите кошелёк');
      }
      
      // NFT transfer via authCall
      const transferMsg = {
        receiver_id: nftRecipient,
        token_id: nftTokenId,
        msg: '',
      };
      
      const txHash = await wibe3.intentsBuilder(wallet)
        .authCall({
          contractId: nftContractId,
          msg: JSON.stringify({
            method: 'nft_transfer',
            args: transferMsg,
          }),
          attachNear: BigInt(1), // 1 yoctoNEAR for security
          tgas: 30,
        })
        .depositAndExecute({
          title: 'Отправка NFT',
          message: `${nftContractId}:${nftTokenId} → ${nftRecipient}`,
        });
      
      console.log('NFT sent:', txHash);
      
      toast({
        title: 'NFT отправлен',
        description: `${nftContractId}:${nftTokenId} → ${nftRecipient}`,
      });
    } catch (error: any) {
      console.error('Send NFT error:', error);
      toast({
        title: 'Ошибка отправки NFT',
        description: error.message || 'Не удалось отправить NFT',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // JWT Authentication
  const handleGetJWT = async () => {
    if (!wibe3) return;
    
    setActionLoading('jwt');
    try {
      const wallet = wibe3.priorityWallet;
      if (!wallet) {
        throw new Error('Подключите кошелёк');
      }
      
      const jwt = await wallet.auth();
      console.log('JWT token:', jwt);
      
      toast({
        title: 'JWT получен',
        description: 'Токен сохранён в консоли',
      });
    } catch (error: any) {
      console.error('JWT error:', error);
      toast({
        title: 'Ошибка получения JWT',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Инициализация HotConnector...</span>
        </CardContent>
      </Card>
    );
  }

  const priorityWallet = wibe3?.priorityWallet;
  const isConnected = !!priorityWallet;

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto p-4">
      {/* Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            HotConnector (wibe3) Test Panel
          </CardTitle>
          <CardDescription>
            Тестирование функций: подключение, переводы, NFT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connected Wallets */}
          <div className="flex flex-wrap gap-2">
            {nearAddress && (
              <Badge variant="secondary">NEAR: {nearAddress.slice(0, 20)}...</Badge>
            )}
            {evmAddress && (
              <Badge variant="secondary">EVM: {evmAddress.slice(0, 10)}...</Badge>
            )}
            {solanaAddress && (
              <Badge variant="secondary">SOL: {solanaAddress.slice(0, 10)}...</Badge>
            )}
            {tonAddress && (
              <Badge variant="secondary">TON: {tonAddress.slice(0, 10)}...</Badge>
            )}
            {!isConnected && (
              <Badge variant="outline">Кошелёк не подключен</Badge>
            )}
          </div>
          
          {/* Connect/Disconnect Buttons */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={handleConnect}
                disabled={actionLoading === 'connect'}
              >
                {actionLoading === 'connect' ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Подключить кошелёк
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={handleGetJWT}
                  disabled={!!actionLoading}
                >
                  Получить JWT
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={actionLoading === 'disconnect'}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Отключить
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Перевод токенов (Omni Chain)
            </CardTitle>
            <CardDescription>
              Кросс-чейн переводы через NEAR Intents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Получатель</Label>
                <Input 
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="petya.near"
                />
              </div>
              <div className="space-y-2">
                <Label>Сумма</Label>
                <Input 
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {tokenOptions.map((opt) => (
                <Button
                  key={opt.key}
                  variant={transferToken === opt.token ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransferToken(opt.token)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            
            <Button 
              onClick={handleTransfer}
              disabled={!!actionLoading}
              className="w-full"
            >
              {actionLoading === 'transfer' ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Coins className="w-4 h-4 mr-2" />
              )}
              Отправить {transferAmount} {tokenOptions.find(t => t.token === transferToken)?.label || 'токенов'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* NFT Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              NFT операции
            </CardTitle>
            <CardDescription>
              Минт и отправка NFT через authCall
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Контракт NFT</Label>
                <Input 
                  value={nftContractId}
                  onChange={(e) => setNftContractId(e.target.value)}
                  placeholder="test.nfts.tg"
                />
              </div>
              <div className="space-y-2">
                <Label>Token ID</Label>
                <Input 
                  value={nftTokenId}
                  onChange={(e) => setNftTokenId(e.target.value)}
                  placeholder="13"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Получатель NFT</Label>
              <Input 
                value={nftRecipient}
                onChange={(e) => setNftRecipient(e.target.value)}
                placeholder="my_wallet.near"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleMintNFT}
                disabled={!!actionLoading}
                variant="secondary"
              >
                {actionLoading === 'mint' ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Image className="w-4 h-4 mr-2" />
                )}
                Создать NFT
              </Button>
              
              <Button 
                onClick={handleSendNFT}
                disabled={!!actionLoading}
              >
                {actionLoading === 'sendNft' ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Отправить {nftContractId}:{nftTokenId}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Wibe3TestPanel;
