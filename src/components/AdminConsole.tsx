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
        case 'info':
          await handleGetUserInfo(parts);
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
      addOutput('Использование: addbalance <user_id> <amount>');
      return;
    }

    const userId = parts[1];
    const amount = parseInt(parts[2]);

    if (isNaN(amount)) {
      addOutput('Количество должно быть числом');
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { error } = await supabase.rpc('admin_add_balance_by_id', {
      p_target_user_id: userId,
      p_amount: amount,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка добавления баланса: ${error.message}`);
    } else {
      addOutput(`✅ Добавлено ${amount} ELL игроку ${userId}`);
      toast({
        title: "Баланс обновлен",
        description: `Добавлено ${amount} ELL игроку`
      });
    }
  };

  const handleBanUser = async (parts: string[]) => {
    if (parts.length < 3) {
      addOutput('Использование: ban <user_id> <reason>');
      return;
    }

    const userId = parts[1];
    const reason = parts.slice(2).join(' ');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { error } = await supabase.rpc('admin_ban_user_by_id', {
      p_target_user_id: userId,
      p_reason: reason,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка бана: ${error.message}`);
    } else {
      addOutput(`🚫 Игрок ${userId} забанен. Причина: ${reason}`);
      toast({
        title: "Игрок забанен",
        description: `Игрок забанен за: ${reason}`,
        variant: "destructive"
      });
    }
  };

  const handleUnbanUser = async (parts: string[]) => {
    if (parts.length !== 2) {
      addOutput('Использование: unban <user_id>');
      return;
    }

    const userId = parts[1];

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { error } = await supabase.rpc('admin_unban_user_by_id', {
      p_target_user_id: userId,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка разбана: ${error.message}`);
    } else {
      addOutput(`✅ Игрок ${userId} разбанен`);
      toast({
        title: "Игрок разбанен",
        description: `Игрок разбанен`
      });
    }
  };

  const handleGetUserInfo = async (parts: string[]) => {
    if (parts.length !== 2) {
      addOutput('Использование: info <user_id>');
      return;
    }

    const userId = parts[1];

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { data, error } = await supabase.rpc('admin_get_user_info', {
      p_user_id: userId,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка получения информации: ${error.message}`);
    } else if (data && typeof data === 'object' && data !== null) {
      const userInfo = data as any;
      addOutput('=== ИНФОРМАЦИЯ О ИГРОКЕ ===');
      addOutput(`UUID: ${userInfo.user_id}`);
      addOutput(`Кошелек: ${userInfo.wallet_address}`);
      addOutput(`Баланс: ${userInfo.balance} ELL`);
      addOutput(`Уровень: ${userInfo.account_level}`);
      addOutput(`Забанен: ${userInfo.is_banned ? 'Да' : 'Нет'}`);
      addOutput(`Создан: ${new Date(userInfo.created_at).toLocaleString()}`);
      addOutput('==========================');
    }
  };

  const showHelp = () => {
    addOutput('=== АДМИНСКИЕ КОМАНДЫ ===');
    addOutput('addbalance <user_id> <amount> - Добавить ELL на баланс игрока');
    addOutput('ban <user_id> <reason> - Забанить игрока');
    addOutput('unban <user_id> - Разбанить игрока');
    addOutput('info <user_id> - Показать информацию о игроке');
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
          <Button
            onClick={() => setCommand('info ')}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Terminal className="w-4 h-4" />
            Информация
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
          <p>• addbalance 550e8400-e29b-41d4-a716-446655440000 5000</p>
          <p>• ban 550e8400-e29b-41d4-a716-446655440000 Использование читов</p>
          <p>• unban 550e8400-e29b-41d4-a716-446655440000</p>
          <p>• info 550e8400-e29b-41d4-a716-446655440000</p>
        </div>
      </CardContent>
    </Card>
  );
};