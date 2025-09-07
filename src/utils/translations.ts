export type Language = 'ru' | 'en';

export const translations = {
  ru: {
    // Menu
    menu: {
      title: 'Главное меню',
      play: 'Играть',
      shop: 'Магазин',
      inventory: 'Инвентарь',
      profile: 'Профиль',
      settings: 'Настройки'
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
    }
  },
  en: {
    // Menu
    menu: {
      title: 'Main Menu',
      play: 'Play',
      shop: 'Shop',
      inventory: 'Inventory',
      profile: 'Profile',
      settings: 'Settings'
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