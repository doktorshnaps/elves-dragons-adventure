import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, DollarSign, Ban, UserCheck } from 'lucide-react';

const ADMIN_WALLET = 'mr_bruts.tg';

export const AdminConsole = () => {
  const { accountId } = useWallet();
  const { toast } = useToast();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = accountId === ADMIN_WALLET;

  if (!isAdmin) {
    return null;
  }

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text]);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    setLoading(true);
    addOutput(`> ${command}`);
    
    try {
      const parts = command.trim().split(' ');
      const cmd = parts[0].toLowerCase();

      switch (cmd) {
        case 'addbalance':
          await handleAddBalance(parts);
          break;
        case 'ban':
          await handleBanUser(parts);
          break;
        case 'unban':
          await handleUnbanUser(parts);
          break;
        case 'help':
          showHelp();
          break;
        case 'clear':
          setOutput([]);
          break;
        default:
          addOutput(`Неизвестная команда: ${cmd}. Введите 'help' для справки.`);
      }
    } catch (error: any) {
      addOutput(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const handleAddBalance = async (parts: string[]) => {
    if (parts.length !== 3) {
      addOutput('Использование: addbalance <wallet_address> <amount>');
      return;
    }

    const walletAddress = parts[1];
    const amount = parseInt(parts[2]);

    if (isNaN(amount)) {
      addOutput('Количество должно быть числом');
      return;
    }

    const { error } = await supabase.rpc('admin_add_balance', {
      p_target_wallet_address: walletAddress,
      p_amount: amount,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка добавления баланса: ${error.message}`);
    } else {
      addOutput(`✅ Добавлено ${amount} ELL игроку ${walletAddress}`);
      toast({
        title: "Баланс обновлен",
        description: `Добавлено ${amount} ELL игроку ${walletAddress}`
      });
    }
  };

  const handleBanUser = async (parts: string[]) => {
    if (parts.length < 3) {
      addOutput('Использование: ban <wallet_address> <reason>');
      return;
    }

    const walletAddress = parts[1];
    const reason = parts.slice(2).join(' ');

    const { error } = await supabase.rpc('admin_ban_user', {
      p_target_wallet_address: walletAddress,
      p_reason: reason,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка бана: ${error.message}`);
    } else {
      addOutput(`🚫 Игрок ${walletAddress} забанен. Причина: ${reason}`);
      toast({
        title: "Игрок забанен",
        description: `${walletAddress} забанен за: ${reason}`,
        variant: "destructive"
      });
    }
  };

  const handleUnbanUser = async (parts: string[]) => {
    if (parts.length !== 2) {
      addOutput('Использование: unban <wallet_address>');
      return;
    }

    const walletAddress = parts[1];

    const { error } = await supabase.rpc('admin_unban_user', {
      p_target_wallet_address: walletAddress,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка разбана: ${error.message}`);
    } else {
      addOutput(`✅ Игрок ${walletAddress} разбанен`);
      toast({
        title: "Игрок разбанен",
        description: `${walletAddress} разбанен`
      });
    }
  };

  const showHelp = () => {
    addOutput('=== АДМИНСКИЕ КОМАНДЫ ===');
    addOutput('addbalance <wallet_address> <amount> - Добавить ELL на баланс игрока');
    addOutput('ban <wallet_address> <reason> - Забанить игрока');
    addOutput('unban <wallet_address> - Разбанить игрока');
    addOutput('clear - Очистить консоль');
    addOutput('help - Показать эту справку');
    addOutput('========================');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Terminal className="w-5 h-5" />
          Админ Консоль
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            onClick={() => setCommand('addbalance  1000')}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <DollarSign className="w-4 h-4" />
            Добавить 1000 ELL
          </Button>
          <Button
            onClick={() => setCommand('ban  Нарушение правил')}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Ban className="w-4 h-4" />
            Забанить игрока
          </Button>
          <Button
            onClick={() => setCommand('unban ')}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <UserCheck className="w-4 h-4" />
            Разбанить игрока
          </Button>
        </div>

        {/* Console Output */}
        <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto font-mono text-sm">
          {output.length === 0 ? (
            <p className="text-muted-foreground">
              Добро пожаловать в админ консоль! Введите 'help' для списка команд.
            </p>
          ) : (
            output.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))
          )}
        </div>

        {/* Command Input */}
        <div className="flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите команду..."
            className="font-mono"
            disabled={loading}
          />
          <Button 
            onClick={executeCommand} 
            disabled={loading || !command.trim()}
          >
            {loading ? 'Выполнение...' : 'Выполнить'}
          </Button>
        </div>

        {/* Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Примеры команд:</strong></p>
          <p>• addbalance wallet.near 5000</p>
          <p>• ban cheater.near Использование читов</p>
          <p>• unban player.near</p>
        </div>
      </CardContent>
    </Card>
  );
};