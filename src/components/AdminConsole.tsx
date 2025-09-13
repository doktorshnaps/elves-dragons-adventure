import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WhitelistManager } from '@/components/admin/WhitelistManager';
import { BannedUsersManager } from '@/components/admin/BannedUsersManager';
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
        case 'find':
          await handleFindUser(parts);
          break;
        case 'cards':
          await handleViewCards(parts);
          break;
        case 'inventory':
          await handleViewInventory(parts);
          break;
        case 'setbalance':
          await handleSetBalance(parts);
          break;
        case 'givecard':
          await handleGiveCard(parts);
          break;
        case 'giveitem':
          await handleGiveItem(parts);
          break;
        case 'removecard':
          await handleRemoveCard(parts);
          break;
        case 'removeitem':
          await handleRemoveItem(parts);
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

  const handleFindUser = async (parts: string[]) => {
    if (parts.length !== 2) {
      addOutput('Использование: find <wallet_address>');
      return;
    }

    const walletAddress = parts[1];

    const { data, error } = await supabase.rpc('admin_find_user_by_wallet', {
      p_wallet_address: walletAddress,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка поиска: ${error.message}`);
    } else if (data && data.length > 0) {
      const player = data[0];
      addOutput('=== НАЙДЕН ИГРОК ===');
      addOutput(`UUID: ${player.user_id}`);
      addOutput(`Кошелек: ${player.wallet_address}`);
      addOutput(`Баланс: ${player.balance} ELL`);
      addOutput(`Уровень: ${player.account_level}`);
      addOutput(`Создан: ${new Date(player.created_at).toLocaleString()}`);
      addOutput('==================');
    } else {
      addOutput('Игрок с таким кошельком не найден');
    }
  };

  const handleViewCards = async (parts: string[]) => {
    if (parts.length !== 2) {
      addOutput('Использование: cards <user_id>');
      return;
    }

    const userId = parts[1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { data, error } = await supabase.rpc('admin_get_player_cards', {
      p_user_id: userId,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка получения карт: ${error.message}`);
    } else {
      const cards = data as any[];
      addOutput(`=== КАРТЫ ИГРОКА (${cards.length}) ===`);
      if (cards.length === 0) {
        addOutput('У игрока нет карт');
      } else {
        let heroCount = 0;
        let dragonCount = 0;
        cards.forEach((card, index) => {
          const cardType = card.type || 'unknown';
          const cardName = card.name || 'Безымянная карта';
          const rarity = card.rarity || 'common';
          const faction = card.faction || 'без фракции';
          const power = card.power || 0;
          const defense = card.defense || 0;
          const health = card.health || 0;
          const cardId = card.id || 'unknown';
          
          if (cardType === 'character') heroCount++;
          if (cardType === 'pet') dragonCount++;
          
          addOutput(`${index + 1}. [ID: ${cardId}] ${cardName}`);
          addOutput(`   Тип: ${cardType === 'character' ? 'Герой' : cardType === 'pet' ? 'Дракон' : cardType}`);
          addOutput(`   Фракция: ${faction} | Редкость: ${rarity}`);
          addOutput(`   Сила: ${power} | Защита: ${defense} | Здоровье: ${health}`);
          addOutput('   ---');
        });
        addOutput(`ИТОГО: Героев - ${heroCount}, Драконов - ${dragonCount}`);
      }
      addOutput('=========================');
    }
  };

  const handleViewInventory = async (parts: string[]) => {
    if (parts.length !== 2) {
      addOutput('Использование: inventory <user_id>');
      return;
    }

    const userId = parts[1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { data, error } = await supabase.rpc('admin_get_player_inventory', {
      p_user_id: userId,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка получения инвентаря: ${error.message}`);
    } else {
      const items = data as any[];
      addOutput(`=== ИНВЕНТАРЬ ИГРОКА (${items.length}) ===`);
      if (items.length === 0) {
        addOutput('Инвентарь пуст');
      } else {
        items.forEach((item, index) => {
          const itemName = item.name || 'Безымянный предмет';
          const itemType = item.type || 'unknown';
          const itemId = item.id || 'unknown';
          const quantity = item.quantity || 1;
          const value = item.value || 0;
          const description = item.description || 'Нет описания';
          
          addOutput(`${index + 1}. [ID: ${itemId}] ${itemName}`);
          addOutput(`   Тип: ${itemType} | Количество: ${quantity} | Ценность: ${value}`);
          addOutput(`   Описание: ${description}`);
          addOutput('   ---');
        });
      }
      addOutput('============================');
    }
  };

  const handleSetBalance = async (parts: string[]) => {
    if (parts.length !== 3) {
      addOutput('Использование: setbalance <user_id> <amount>');
      return;
    }

    const userId = parts[1];
    const amount = parseInt(parts[2]);

    if (isNaN(amount) || amount < 0) {
      addOutput('Количество должно быть положительным числом');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { error } = await supabase.rpc('admin_set_player_balance', {
      p_user_id: userId,
      p_balance: amount,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка установки баланса: ${error.message}`);
    } else {
      addOutput(`✅ Баланс игрока ${userId} установлен на ${amount} ELL`);
      toast({
        title: "Баланс установлен",
        description: `Баланс установлен на ${amount} ELL`
      });
    }
  };

  const handleGiveCard = async (parts: string[]) => {
    if (parts.length < 3) {
      addOutput('Использование: givecard <user_id> <card_name> [rarity] [type]');
      return;
    }

    const userId = parts[1];
    const cardName = parts[2];
    const rarity = parts[3] || 'common';
    const cardType = parts[4] || 'hero';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const cardData = {
      id: `admin-${Date.now()}-${Math.random()}`,
      name: cardName,
      type: cardType,
      rarity: rarity,
      power: 10,
      defense: 10,
      health: 100,
      maxHealth: 100,
      image: '/placeholder.svg',
      description: `Карта выдана администратором`
    };

    const { error } = await supabase.rpc('admin_give_player_card', {
      p_user_id: userId,
      p_card_data: cardData,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка выдачи карты: ${error.message}`);
    } else {
      addOutput(`✅ Карта "${cardName}" выдана игроку ${userId}`);
      toast({
        title: "Карта выдана",
        description: `Карта "${cardName}" выдана игроку`
      });
    }
  };

  const handleGiveItem = async (parts: string[]) => {
    if (parts.length < 3) {
      addOutput('Использование: giveitem <user_id> <item_name> [quantity] [type]');
      return;
    }

    const userId = parts[1];
    const itemName = parts[2];
    const quantity = parseInt(parts[3]) || 1;
    const itemType = parts[4] || 'consumable';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const itemData = {
      id: `admin-item-${Date.now()}-${Math.random()}`,
      name: itemName,
      type: itemType,
      quantity: quantity,
      description: `Предмет выдан администратором`,
      image: '/placeholder.svg'
    };

    const { error } = await supabase.rpc('admin_give_player_item', {
      p_user_id: userId,
      p_item_data: itemData,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка выдачи предмета: ${error.message}`);
    } else {
      addOutput(`✅ Предмет "${itemName}" x${quantity} выдан игроку ${userId}`);
      toast({
        title: "Предмет выдан",
        description: `Предмет "${itemName}" x${quantity} выдан игроку`
      });
    }
  };

  const handleRemoveCard = async (parts: string[]) => {
    if (parts.length !== 3) {
      addOutput('Использование: removecard <user_id> <card_id>');
      return;
    }

    const userId = parts[1];
    const cardId = parts[2];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { error } = await supabase.rpc('admin_remove_player_card', {
      p_user_id: userId,
      p_card_id: cardId,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка удаления карты: ${error.message}`);
    } else {
      addOutput(`✅ Карта "${cardId}" удалена у игрока ${userId}`);
      toast({
        title: "Карта удалена",
        description: `Карта удалена у игрока`,
        variant: "destructive"
      });
    }
  };

  const handleRemoveItem = async (parts: string[]) => {
    if (parts.length !== 3) {
      addOutput('Использование: removeitem <user_id> <item_id>');
      return;
    }

    const userId = parts[1];
    const itemId = parts[2];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      addOutput('Неверный формат UUID игрока');
      return;
    }

    const { error } = await supabase.rpc('admin_remove_player_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка удаления предмета: ${error.message}`);
    } else {
      addOutput(`✅ Предмет "${itemId}" удален у игрока ${userId}`);
      toast({
        title: "Предмет удален",
        description: `Предмет удален у игрока`,
        variant: "destructive"
      });
    }
  };

  const showHelp = () => {
    addOutput('=== АДМИНСКИЕ КОМАНДЫ ===');
    addOutput('find <wallet_address> - Найти игрока по кошельку и получить UUID');
    addOutput('info <user_id> - Показать информацию о игроке');
    addOutput('cards <user_id> - Просмотреть карты игрока');
    addOutput('inventory <user_id> - Просмотреть инвентарь игрока');
    addOutput('addbalance <user_id> <amount> - Добавить ELL на баланс игрока');
    addOutput('setbalance <user_id> <amount> - Установить баланс игрока');
    addOutput('givecard <user_id> <name> [rarity] [type] - Выдать карту игроку');
    addOutput('giveitem <user_id> <name> [quantity] [type] - Выдать предмет игроку');
    addOutput('removecard <user_id> <card_id> - Удалить карту у игрока');
    addOutput('removeitem <user_id> <item_id> - Удалить предмет у игрока');
    addOutput('ban <user_id> <reason> - Забанить игрока');
    addOutput('unban <user_id> - Разбанить игрока');
    addOutput('clear - Очистить консоль');
    addOutput('help - Показать эту справку');
    addOutput('===============================');
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
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
          <Button
            onClick={() => setCommand('cards ')}
            variant="outline"
            size="sm"
          >
            Карты
          </Button>
          <Button
            onClick={() => setCommand('inventory ')}
            variant="outline"
            size="sm"
          >
            Инвентарь
          </Button>
          <Button
            onClick={() => setCommand('setbalance  1000')}
            variant="outline"
            size="sm"
          >
            Установить баланс
          </Button>
          <Button
            onClick={() => setCommand('givecard  ')}
            variant="outline"
            size="sm"
          >
            Выдать карту
          </Button>
          <Button
            onClick={() => setCommand('giveitem  ')}
            variant="outline"
            size="sm"
          >
            Выдать предмет
          </Button>
          <Button
            onClick={() => setCommand('removecard  ')}
            variant="outline"
            size="sm"
          >
            Удалить карту
          </Button>
          <Button
            onClick={() => setCommand('removeitem  ')}
            variant="outline"
            size="sm"
          >
            Удалить предмет
          </Button>
          <Button
            onClick={() => setCommand('info ')}
            variant="outline"
            size="sm"
          >
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
          <p>• find mr_bruts.tg</p>
          <p>• addbalance c45dcc01-8e2e-405f-81b9-54771f0717fa 5000</p>
          <p>• ban c45dcc01-8e2e-405f-81b9-54771f0717fa Использование читов</p>
          <p>• unban c45dcc01-8e2e-405f-81b9-54771f0717fa</p>
          <p>• info c45dcc01-8e2e-405f-81b9-54771f0717fa</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminConsoleWithWhitelist = () => {
  return (
    <div className="space-y-6">
      <AdminConsole />
      <WhitelistManager />
      <BannedUsersManager />
    </div>
  );
};