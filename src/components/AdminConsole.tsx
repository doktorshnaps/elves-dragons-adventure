import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WhitelistManager } from '@/components/admin/WhitelistManager';
import { BannedUsersManager } from '@/components/admin/BannedUsersManager';
import { WhitelistContractsManager } from '@/components/admin/WhitelistContractsManager';
import { NFTWhitelistValidator } from '@/components/admin/NFTWhitelistValidator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, DollarSign, Ban, UserCheck, Trash2 } from 'lucide-react';
import { cardDatabase } from '@/data/cardDatabase';
import { calculateCardStats } from '@/utils/cardUtils';
const ADMIN_WALLET = 'mr_bruts.tg';

export const AdminConsole = () => {
  const { accountId } = useWallet();
  const { toast } = useToast();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Check if current user is admin
  const isAdmin = accountId === ADMIN_WALLET;

  // Load maintenance status on component mount
  React.useEffect(() => {
    if (!isAdmin) return;
    
    const loadMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_maintenance_status');
        if (error) throw error;
        
        if (data) {
          setMaintenanceEnabled((data as any).is_enabled || false);
          setMaintenanceMessage((data as any).message || '');
        }
      } catch (error) {
        console.error('Error loading maintenance status:', error);
      }
    };

    loadMaintenanceStatus();
  }, [isAdmin]);

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
        case 'listcards':
          handleListCards();
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
        case 'maintenance':
          await handleMaintenanceMode(parts);
          break;
        case 'wipe':
          await handleGameWipe();
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
          const rawType = card.type || card.card_type || (card.card_data && (card.card_data.type || card.card_data.card_type)) || 'unknown';
          const normalizedType = rawType === 'hero' ? 'character' : rawType === 'dragon' ? 'pet' : rawType;
          const cardName = card.name || card.card_name || (card.card_data && (card.card_data.name || card.card_data.card_name)) || 'Безымянная карта';
          const rarity = card.rarity || card.card_rarity || (card.card_data && (card.card_data.rarity || card.card_data.card_rarity)) || 'common';
          const faction = card.faction || (card.card_data && card.card_data.faction) || 'без фракции';
          const power = card.power ?? (card.card_data && card.card_data.power) ?? 0;
          const defense = card.defense ?? (card.card_data && card.card_data.defense) ?? 0;
          const health = card.health ?? (card.card_data && card.card_data.health) ?? 0;
          const cardId = card.id || (card.card_data && card.card_data.id) || 'unknown';
          
          if (normalizedType === 'character') heroCount++;
          if (normalizedType === 'pet') dragonCount++;
          
          addOutput(`${index + 1}. [ID: ${cardId}] ${cardName}`);
          addOutput(`   Тип: ${normalizedType === 'character' ? 'Герой' : normalizedType === 'pet' ? 'Дракон' : normalizedType}`);
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
      addOutput('Использование: givecard <user_id> <card_name_or_id> [rarity]');
      addOutput('Для получения списка карт используйте команду: listcards');
      return;
    }

    const userId = parts[1];
    const cardInput = parts[2];
    const rarityInput = parts[3] || 'Обычный';

    // Поиск карты по ID (номеру) или имени
    let dbCard = null;
    
    // Проверяем, является ли ввод числом (ID карты)
    const cardId = parseInt(cardInput);
    if (!isNaN(cardId) && cardId > 0 && cardId <= cardDatabase.length) {
      dbCard = cardDatabase[cardId - 1]; // ID начинается с 1, но массив с 0
    } else {
      // Поиск по имени карты (частичное совпадение)
      dbCard = cardDatabase.find((c) => c.name.toLowerCase().includes(cardInput.toLowerCase()));
    }

    if (!dbCard) {
      addOutput(`❌ Карта "${cardInput}" не найдена. Используйте команду listcards для просмотра доступных карт.`);
      return;
    }

    const rarityAsNumber = parseInt(String(rarityInput), 10) as any;
    const stats = calculateCardStats(dbCard.name, rarityAsNumber, dbCard.type);
    
    const cardData = {
      id: `admin-${Date.now()}-${Math.random()}`,
      name: dbCard.name,
      type: dbCard.type,
      rarity: rarityAsNumber,
      faction: dbCard.faction || 'Без фракции',
      power: stats.power,
      defense: stats.defense,
      health: stats.health,
      maxHealth: stats.health,
      magic: stats.magic,
      image: dbCard.image || '/placeholder.svg',
      description: dbCard.description
    };

    const { error } = await supabase.rpc('admin_give_player_card', {
      p_user_id: userId,
      p_card_data: cardData,
      p_admin_wallet_address: accountId
    });

    if (error) {
      addOutput(`Ошибка выдачи карты: ${error.message}`);
    } else {
      addOutput(`✅ Карта "${cardData.name}" выдана игроку ${userId}`);
      addOutput(`Тип: ${cardData.type === 'character' ? 'Герой' : 'Дракон'} | Фракция: ${cardData.faction} | Редкость: ${cardData.rarity}`);
      addOutput(`Сила: ${cardData.power} | Защита: ${cardData.defense} | Здоровье: ${cardData.health} | Магия: ${cardData.magic}`);
      toast({
        title: "Карта выдана",
        description: `Карта "${cardData.name}" выдана игроку`
      });
      
      // Обновляем локальные данные игрока если это текущий пользователь
      if (accountId === 'mr_bruts.tg') {
        // Запускаем событие обновления карт для синхронизации
        const updateEvent = new CustomEvent('cardsUpdate', {
          detail: { cards: [] } // Пустой массив заставит перезагрузить данные
        });
        window.dispatchEvent(updateEvent);
        
        // Также обновляем localStorage чтобы вызвать перезагрузку
        const currentCards = JSON.parse(localStorage.getItem('gameCards') || '[]');
        localStorage.setItem('gameCards', JSON.stringify([...currentCards, cardData]));
      }
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
      
      // Обновляем локальные данные игрока если это текущий пользователь
      if (accountId === 'mr_bruts.tg') {
        // Запускаем событие обновления для синхронизации
        const updateEvent = new CustomEvent('inventoryUpdate', {
          detail: { inventory: [] } // Пустой массив заставит перезагрузить данные
        });
        window.dispatchEvent(updateEvent);
      }
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

  const handleListCards = () => {
    addOutput('=== СПИСОК ВСЕХ ДОСТУПНЫХ КАРТ ===');
    addOutput('');
    
    // Группируем карты по фракциям
    const cardsByFaction: Record<string, any[]> = {};
    
    cardDatabase.forEach((card, index) => {
      const faction = card.faction || 'Без фракции';
      if (!cardsByFaction[faction]) {
        cardsByFaction[faction] = [];
      }
      cardsByFaction[faction].push({ ...card, index: index + 1 } as any);
    });
    
    // Выводим карты по фракциям
    Object.entries(cardsByFaction).forEach(([faction, cards]) => {
      addOutput(`--- ${faction.toUpperCase()} ---`);
      
      // Группируем по типу (герои/драконы)
      const heroes = cards.filter(c => c.type === 'character');
      const pets = cards.filter(c => c.type === 'pet');
      
      if (heroes.length > 0) {
        addOutput('ГЕРОИ:');
        heroes.forEach((card: any) => {
          const stats = calculateCardStats(card.name, 1, 'character');
          addOutput(`${card.index}. ${card.name} | Сила: ${stats.power} | Защита: ${stats.defense} | Здоровье: ${stats.health} | Магия: ${stats.magic}`);
        });
      }
      
      if (pets.length > 0) {
        addOutput('ДРАКОНЫ:');
        pets.forEach((card: any) => {
          const stats = calculateCardStats(card.name, 1, 'pet');
          addOutput(`${card.index}. ${card.name} | Сила: ${stats.power} | Защита: ${stats.defense} | Здоровье: ${stats.health} | Магия: ${stats.magic}`);
        });
      }
      
      addOutput('');
    });
    
    addOutput(`ИТОГО: ${cardDatabase.length} карт`);
    addOutput('Для выдачи карты используйте: givecard <user_id> <номер_карты_или_название> [редкость]');
  };

  const handleGameWipe = async () => {
    addOutput('⚠️ ВНИМАНИЕ: Вы собираетесь удалить ВСЕ игровые данные!');
    addOutput('⚠️ Это действие НЕОБРАТИМО!');
    addOutput('⚠️ Для подтверждения введите: wipe confirm');
    
    if (command.toLowerCase() !== 'wipe confirm') {
      return;
    }

    addOutput('🔄 Запуск вайпа игры...');

    const { data, error } = await supabase.functions.invoke('game-wipe', {
      body: { adminWallet: accountId }
    });

    if (error) {
      addOutput(`❌ Ошибка вайпа: ${error.message}`);
    } else if (data?.success) {
      addOutput('✅ ВАЙП ЗАВЕРШЕН! Все игровые данные сброшены.');
      addOutput('✅ Данные администратора сохранены.');
      toast({
        title: "Вайп завершен",
        description: "Все игровые данные сброшены",
        variant: "destructive"
      });
    } else {
      addOutput(`❌ Ошибка: ${data?.error || 'Unknown error'}`);
    }
  };

  const handleMaintenanceMode = async (parts: string[]) => {
    if (parts.length < 2) {
      addOutput('Использование: maintenance <on|off> [message]');
      return;
    }

    const action = parts[1].toLowerCase();
    const message = parts.slice(2).join(' ');

    if (!['on', 'off'].includes(action)) {
      addOutput('Используйте: maintenance on или maintenance off');
      return;
    }

    const enabled = action === 'on';

    try {
      const { error } = await supabase.rpc('admin_toggle_maintenance_mode', {
        p_enabled: enabled,
        p_message: message || undefined,
        p_admin_wallet_address: accountId
      });

      if (error) throw error;

      setMaintenanceEnabled(enabled);
      if (message) setMaintenanceMessage(message);

      addOutput(`Режим технических работ: ${enabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
      if (enabled && message) {
        addOutput(`Сообщение: ${message}`);
      }

      toast({
        title: "Режим технических работ обновлен",
        description: `Режим ${enabled ? 'включен' : 'выключен'}`,
        variant: enabled ? "destructive" : "default"
      });
    } catch (error: any) {
      addOutput(`Ошибка: ${error.message}`);
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
    addOutput('givecard <user_id> <name_or_id> [rarity] - Выдать карту игроку');
    addOutput('giveitem <user_id> <name> [quantity] [type] - Выдать предмет игроку');
    addOutput('removecard <user_id> <card_id> - Удалить карту у игрока');
    addOutput('removeitem <user_id> <item_id> - Удалить предмет у игрока');
    addOutput('listcards - Показать список всех доступных карт с номерами');
    addOutput('ban <user_id> <reason> - Забанить игрока');
    addOutput('unban <user_id> - Разбанить игрока');
    addOutput('maintenance <on|off> [message] - Управление режимом тех. работ');
    addOutput('wipe confirm - ВАЙП: Сбросить все игровые данные (НЕОБРАТИМО!)');
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
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Terminal className="w-5 h-5" />
            Админ Консоль
          </CardTitle>
          <div className={`text-xs px-2 py-1 rounded border font-medium ${
            maintenanceEnabled 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-green-500/20 text-green-400 border-green-500/30'
          }`}>
            Тех. работы: {maintenanceEnabled ? 'ВКЛ' : 'ВЫКЛ'}
          </div>
        </div>
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
          <Button
            onClick={() => setCommand('wipe confirm')}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            ВАЙП
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
          <p>• find mr_bruts.tg - найти игрока по кошельку</p>
          <p>• info c45dcc01-8e2e-405f-81b9-54771f0717fa - информация об игроке</p>
          <p>• addbalance c45dcc01-8e2e-405f-81b9-54771f0717fa 5000 - добавить баланс</p>
          <p>• setbalance c45dcc01-8e2e-405f-81b9-54771f0717fa 10000 - установить баланс</p>
          <p>• ban c45dcc01-8e2e-405f-81b9-54771f0717fa Использование читов - забанить игрока</p>
          <p>• unban c45dcc01-8e2e-405f-81b9-54771f0717fa - разбанить игрока</p>
          <p>• cards c45dcc01-8e2e-405f-81b9-54771f0717fa - посмотреть карты игрока</p>
          <p>• inventory c45dcc01-8e2e-405f-81b9-54771f0717fa - посмотреть инвентарь игрока</p>
          <p>• givecard c45dcc01-8e2e-405f-81b9-54771f0717fa Илиона Легендарный - выдать карту</p>
          <p>• removecard c45dcc01-8e2e-405f-81b9-54771f0717fa card-id - удалить карту</p>
          <p>• giveitem c45dcc01-8e2e-405f-81b9-54771f0717fa "Зелье лечения" 5 consumable - выдать предмет</p>
          <p>• removeitem c45dcc01-8e2e-405f-81b9-54771f0717fa item-id 3 - удалить предмет</p>
          <p>• listcards - список всех доступных карт</p>
          <p>• maintenance on Обновление системы - включить тех. работы</p>
          <p>• maintenance off - выключить тех. работы</p>
          <p>• help - показать справку</p>
          <p>• clear - очистить консоль</p>
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
          <WhitelistContractsManager />
          <NFTWhitelistValidator />
    </div>
  );
};