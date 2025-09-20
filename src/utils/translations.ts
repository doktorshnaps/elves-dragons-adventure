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
      insufficientFundsButton: 'Не хватает ELL',
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
    },
    // Common UI
    common: {
      backToMenu: 'Вернуться в меню',
      backToDungeons: 'Вернуться к подземельям',
      backToDungeon: 'Вернуться в подземелье',
      newCard: 'Новая карта!',
      getCard: 'Получите бесплатную стартовую карту!',
      getCardDescription: 'Получите бесплатную стартовую карту для начала игры',
      inventoryEmpty: 'Инвентарь пуст',
      cards: 'Карты',
      healthPotion: 'Зелье здоровья',
      cardPack: 'Набор карт'
    },
    // Items and descriptions
    items: {
      cardPackDescription: 'Содержит 1 случайную карту героя или дракона',
      cardPackDescriptionValue: 'Содержит {value} случайных карт',
      healthPotionDescription: 'Восстанавливает {value} единиц здоровья',
      healthRestored: 'Восстановлено {value} здоровья',
      noActiveCards: 'У вас нет активных карт героев или питомцев',
      newCardReceived: 'Получена карта: {name} ({rarity}★)',
      battleReturnWarning: 'Вы можете вернуться к битве через меню подземелий',
      openPack: 'Открыть колоду',
      use: 'Использовать',
      sell: 'Продать',
      startIncubation: 'Начать инкубацию',
      leaveDungeon: 'Покинуть подземелье',
      progressSaved: 'Прогресс сохранен',
      dungeonLeft: 'Подземелье покинуто',
      allProgressReset: 'Весь прогресс сброшен',
      power: 'Сила',
      defense: 'Защита',
      health: 'Здоровье',
      rarity: 'Редкость',
      pet: 'Питомец',
      dragonEgg: 'Яйцо дракона'
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
      insufficientFundsButton: 'Not Enough ELL',
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
    },
    // Common UI
    common: {
      backToMenu: 'Back to Menu',
      backToDungeons: 'Back to Dungeons',
      backToDungeon: 'Return to Dungeon',
      newCard: 'New Card!',
      getCard: 'Get Your Free Starter Card!',
      getCardDescription: 'Get a free starter card to begin your game',
      inventoryEmpty: 'Inventory is empty',
      cards: 'Cards',
      healthPotion: 'Health Potion',
      cardPack: 'Card Pack'
    },
    // Items and descriptions
    items: {
      cardPackDescription: 'Contains 1 random hero or dragon card',
      cardPackDescriptionValue: 'Contains {value} random cards',
      healthPotionDescription: 'Restores {value} health points',
      healthRestored: 'Restored {value} health',
      noActiveCards: 'You have no active hero or pet cards',
      newCardReceived: 'Card received: {name} ({rarity}★)',
      battleReturnWarning: 'You can return to battle through the dungeons menu',
      openPack: 'Open Pack',
      use: 'Use',
      sell: 'Sell',
      startIncubation: 'Start Incubation',
      leaveDungeon: 'Leave Dungeon',
      progressSaved: 'Progress Saved',
      dungeonLeft: 'Dungeon Left',
      allProgressReset: 'All progress reset',
      power: 'Power',
      defense: 'Defense', 
      health: 'Health',
      rarity: 'Rarity',
      pet: 'Pet',
      dragonEgg: 'Dragon Egg'
    }
  }
};

export const t = (language: Language, key: string, variables?: Record<string, string>): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  let result = value || key;
  
  // Replace variables in the format {variableName}
  if (variables && typeof result === 'string') {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      result = result.replace(new RegExp(`\\{${varKey}\\}`, 'g'), varValue);
    });
  }
  
  return result;
};