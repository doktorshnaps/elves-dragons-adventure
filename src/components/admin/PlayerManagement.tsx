import React, { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, DollarSign, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const PlayerManagement = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  
  // Wipe player state
  const [wipeWallet, setWipeWallet] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeDialog, setShowWipeDialog] = useState(false);
  
  // Add balance state
  const [balanceWallet, setBalanceWallet] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isAddingBalance, setIsAddingBalance] = useState(false);

  const handleWipePlayer = async () => {
    if (!wipeWallet.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите адрес кошелька игрока",
        variant: "destructive",
      });
      return;
    }

    setIsWiping(true);
    try {
      const { data, error } = await supabase.rpc('admin_wipe_player', {
        p_target_wallet_address: wipeWallet.trim(),
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Данные игрока ${wipeWallet} были полностью очищены`,
      });
      
      setWipeWallet('');
      setShowWipeDialog(false);
    } catch (error: any) {
      console.error('Error wiping player:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось очистить данные игрока",
        variant: "destructive",
      });
    } finally {
      setIsWiping(false);
    }
  };

  const handleAddBalance = async () => {
    if (!balanceWallet.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите адрес кошелька игрока",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректное количество ELL (положительное число)",
        variant: "destructive",
      });
      return;
    }

    setIsAddingBalance(true);
    try {
      const { data, error } = await supabase.rpc('admin_add_balance', {
        p_target_wallet_address: balanceWallet.trim(),
        p_amount: amount,
        p_admin_wallet_address: accountId,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Начислено ${amount} ELL игроку ${balanceWallet}`,
      });
      
      setBalanceWallet('');
      setBalanceAmount('');
    } catch (error: any) {
      console.error('Error adding balance:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось начислить ELL",
        variant: "destructive",
      });
    } finally {
      setIsAddingBalance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Balance Card */}
      <Card className="bg-black/50 border-2 border-white backdrop-blur-sm" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5" />
            Начислить ELL игроку
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance-wallet" className="text-white">
              Адрес кошелька игрока
            </Label>
            <Input
              id="balance-wallet"
              value={balanceWallet}
              onChange={(e) => setBalanceWallet(e.target.value)}
              placeholder="player.near или player.tg"
              className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance-amount" className="text-white">
              Количество ELL
            </Label>
            <Input
              id="balance-amount"
              type="number"
              min="1"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              placeholder="100"
              className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <Button
            onClick={handleAddBalance}
            disabled={isAddingBalance || !balanceWallet.trim() || !balanceAmount}
            className="w-full"
            variant="menu"
          >
            {isAddingBalance ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Начисление...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Начислить ELL
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Wipe Player Card */}
      <Card className="bg-black/50 border-2 border-red-500 backdrop-blur-sm" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trash2 className="h-5 w-5 text-red-500" />
            Очистить данные игрока (ВАЙП)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wipe-wallet" className="text-white">
              Адрес кошелька игрока
            </Label>
            <Input
              id="wipe-wallet"
              value={wipeWallet}
              onChange={(e) => setWipeWallet(e.target.value)}
              placeholder="player.near или player.tg"
              className="bg-black/30 border-red-500/50 text-white placeholder:text-white/50"
            />
          </div>

          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md">
            <p className="text-sm text-red-400">
              <strong>ВНИМАНИЕ:</strong> Это действие полностью удалит все данные игрока:
              баланс, карты, предметы, здания, квесты и достижения. Это действие необратимо!
            </p>
          </div>

          <Button
            onClick={() => setShowWipeDialog(true)}
            disabled={isWiping || !wipeWallet.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            variant="destructive"
          >
            {isWiping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Очистка...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить данные игрока
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showWipeDialog} onOpenChange={setShowWipeDialog}>
        <AlertDialogContent className="bg-game-dark border-2 border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Подтвердите очистку данных игрока
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Вы собираетесь полностью удалить все данные игрока{' '}
              <span className="font-bold text-red-400">{wipeWallet}</span>.
              <br /><br />
              Это действие удалит:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Весь баланс ELL, золото и ресурсы</li>
                <li>Все карты и предметы</li>
                <li>Все здания и улучшения</li>
                <li>Прогресс квестов и достижений</li>
                <li>Записи в медпункте и кузнице</li>
              </ul>
              <br />
              <strong className="text-red-400">Это действие необратимо!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWipePlayer}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isWiping}
            >
              {isWiping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Очистка...
                </>
              ) : (
                'Подтвердить очистку'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
