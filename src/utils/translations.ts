export type Language = 'ru' | 'en';

export const translations = {
  ru: {
    // Menu
    menu: {
      title: 'Главное меню',
      dungeon: 'Подземелье',
      shop: 'Магический магазин',
      marketplace: 'Торговая площадка',
      grimoire: 'Гримуар',
      inventory: 'Инвентарь',
      team: 'Команда',
      quest: 'Бабло',
      shelter: 'Убежище',
      disconnectWallet: 'Отключить кошелек',
      balance: 'Баланс:',
      connected: 'Подключен',
      connectWallet: 'Подключить кошелек',
      connecting: 'Подключение...'
    },
    // Shop
    shop: {
      title: 'Магазин',
      backToMenu: 'Вернуться в меню',
      refillIn: 'Пополнение через:',
      soldOut: 'РАСПРОДАНО',
      buy: 'Купить',
      soldOutButton: 'Распродано',
      price: 'Цена:',
      requiredLevel: 'Требуется уровень:',
      power: 'Сила:',
      defense: 'Защита:',
      health: 'Здоровье:',
      loading: 'Загрузка...',
      // Purchase messages
      purchaseSuccess: 'Покупка успешна',
      cardPackBought: 'Колода карт куплена!',
      cardPackDescription: 'Колода карт добавлена в инвентарь. Откройте её чтобы получить карту!',
      boughtItem: 'Вы купили',
      // Error messages
      error: 'Ошибка',
      connectWallet: 'Подключите кошелек для покупок',
      itemSoldOut: 'Товар закончился',
      itemSoldOutDescription: 'Этот товар временно закончился. Ждите пополнения!',
      insufficientFunds: 'Недостаточно средств',
      insufficientFundsDescription: 'У вас недостаточно ELL для покупки',
      purchaseError: 'Ошибка покупки',
      purchaseErrorDescription: 'Произошла ошибка при покупке товара'
    },
    // Game general
    game: {
      level: 'Уровень',
      balance: 'Баланс',
      currency: 'ELL'
    },
    // Inventory
    inventory: {
      title: 'Инвентарь',
      balance: 'Баланс:',
      eggMoved: 'Яйцо перемещено в инкубатор',
      eggMovedDescription: 'Нажмите \'Начать инкубацию\' у яйца сверху инвентаря',
      itemUsed: 'Предмет использован',
      itemUsedDescription: 'был использован',
      itemUsedDescriptionRemaining: 'был использован (осталось',
      cannotSell: 'Нельзя продать',
      itemNotInInventory: 'Этот предмет уже отсутствует в вашем инвентаре',
      noPacks: 'Нет колод',
      noPacksToSell: 'У вас нет закрытых колод для продажи'
    },
    // GameHeader
    gameHeader: {
      openShop: 'Открыть магазин',
      shop: 'Магазин',
      dungeons: 'Подземелья',
      statistics: 'Статистика',
      information: 'Информация'
    }
  },
  en: {
    // Menu
    menu: {
      title: 'Main Menu',
      dungeon: 'Dungeon',
      shop: 'Magic Shop',
      marketplace: 'Marketplace',
      grimoire: 'Grimoire',
      inventory: 'Inventory',
      team: 'Team',
      quest: 'Quest',
      shelter: 'Shelter',
      disconnectWallet: 'Disconnect Wallet',
      balance: 'Balance:',
      connected: 'Connected',
      connectWallet: 'Connect Wallet',
      connecting: 'Connecting...'
    },
    // Shop
    shop: {
      title: 'Shop',
      backToMenu: 'Back to Menu',
      refillIn: 'Refill in:',
      soldOut: 'SOLD OUT',
      buy: 'Buy',
      soldOutButton: 'Sold Out',
      price: 'Price:',
      requiredLevel: 'Required level:',
      power: 'Power:',
      defense: 'Defense:',
      health: 'Health:',
      loading: 'Loading...',
      // Purchase messages
      purchaseSuccess: 'Purchase successful',
      cardPackBought: 'Card pack bought!',
      cardPackDescription: 'Card pack added to inventory. Open it to get a card!',
      boughtItem: 'You bought',
      // Error messages
      error: 'Error',
      connectWallet: 'Connect wallet to make purchases',
      itemSoldOut: 'Item sold out',
      itemSoldOutDescription: 'This item is temporarily sold out. Wait for restocking!',
      insufficientFunds: 'Insufficient funds',
      insufficientFundsDescription: 'You don\'t have enough ELL to purchase',
      purchaseError: 'Purchase error',
      purchaseErrorDescription: 'An error occurred while purchasing the item'
    },
    // Game general
    game: {
      level: 'Level',
      balance: 'Balance',
      currency: 'ELL'
    },
    // Inventory
    inventory: {
      title: 'Inventory',
      balance: 'Balance:',
      eggMoved: 'Egg moved to incubator',
      eggMovedDescription: 'Click \'Start incubation\' on the egg above inventory',
      itemUsed: 'Item used',
      itemUsedDescription: 'was used',
      itemUsedDescriptionRemaining: 'was used (remaining',
      cannotSell: 'Cannot sell',
      itemNotInInventory: 'This item is no longer in your inventory',
      noPacks: 'No packs',
      noPacksToSell: 'You have no closed packs to sell'
    },
    // GameHeader
    gameHeader: {
      openShop: 'Open Shop',
      shop: 'Shop',
      dungeons: 'Dungeons',
      statistics: 'Statistics',
      information: 'Information'
    }
  }
};

export const t = (language: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};