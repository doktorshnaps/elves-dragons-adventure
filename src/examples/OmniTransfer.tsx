/**
 * Example 4: OMNI Token Transfer
 * 
 * Demonstrates how to transfer tokens using OMNI.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOmniConnector, type OmniWallet } from '@/lib/web3';

interface TransferFormProps {
  wallet: OmniWallet;
}

export function OmniTransfer({ wallet }: TransferFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const connector = getOmniConnector();
      if (!connector) throw new Error('Connector not initialized');

      // Get USDT token (or any token you need)
      const token = connector.tokens.find(t => t.symbol === 'USDT') || connector.tokens[0];
      
      if (!token) {
        throw new Error('No tokens available');
      }

      // Convert amount to proper decimals
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, token.decimals)));

      // Calculate transfer fee
      const fee = await wallet.transferFee(token, recipient, amountBigInt);
      
      console.log('Transfer fee:', fee);

      // Execute transfer
      const txHash = await wallet.transfer({
        token,
        receiver: recipient,
        amount: amountBigInt,
        gasFee: fee,
      });

      toast({
        title: 'Перевод успешен',
        description: `TX: ${txHash.slice(0, 10)}...`,
      });

      // Reset form
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
      toast({
        title: 'Ошибка перевода',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Token Transfer</CardTitle>
        <CardDescription>
          Send tokens to another address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="0x... or account.near"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Wrapper component that checks for connected wallet
export function OmniTransferExample() {
  const connector = getOmniConnector();
  const wallet = connector?.near || connector?.evm;

  if (!wallet) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Token Transfer</CardTitle>
          <CardDescription>
            Connect your wallet first to make transfers
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <OmniTransfer wallet={wallet} />;
}

export default OmniTransferExample;
