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
      camp: 'Лагерь',
      disconnectWallet: 'Отключить кошелек',
      balance: 'Баланс:',
      connected: 'Подключен',
      connectWallet: 'Подключить кошелек',
      connecting: 'Подключение...',
      loadingMenu: 'Загрузка меню...',
      soulArchive: 'Архив душ',
      magicShop: 'Магический магазин',
      tradingPlatform: 'Торговая площадка',
      gameSettings: 'Настройки игры'
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
      requiredItems: 'Требуемые предметы',
      requiresMainHall: 'Требуется уровень Главного зала',
      workersRequired: 'требуются рабочие для работы и улучшений',
      maxLevel: 'Максимальный уровень',
      upgrade: 'Улучшить',
      build: 'Построить',
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
      requirements: 'Требования',
      result: 'Результат',
      craft: 'Создать',
      craftingTime: 'Время крафта',
      workshopRequired: 'Требуется мастерская',
      workshopRequiredDesc: 'Постройте мастерскую, чтобы создавать предметы',
      craftingStarted: 'Крафт начат',
      craftingCompleted: 'Крафт завершен',
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
    },
    // Dungeons
    dungeons: {
      title: 'Подземелья',
      backToMenu: 'Вернуться в меню',
      returnToDungeon: 'Вернуться в подземелье'
    },
    // Quest Page
    quest: {
      title: 'Квесты и Рефералы',
      backToMenu: 'Вернуться в меню',
      quests: 'Квесты',
      referrals: 'Рефералы'
    },
    // Soul Archive
    soulArchive: {
      title: 'Soul Archive',
      backToMenu: 'Назад в меню',
      totalPlayers: 'Всего игроков',
      totalReferrals: 'Всего рефералов',
      avgPerPlayer: 'Среднее на игрока',
      thisWeek: 'За эту неделю',
      referrals: 'рефералов',
      lastUpdate: 'Последнее обновление',
      autoRefresh: 'Авто-обновление каждый час',
      referralRating: 'Рейтинг Рефералов',
      soulAltar: 'Алтарь Душ',
      allTime: 'За все время',
      weekly: 'Недельный',
      noData: 'Нет данных о рефералах',
      referralDetails: 'Детали рефералов',
      close: 'Закрыть',
      loading: 'Загрузка...',
      error: 'Ошибка',
      loadError: 'Не удалось загрузить статистику рефералов',
      detailsError: 'Не удалось загрузить список рефералов'
    },
    // Team Stats
    team: {
      title: 'Команда и статистика',
      backToMenu: 'Вернуться в меню',
      management: 'Управление командой',
      yourTeam: 'Ваша команда'
    },
    // Equipment
    equipment: {
      title: 'Снаряжение',
      backToMenu: 'Вернуться в меню',
      mintNFT: 'Mint NFT',
      playerEquipment: 'Снаряжение игрока'
    },
    // Barracks
    barracks: {
      upgradeHeroes: 'Улучшение героев',
      maxUpgrades: 'Макс. одновременных улучшений:',
      atLevel: 'На уровне',
      canUpgrade: 'можно улучшать героев до',
      rank: 'ранга',
      activeUpgrades: 'Активных улучшений:',
      upgradeBarracks: 'Улучшить казарму',
      recipes: 'Рецепты',
      heroes: 'Герои',
      active: 'Активные',
      upgradeRecipes: 'Рецепты улучшений',
      requirements: 'Настройки требований для улучшения героев',
      faction: 'Фракция',
      allFactions: 'Все фракции',
      rarity: 'Редкость',
      allRarities: 'Все редкости',
      upgrade: 'Улучшение',
      upgradeCompleted: 'Улучшение завершено!',
      upgradeSuccess: '✨ Улучшение успешно!',
      upgradeFailed: '❌ Улучшение не удалось',
      upgradeFailedDesc: 'Попытка улучшения провалилась. Герои остались, но ресурсы потрачены.',
      onSuccess: 'При успехе:',
      onSuccessDesc: 'Герои объединятся в улучшенного героя',
      onFailure: 'При неудаче:',
      onFailureDesc: 'Герои останутся, но все ресурсы и предметы будут потрачены.',
      selectHeroes: 'Выберите героев для улучшения',
      noHeroesAvailable: 'Нет доступных героев для улучшения',
      needTwoHeroes: 'Необходимо иметь 2 одинаковых героя одной фракции для улучшения'
    },
    // Dragon Lair
    dragonLair: {
      upgradeDragons: 'Улучшение драконов',
      maxUpgrades: 'Макс. одновременных улучшений:',
      atLevel: 'На уровне',
      canUpgrade: 'можно улучшать драконов до',
      rank: 'ранга',
      activeUpgrades: 'Активных улучшений:',
      upgradeLair: 'Улучшить логово',
      recipes: 'Рецепты',
      dragons: 'Драконы',
      active: 'Активные',
      upgradeRecipes: 'Рецепты улучшения драконов',
      requirements: 'Требования для улучшения драконов разных рангов',
      faction: 'Фракция',
      allFactions: 'Все фракции',
      rarity: 'Редкость',
      allRarities: 'Все редкости',
      upgrade: 'Улучшение',
      upgradeCompleted: 'Улучшение завершено!',
      upgradeSuccess: '✨ Улучшение успешно!',
      upgradeFailed: '❌ Улучшение не удалось',
      upgradeFailedDesc: 'Попытка улучшения провалилась. Драконы остались, но ресурсы потрачены.',
      onSuccess: 'При успехе:',
      onSuccessDesc: 'Драконы объединятся в улучшенного дракона',
      onFailure: 'При неудаче:',
      onFailureDesc: 'Драконы останутся, но все ресурсы и предметы будут потрачены.',
      selectDragons: 'Выберите драконов для улучшения',
      noDragonsAvailable: 'Нет доступных драконов для улучшения',
      needTwoDragons: 'Необходимо иметь 2 одинаковых дракона одной фракции для улучшения'
    },
    // Auth page
    auth: {
      title: 'ElleonorAI Подключение кошелька',
      subtitle: 'Подключите NEAR кошелек для входа в игру',
      progressInfo: 'Ваш прогресс будет привязан к адресу кошелька NEAR',
      connectButton: 'Подключить NEAR кошелек',
      connecting: 'Подключение...',
      walletRequired: 'Для игры необходим установленный NEAR кошелек.',
      createWallet: 'Создать кошелек',
      referralAdded: 'Реферал добавлен',
      referralAddedDesc: 'Вы успешно привязаны к пригласившему игроку',
      referralError: 'Ошибка реферала',
      connectionError: 'Не удалось подключить кошелек'
    },
    // Admin settings
    admin: {
      title: 'Настройки игры',
      subtitle: 'Глубокая настройка параметров героев, драконов и подземелий',
      backToMenu: 'Назад в меню',
      checkingAccess: 'Проверка прав доступа...',
      accessDenied: 'Доступ запрещен',
      noPermission: 'У вас нет прав для доступа к этой странице',
      returnToMenu: 'Вернуться в меню',
      // Tabs
      cards: 'Карты (Герои и Драконы)',
      cardImages: 'Изображения карт',
      dungeons: 'Подземелья',
      quests: 'Задания',
      items: 'Предметы',
      giveaway: 'Выдать предмет',
      shelter: 'Убежище',
      cardUpgrades: 'Улучшения карт',
      crafting: 'Рецепты крафта',
      management: 'Управление',
      admins: 'Администраторы'
    },
    // Dungeon info
    dungeonInfo: {
      title: 'Гайд по подземельям',
      subtitle: 'Изучите монстров, их способности и возможный дроп в каждом подземелье',
      selectLevel: 'Выберите уровень',
      level: 'Уровень'
    },
    // Dragon egg
    dragonEgg: {
      startIncubation: 'Начать инкубацию',
      timeUntilHatch: 'До вылупления:',
      claim: 'Получить',
      claimed: 'Питомец получен!'
    },
    // Dungeon search
    dungeonSearch: {
      activeTitle: 'Активное подземелье',
      selectTitle: 'Выбор подземелья',
      balance: 'Баланс:',
      energy: 'Энергия:',
      nextEnergy: 'Следующая энергия через:',
      searching: 'Поиск подземелья...',
      search: 'Искать подземелье',
      enter: 'Войти в подземелье',
      returnToDungeon: 'Вернуться в подземелье',
      close: 'Закрыть',
      resetBattle: 'Сбросить активный бой',
      activeBattleWarning: 'У вас есть активный бой в подземелье. Завершите его или сдайтесь, чтобы войти в другое подземелье.',
      otherDeviceWarning: 'На другом устройстве уже запущено подземелье. Вход заблокирован.',
      endOtherSession: 'Завершить подземелье на другом устройстве',
      healthTooLow: 'Здоровье слишком низкое для входа в подземелье',
      noActiveCards: 'У вас нет активных карт героев или питомцев',
      selectDungeon: 'Выберите подземелье',
      // Dungeon names
      spiderNest: 'Гнездо Гигантских Пауков',
      boneDungeon: 'Темница Костяных Демонов',
      darkMage: 'Лабиринт Темного Мага',
      forgottenSouls: 'Пещеры Забытых Душ',
      iceThrone: 'Трон Ледяного Короля',
      seaSerpent: 'Логово Морского Змея',
      dragonLair: 'Логово Черного Дракона',
      pantheonGods: 'Пантеон Богов'
    },
    // Active dungeon warning
    activeDungeonWarning: {
      title: '⚠️ Обнаружено активное подземелье',
      message: 'У вас уже запущено подземелье на другом устройстве:',
      level: 'Уровень',
      lastActivity: 'Последняя активность:',
      warning: 'Вы не можете проходить подземелье одновременно с нескольких устройств.',
      cancel: 'Отмена',
      endAndRestart: 'Завершить старое и начать новое',
      secondsAgo: 'сек. назад',
      minutesAgo: 'мин. назад'
    },
    // Marketplace
    marketplace: {
      backToMenu: 'Вернуться в меню',
      availableOffers: 'Доступные предложения',
      connectWallet: 'Подключите кошелек',
      connectWalletDesc: 'Для продажи NFT подключите NEAR-кошелек',
      nftListed: 'NFT выставлен на продажу',
      itemListed: 'Предмет выставлен на продажу',
      listedFor: 'выставлен за',
      error: 'Ошибка',
      failedToList: 'Не удалось создать объявление',
      listingCancelled: 'Объявление отменено',
      returnedToInventory: 'возвращен(а) в ваш инвентарь/колоду',
      failedToCancel: 'Не удалось отменить объявление'
    },
    // Shop items
    shopItem: {
      price: 'Цена:',
      buy: 'Купить',
      dropRates: 'Шансы выпадения:',
      heroes: 'Герои (50%):',
      dragons: 'Драконы (50%):',
      power: 'Сила:',
      defense: 'Защита:',
      health: 'Здоровье:',
      requiredLevel: 'Требуется уровень:'
    },
    // Card display
    cardDisplay: {
      type: 'Тип:',
      hero: 'Герой',
      pet: 'Питомец',
      attack: 'Атака:',
      defense: 'Защита:',
      rarity: 'Редкость:',
      requiresHero: 'Требуется герой'
    },
    attackOrder: {
      readyTitle: 'Готовность к бою',
      readyMessage: 'Ваша команда готова к сражению',
      startBattle: 'Начать бой',
      selectedTeam: 'Выбранная команда',
      pair: 'Пара',
      notSelected: 'Не выбрана',
      hero: 'Герой',
      dragon: 'Дракон'
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
      camp: 'Camp',
      disconnectWallet: 'Disconnect Wallet',
      balance: 'Balance:',
      connected: 'Connected',
      connectWallet: 'Connect Wallet',
      connecting: 'Connecting...',
      loadingMenu: 'Loading menu...',
      soulArchive: 'Soul Archive',
      magicShop: 'Magic Shop',
      tradingPlatform: 'Marketplace',
      gameSettings: 'Game Settings'
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
      requiredItems: 'Required Items',
      requiresMainHall: 'Requires Main Hall level',
      workersRequired: 'workers required for operation and upgrades',
      maxLevel: 'Maximum level',
      upgrade: 'Upgrade',
      build: 'Build',
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
      requirements: 'Requirements',
      result: 'Result',
      craft: 'Craft',
      craftingTime: 'Crafting Time',
      workshopRequired: 'Workshop Required',
      workshopRequiredDesc: 'Build a workshop to craft items',
      craftingStarted: 'Crafting Started',
      craftingCompleted: 'Crafting Completed',
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
    },
    // Dungeons
    dungeons: {
      title: 'Dungeons',
      backToMenu: 'Back to Menu',
      returnToDungeon: 'Return to Dungeon'
    },
    // Quest Page
    quest: {
      title: 'Quests and Referrals',
      backToMenu: 'Back to Menu',
      quests: 'Quests',
      referrals: 'Referrals'
    },
    // Soul Archive
    soulArchive: {
      title: 'Soul Archive',
      backToMenu: 'Back to Menu',
      totalPlayers: 'Total Players',
      totalReferrals: 'Total Referrals',
      avgPerPlayer: 'Average per Player',
      thisWeek: 'This Week',
      referrals: 'referrals',
      lastUpdate: 'Last Update',
      autoRefresh: 'Auto-refresh every hour',
      referralRating: 'Referral Ranking',
      soulAltar: 'Soul Altar',
      allTime: 'All Time',
      weekly: 'Weekly',
      noData: 'No referral data',
      referralDetails: 'Referral Details',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      loadError: 'Failed to load referral statistics',
      detailsError: 'Failed to load referral list'
    },
    // Team Stats
    team: {
      title: 'Team and Statistics',
      backToMenu: 'Back to Menu',
      management: 'Team Management',
      yourTeam: 'Your Team'
    },
    // Equipment
    equipment: {
      title: 'Equipment',
      backToMenu: 'Back to Menu',
      mintNFT: 'Mint NFT',
      playerEquipment: 'Player Equipment'
    },
    // Marketplace
    marketplace: {
      backToMenu: 'Back to Menu',
      availableOffers: 'Available Offers',
      connectWallet: 'Connect Wallet',
      connectWalletDesc: 'Connect your NEAR wallet to sell NFTs',
      nftListed: 'NFT listed for sale',
      itemListed: 'Item listed for sale',
      listedFor: 'listed for',
      error: 'Error',
      failedToList: 'Failed to create listing',
      listingCancelled: 'Listing cancelled',
      returnedToInventory: 'returned to your inventory/deck',
      failedToCancel: 'Failed to cancel listing'
    },
    // Barracks
    barracks: {
      upgradeHeroes: 'Hero Upgrades',
      maxUpgrades: 'Max concurrent upgrades:',
      atLevel: 'At level',
      canUpgrade: 'can upgrade heroes up to',
      rank: 'rank',
      activeUpgrades: 'Active upgrades:',
      upgradeBarracks: 'Upgrade Barracks',
      recipes: 'Recipes',
      heroes: 'Heroes',
      active: 'Active',
      upgradeRecipes: 'Upgrade Recipes',
      requirements: 'Hero upgrade requirement settings',
      faction: 'Faction',
      allFactions: 'All Factions',
      rarity: 'Rarity',
      allRarities: 'All Rarities',
      upgrade: 'Upgrade',
      upgradeCompleted: 'Upgrade Completed!',
      upgradeSuccess: '✨ Upgrade Successful!',
      upgradeFailed: '❌ Upgrade Failed',
      upgradeFailedDesc: 'Upgrade attempt failed. Heroes remain, but resources were spent.',
      onSuccess: 'On Success:',
      onSuccessDesc: 'Heroes will merge into an upgraded hero',
      onFailure: 'On Failure:',
      onFailureDesc: 'Heroes will remain, but all resources and items will be consumed.',
      selectHeroes: 'Select Heroes for Upgrade',
      noHeroesAvailable: 'No heroes available for upgrade',
      needTwoHeroes: 'Need 2 identical heroes of the same faction for upgrade'
    },
    // Dragon Lair
    dragonLair: {
      upgradeDragons: 'Dragon Upgrades',
      maxUpgrades: 'Max concurrent upgrades:',
      atLevel: 'At level',
      canUpgrade: 'can upgrade dragons up to',
      rank: 'rank',
      activeUpgrades: 'Active upgrades:',
      upgradeLair: 'Upgrade Lair',
      recipes: 'Recipes',
      dragons: 'Dragons',
      active: 'Active',
      upgradeRecipes: 'Dragon Upgrade Recipes',
      requirements: 'Requirements for upgrading dragons of different ranks',
      faction: 'Faction',
      allFactions: 'All Factions',
      rarity: 'Rarity',
      allRarities: 'All Rarities',
      upgrade: 'Upgrade',
      upgradeCompleted: 'Upgrade Completed!',
      upgradeSuccess: '✨ Upgrade Successful!',
      upgradeFailed: '❌ Upgrade Failed',
      upgradeFailedDesc: 'Upgrade attempt failed. Dragons remain, but resources were spent.',
      onSuccess: 'On Success:',
      onSuccessDesc: 'Dragons will merge into an upgraded dragon',
      onFailure: 'On Failure:',
      onFailureDesc: 'Dragons will remain, but all resources and items will be consumed.',
      selectDragons: 'Select Dragons for Upgrade',
      noDragonsAvailable: 'No dragons available for upgrade',
      needTwoDragons: 'Need 2 identical dragons of the same faction for upgrade'
    },
    // Auth page
    auth: {
      title: 'ElleonorAI Wallet Connection',
      subtitle: 'Connect your NEAR wallet to enter the game',
      progressInfo: 'Your progress will be linked to your NEAR wallet address',
      connectButton: 'Connect NEAR Wallet',
      connecting: 'Connecting...',
      walletRequired: 'An installed NEAR wallet is required to play.',
      createWallet: 'Create Wallet',
      referralAdded: 'Referral Added',
      referralAddedDesc: 'You have been successfully linked to the referring player',
      referralError: 'Referral Error',
      connectionError: 'Failed to connect wallet'
    },
    // Admin settings
    admin: {
      title: 'Game Settings',
      subtitle: 'Advanced configuration of heroes, dragons and dungeons',
      backToMenu: 'Back to Menu',
      checkingAccess: 'Checking access rights...',
      accessDenied: 'Access Denied',
      noPermission: 'You do not have permission to access this page',
      returnToMenu: 'Return to Menu',
      // Tabs
      cards: 'Cards (Heroes and Dragons)',
      cardImages: 'Card Images',
      dungeons: 'Dungeons',
      quests: 'Quests',
      items: 'Items',
      giveaway: 'Give Item',
      shelter: 'Shelter',
      cardUpgrades: 'Card Upgrades',
      crafting: 'Crafting Recipes',
      management: 'Management',
      admins: 'Administrators'
    },
    // Dungeon info
    dungeonInfo: {
      title: 'Dungeon Guide',
      subtitle: 'Study monsters, their abilities and possible loot in each dungeon',
      selectLevel: 'Select Level',
      level: 'Level'
    },
    // Dragon egg
    dragonEgg: {
      startIncubation: 'Start Incubation',
      timeUntilHatch: 'Time until hatching:',
      claim: 'Claim',
      claimed: 'Pet claimed!'
    },
    // Dungeon search
    dungeonSearch: {
      activeTitle: 'Active Dungeon',
      selectTitle: 'Select Dungeon',
      balance: 'Balance:',
      energy: 'Energy:',
      nextEnergy: 'Next energy in:',
      searching: 'Searching for dungeon...',
      search: 'Search Dungeon',
      enter: 'Enter Dungeon',
      returnToDungeon: 'Return to Dungeon',
      close: 'Close',
      resetBattle: 'Reset Active Battle',
      activeBattleWarning: 'You have an active battle in the dungeon. Complete it or surrender to enter another dungeon.',
      otherDeviceWarning: 'A dungeon is already running on another device. Entry blocked.',
      endOtherSession: 'End dungeon on other device',
      healthTooLow: 'Health too low to enter dungeon',
      noActiveCards: 'You have no active hero or pet cards',
      selectDungeon: 'Select Dungeon',
      // Dungeon names
      spiderNest: 'Giant Spider Nest',
      boneDungeon: 'Bone Demon Prison',
      darkMage: 'Dark Mage Labyrinth',
      forgottenSouls: 'Forgotten Souls Caves',
      iceThrone: 'Ice King Throne',
      seaSerpent: 'Sea Serpent Lair',
      dragonLair: 'Black Dragon Lair',
      pantheonGods: 'Pantheon of Gods'
    },
    // Active dungeon warning
    activeDungeonWarning: {
      title: '⚠️ Active Dungeon Detected',
      message: 'You already have a dungeon running on another device:',
      level: 'Level',
      lastActivity: 'Last activity:',
      warning: 'You cannot run dungeons on multiple devices simultaneously.',
      cancel: 'Cancel',
      endAndRestart: 'End old and start new',
      secondsAgo: 'sec. ago',
      minutesAgo: 'min. ago'
    },
    // Shop items
    shopItem: {
      price: 'Price:',
      buy: 'Buy',
      dropRates: 'Drop Rates:',
      heroes: 'Heroes (50%):',
      dragons: 'Dragons (50%):',
      power: 'Power:',
      defense: 'Defense:',
      health: 'Health:',
      requiredLevel: 'Required Level:'
    },
    // Card display
    cardDisplay: {
      type: 'Type:',
      hero: 'Hero',
      pet: 'Pet',
      attack: 'Attack:',
      defense: 'Defense:',
      rarity: 'Rarity:',
      requiresHero: 'Requires hero'
    },
    attackOrder: {
      readyTitle: 'Ready for Battle',
      readyMessage: 'Your team is ready for combat',
      startBattle: 'Start Battle',
      selectedTeam: 'Selected Team',
      pair: 'Pair',
      notSelected: 'Not Selected',
      hero: 'Hero',
      dragon: 'Dragon'
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