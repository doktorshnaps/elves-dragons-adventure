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
      dragonEgg: 'Яйцо дракона',
      faction: 'Фракция'
    },
    // Shelter
    shelter: {
      title: 'Убежище',
      upgrades: 'Улучшения',
      crafting: 'Крафт',
      barracks: 'Казармы',
      dragonLair: 'Драконье Логово',
      medical: 'Медпункт',
      workers: 'Рабочие',
      inactive: 'неактивно',
      requiresWorkers: 'Требуются рабочие',
      workersRequired: 'требуются рабочие для работы и улучшений',
      maxLevel: 'Максимальный уровень',
      upgrade: 'Улучшить',
      upgrading: 'Улучшается...',
      install: 'Установить',
      create: 'Создать',
      level: 'Уровень',
      cost: 'Стоимость улучшения:',
      wood: 'Дерево',
      stone: 'Камень',
      iron: 'Железо',
      gold: 'Золото',
      bonus: 'Бонус:',
      buildingInactive: 'неактивно',
      assignWorkers: 'Назначить рабочих',
      availableHeroes: 'Доступные герои для улучшения',
      availableDragons: 'Доступные драконы для улучшения',
      selectTwoHeroes: 'Выберите двух одинаковых героев для улучшения',
      selectTwoDragons: 'Выберите двух одинаковых драконов для улучшения',
      upgradeBuilding: 'Улучшить здание',
      buildingUpgraded: 'Здание улучшено!',
      itemCreated: 'Предмет создан!',
      created: 'Создан:',
      // Building names
      mainHall: 'Главный зал',
      workshop: 'Мастерская', 
      storage: 'Склад',
      sawmill: 'Лесопилка',
      quarry: 'Каменоломня',
      barracksBuilding: 'Казармы',
      dragonLairBuilding: 'Драконье Логово',
      medicalBuilding: 'Медицинский блок',
      // Building descriptions
      mainHallDesc: 'Увеличивает общую вместимость лагеря',
      workshopDesc: 'Позволяет создавать более качественные предметы',
      storageDesc: 'Увеличивает лимит хранения ресурсов',
      sawmillDesc: 'Производит дерево для строительства',
      quarryDesc: 'Добывает камень для укреплений',
      barracksDesc: 'Обучает воинов и драконов',
      dragonLairDesc: 'Место для разведения драконов',
      medicalDesc: 'Лечит раненых воинов и драконов',
      // Building benefits
      mainHallBenefit: '+20 слотов инвентаря',
      workshopBenefit: 'Разблокирует редкие рецепты',
      storageBenefit: '+100 к лимиту ресурсов',
      sawmillBenefit: '+10 дерева в час',
      quarryBenefit: '+8 камня в час',
      barracksBenefit: 'Разблокирует тренировки',
      dragonLairBenefit: 'Увеличивает скорость вылупления',
      medicalBenefit: 'Ускоряет лечение',
      // Craft recipes
      ironSword: 'Железный меч',
      ironSwordDesc: 'Надежный меч для воинов',
      ironSwordResult: 'Железный меч (+15 атака)',
      leatherArmor: 'Кожаная броня',
      leatherArmorDesc: 'Легкая защита',
      leatherArmorResult: 'Кожаная броня (+10 защита)',
      healthPotion: 'Зелье здоровья',
      healthPotionDesc: 'Восстанавливает здоровье',
      healthPotionResult: 'Зелье здоровья (+50 HP)',
      // Workers management
      workersInfo: 'Информация о рабочих',
      totalSpeedBoost: 'Общий бонус к скорости',
      noActiveWorkers: 'У вас нет активных рабочих',
      hireWorkers: 'Наймите рабочих для ускорения работы зданий',
      workersBoostActive: 'Все здания работают быстрее благодаря рабочим!',
      assignWorker: 'Назначить рабочего',
      assignWorkerDesc: 'Выберите здание и назначьте рабочего. После назначения отменить нельзя!',
      building: 'Здание:',
      availableWorkers: 'Доступные рабочие:',
      noWorkersInInventory: 'У вас нет рабочих в инвентаре',
      buyWorkersInShop: 'Купите их в Магическом магазине',
      assignButton: 'Назначить',
      warningTitle: 'Внимание:',
      warningText: 'После назначения рабочего на здание отменить это действие нельзя. По окончанию работы рабочий исчезнет навсегда.',
      activeWorkers: 'Активные рабочие',
      timeLeft: 'Осталось времени:',
      workingAt: 'Работает в здании:',
      speedBoost: 'Ускорение:',
      workerAssigned: 'Рабочий назначен',
      workerAssignedDesc: 'приступил к работе в здании',
      error: 'Ошибка',
      failedToAssign: 'Не удалось назначить рабочего. Попробуйте снова.'
    },
    // Grimoire
    grimoire: {
      title: 'Гримуар',
      cards: 'Карты',
      dungeons: 'Подземелья',
      items: 'Предметы',
      heroes: 'Герои',
      pets: 'Питомцы'
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
      dragonEgg: 'Dragon Egg',
      faction: 'Faction'
    },
    // Shelter
    shelter: {
      title: 'Shelter',
      upgrades: 'Upgrades',
      crafting: 'Crafting',
      barracks: 'Barracks',
      dragonLair: 'Dragon Lair',
      medical: 'Medical Bay',
      workers: 'Workers',
      inactive: 'inactive',
      requiresWorkers: 'Requires Workers',
      workersRequired: 'workers required for operation and upgrades',
      maxLevel: 'Maximum level',
      upgrade: 'Upgrade',
      upgrading: 'Upgrading...',
      install: 'Install',
      create: 'Create',
      level: 'Level',
      cost: 'Upgrade cost:',
      wood: 'Wood',
      stone: 'Stone',
      iron: 'Iron',
      gold: 'Gold',
      bonus: 'Bonus:',
      buildingInactive: 'inactive',
      assignWorkers: 'Assign Workers',
      availableHeroes: 'Available heroes for upgrade',
      availableDragons: 'Available dragons for upgrade',
      selectTwoHeroes: 'Select two identical heroes for upgrade',
      selectTwoDragons: 'Select two identical dragons for upgrade',
      upgradeBuilding: 'Upgrade building',
      buildingUpgraded: 'Building upgraded!',
      itemCreated: 'Item created!',
      created: 'Created:',
      // Building names
      mainHall: 'Main Hall',
      workshop: 'Workshop',
      storage: 'Storage',
      sawmill: 'Sawmill',
      quarry: 'Quarry',
      barracksBuilding: 'Barracks',
      dragonLairBuilding: 'Dragon Lair',
      medicalBuilding: 'Medical Bay',
      // Building descriptions
      mainHallDesc: 'Increases overall camp capacity',
      workshopDesc: 'Allows crafting higher quality items',
      storageDesc: 'Increases resource storage limit',
      sawmillDesc: 'Produces wood for construction',
      quarryDesc: 'Mines stone for fortifications',
      barracksDesc: 'Trains warriors and dragons',
      dragonLairDesc: 'Place for dragon breeding',
      medicalDesc: 'Heals wounded warriors and dragons',
      // Building benefits
      mainHallBenefit: '+20 inventory slots',
      workshopBenefit: 'Unlocks rare recipes',
      storageBenefit: '+100 to resource limit',
      sawmillBenefit: '+10 wood per hour',
      quarryBenefit: '+8 stone per hour',
      barracksBenefit: 'Unlocks training',
      dragonLairBenefit: 'Increases hatching speed',
      medicalBenefit: 'Accelerates healing',
      // Craft recipes
      ironSword: 'Iron Sword',
      ironSwordDesc: 'Reliable sword for warriors',
      ironSwordResult: 'Iron Sword (+15 attack)',
      leatherArmor: 'Leather Armor',
      leatherArmorDesc: 'Light protection',
      leatherArmorResult: 'Leather Armor (+10 defense)',
      healthPotion: 'Health Potion',
      healthPotionDesc: 'Restores health',
      healthPotionResult: 'Health Potion (+50 HP)',
      // Workers management
      workersInfo: 'Workers Information',
      totalSpeedBoost: 'Total Speed Boost',
      noActiveWorkers: 'You have no active workers',
      hireWorkers: 'Hire workers to speed up building operations',
      workersBoostActive: 'All buildings operate faster thanks to workers!',
      assignWorker: 'Assign Worker',
      assignWorkerDesc: 'Select a building and assign a worker. Cannot be undone after assignment!',
      building: 'Building:',
      availableWorkers: 'Available Workers:',
      noWorkersInInventory: 'You have no workers in inventory',
      buyWorkersInShop: 'Buy them in the Magic Shop',
      assignButton: 'Assign',
      warningTitle: 'Warning:',
      warningText: 'After assigning a worker to a building, this action cannot be undone. The worker will disappear forever after completing work.',
      activeWorkers: 'Active Workers',
      timeLeft: 'Time left:',
      workingAt: 'Working at building:',
      speedBoost: 'Speed boost:',
      workerAssigned: 'Worker assigned',
      workerAssignedDesc: 'started working at building',
      error: 'Error',
      failedToAssign: 'Failed to assign worker. Please try again.'
    },
    // Grimoire
    grimoire: {
      title: 'Grimoire',
      cards: 'Cards',
      dungeons: 'Dungeons',
      items: 'Items',
      heroes: 'Heroes',
      pets: 'Pets'
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