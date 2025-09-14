// Главный модуль приложения
const App = {
    // Состояние приложения
    state: {
        initialized: false,
        currentScreen: 'loading',
        user: null
    },

    // Инициализация приложения
    async init() {
        ConfigUtils.log('Запуск приложения Tarot Booking');

        try {
            // Показываем загрузочный экран
            this.showScreen('loading');

            // Инициализируем Telegram Web App
            TelegramApp.init();

            // Небольшая задержка для плавности
            await this.delay(1000);

            // Инициализируем систему хранения
            this.initStorage();

            // Инициализируем систему авторизации
            AuthSystem.init();

            // Проверяем авторизацию
            const isAuthenticated = AuthSystem.checkExistingAuth();

            if (isAuthenticated) {
                // Пользователь уже авторизован
                this.state.user = AuthSystem.getCurrentUser();
                ConfigUtils.log('Пользователь авторизован:', this.state.user.firstName);

                // Переходим к основному приложению
                this.showMainApp();
            } else {
                // Показываем экран авторизации
                this.showAuthScreen();
            }

            // Устанавливаем обработчики событий
            this.setupEventListeners();

            // Запускаем фоновые процессы
            this.startBackgroundProcesses();

            this.state.initialized = true;
            ConfigUtils.log('Приложение инициализировано успешно');

        } catch (error) {
            ConfigUtils.error('Ошибка инициализации приложения:', error);
            this.handleInitError(error);
        }
    },

    // Задержка
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Инициализация системы хранения
    initStorage() {
        // Очистка устаревших данных
        TimeSlotStorage.cleanupExpired();

        // Проверка размера хранилища
        const storageSize = Storage.getStorageSize();
        ConfigUtils.log(`Размер данных в хранилище: ${storageSize} символов`);

        if (storageSize > 1000000) { // 1MB
            ConfigUtils.log('Предупреждение: размер хранилища превышает 1MB');
        }
    },

    // Показать экран
    showScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Показываем нужный экран
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.state.currentScreen = screenName;
            ConfigUtils.log('Показан экран:', screenName);
        }
    },

    // Показать экран авторизации
    showAuthScreen() {
        this.showScreen('auth');

        // Сбрасываем форму авторизации
        document.getElementById('telegram-auth').style.display = 'none';
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    },

    // Показать основное приложение
    showMainApp() {
        this.showScreen('main');

        // Инициализируем интерфейс в зависимости от роли
        AuthSystem.initRoleBasedInterface();

        // Показываем первую вкладку
        AuthSystem.switchTab('booking');
    },

    // Настройка обработчиков событий
    setupEventListeners() {
        // Глобальные обработчики
        this.setupGlobalHandlers();

        // Обработчики авторизации
        this.setupAuthHandlers();

        // Обработчики навигации
        this.setupNavigationHandlers();

        // Обработчики Telegram
        this.setupTelegramHandlers();
    },

    // Глобальные обработчики
    setupGlobalHandlers() {
        // Обработка ошибок JavaScript
        window.addEventListener('error', (event) => {
            ConfigUtils.error('Глобальная ошибка:', event.error);
            this.handleError(event.error);
        });

        // Обработка unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            ConfigUtils.error('Необработанный promise rejection:', event.reason);
            this.handleError(event.reason);
        });

        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Обработка изменения видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
    },

    // Обработчики авторизации
    setupAuthHandlers() {
        // Выбор роли
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Убираем выделение с других кнопок
                document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));

                // Выделяем выбранную кнопку
                e.currentTarget.classList.add('selected');

                // Получаем роль из onclick атрибута
                const role = e.currentTarget.getAttribute('onclick').match(/selectRole\('(.+?)'\)/)[1];
                AuthSystem.selectRole(role);
            });
        });
    },

    // Обработчики навигации
    setupNavigationHandlers() {
        // Обработка кнопок навигации настраивается в AuthSystem
        // Здесь можем добавить дополнительную логику при необходимости
    },

    // Обработчики Telegram
    setupTelegramHandlers() {
        // Обработка события закрытия приложения
        if (ConfigUtils.isTelegramApp()) {
            const tg = window.Telegram.WebApp;

            // Обработка попытки закрытия
            tg.onEvent('viewportChanged', () => {
                ConfigUtils.log('Изменение viewport в Telegram');
            });
        }
    },

    // Запуск фоновых процессов
    startBackgroundProcesses() {
        // Периодическая очистка устаревших данных
        setInterval(() => {
            TimeSlotStorage.cleanupExpired();
        }, 30 * 60 * 1000); // каждые 30 минут

        // Проверка уведомлений (если разрешены)
        if (CONFIG.NOTIFICATIONS.ENABLED) {
            this.startNotificationSystem();
        }

        ConfigUtils.log('Фоновые процессы запущены');
    },

    // Система уведомлений
    startNotificationSystem() {
        // Проверяем напоминания каждую минуту
        setInterval(() => {
            this.checkReminders();
        }, 60 * 1000);
    },

    // Проверка напоминаний
    checkReminders() {
        if (!this.state.user) return;

        const userBookings = BookingStorage.getUserBookings(this.state.user.id);
        const now = new Date();
        const reminderTime = CONFIG.NOTIFICATIONS.BOOKING_REMINDER_HOURS * 60 * 60 * 1000;

        userBookings.forEach(booking => {
            if (booking.status === CONFIG.BOOKING_STATUS.CONFIRMED) {
                const slot = TimeSlotStorage.findById(booking.slotId);
                if (slot) {
                    const slotStart = new Date(slot.start);
                    const timeDiff = slotStart.getTime() - now.getTime();

                    // Проверяем, нужно ли показать напоминание
                    if (timeDiff > 0 && timeDiff <= reminderTime && !booking.reminderSent) {
                        this.sendReminder(booking, slot);

                        // Отмечаем, что напоминание отправлено
                        BookingStorage.update(booking.id, { reminderSent: true });
                    }
                }
            }
        });
    },

    // Отправка напоминания
    sendReminder(booking, slot) {
        const slotStart = new Date(slot.start);
        const timeStr = slotStart.toLocaleString('ru-RU');

        TelegramApp.showPopup(
            'Напоминание',
            `Не забудьте о консультации ${timeStr}!`
        );

        ConfigUtils.log('Отправлено напоминание для записи:', booking.id);
    },

    // Обработка изменения размера
    handleResize() {
        // Адаптация интерфейса под новый размер
        if (ConfigUtils.isTelegramApp()) {
            window.Telegram.WebApp.expand();
        }
    },

    // Обработка скрытия страницы
    handlePageHidden() {
        ConfigUtils.log('Страница скрыта');
        // Можем сохранить текущее состояние
    },

    // Обработка появления страницы
    handlePageVisible() {
        ConfigUtils.log('Страница видна');
        // Можем обновить данные
        this.refreshData();
    },

    // Обновление данных
    refreshData() {
        if (this.state.user && this.state.currentScreen === 'main') {
            // Обновляем данные в зависимости от активной вкладки
            const activeTab = document.querySelector('.tab-content.active');

            if (activeTab) {
                const tabId = activeTab.id;

                switch (tabId) {
                    case 'booking-tab':
                        if (AuthSystem.hasRole(CONFIG.USER_ROLES.CLIENT)) {
                            BookingSystem.loadAvailableSlots();
                        } else {
                            AdminPanel.loadBookings();
                        }
                        break;
                    case 'profile-tab':
                        ProfileManager.loadProfile();
                        break;
                    case 'referral-tab':
                        ReferralSystem.loadReferralData();
                        break;
                }
            }
        }
    },

    // Обработка ошибки инициализации
    handleInitError(error) {
        const errorMessage = `Ошибка запуска приложения: ${error.message}`;

        if (ConfigUtils.isTelegramApp()) {
            TelegramApp.showAlert(errorMessage);
        } else {
            alert(errorMessage);
        }

        // Показываем экран ошибки или пытаемся восстановиться
        this.showErrorScreen(error);
    },

    // Общая обработка ошибок
    handleError(error) {
        ConfigUtils.error('Ошибка приложения:', error);

        // Защита от null/undefined ошибок
        if (!error) {
            ConfigUtils.log('Получена пустая ошибка, игнорируем');
            return;
        }

        // В зависимости от типа ошибки принимаем решение
        const errorMessage = error.message || error.toString();

        if (errorMessage.includes('NetworkError')) {
            this.showNetworkError();
        } else if (errorMessage.includes('QuotaExceededError')) {
            this.showStorageError();
        } else if (errorMessage.includes('WebAppMethodUnsupported')) {
            ConfigUtils.log('Telegram метод не поддерживается - это нормально для браузера');
            // Не показываем ошибку пользователю
        } else {
            // Общая ошибка - только в дебаг режиме показываем
            if (CONFIG.DEBUG && ConfigUtils.isTelegramApp()) {
                TelegramApp.showAlert('Произошла ошибка. Попробуйте перезапустить приложение.');
            }
        }
    },

    // Показать ошибку сети
    showNetworkError() {
        TelegramApp.showPopup(
            'Ошибка сети',
            'Проверьте подключение к интернету и попробуйте снова.',
            ['ok']
        );
    },

    // Показать ошибку хранилища
    showStorageError() {
        TelegramApp.showPopup(
            'Нехватка места',
            'Память устройства заполнена. Очистите данные приложения.',
            ['ok']
        );
    },

    // Показать экран ошибки
    showErrorScreen(error) {
        const errorScreen = document.createElement('div');
        errorScreen.className = 'screen active error-screen';
        errorScreen.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #f44336;">
                <h2>😔 Упс! Что-то пошло не так</h2>
                <p style="margin: 20px 0;">${error.message}</p>
                <button onclick="window.location.reload()" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                ">
                    Перезапустить приложение
                </button>
            </div>
        `;

        document.body.appendChild(errorScreen);
    },

    // Перезапуск приложения
    restart() {
        // Очищаем состояние
        this.state = {
            initialized: false,
            currentScreen: 'loading',
            user: null
        };

        // Перезапускаем
        this.init();
    },

    // Получить информацию о приложении
    getAppInfo() {
        return {
            name: CONFIG.APP_NAME,
            version: CONFIG.VERSION,
            user: this.state.user,
            initialized: this.state.initialized,
            currentScreen: this.state.currentScreen,
            telegramSupport: ConfigUtils.isTelegramApp(),
            storageSize: Storage.getStorageSize(),
            devMode: CONFIG.DEV_MODE
        };
    },

    // Добавить индикатор режима разработки
    addDevModeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'dev-mode-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ff9800;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            ">
                🔧 DEV MODE
            </div>
        `;
        document.body.appendChild(indicator);

        // Добавляем кнопки быстрого доступа в дебаг режиме
        this.addDevModePanel();
    },

    // Добавить панель разработчика
    addDevModePanel() {
        const panel = document.createElement('div');
        panel.id = 'dev-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                bottom: 90px;
                right: 10px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 15px;
                border-radius: 10px;
                font-size: 12px;
                z-index: 9999;
                min-width: 200px;
                display: none;
            ">
                <div style="font-weight: bold; margin-bottom: 10px;">🛠️ Dev Panel</div>
                <button onclick="devModeLogin('client')" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
                    👤 Войти как Клиент
                </button>
                <button onclick="devModeLogin('tarot')" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #9c27b0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
                    🔮 Войти как Таролог
                </button>
                <button onclick="clearDevData()" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
                    🗑️ Очистить данные
                </button>
                <button onclick="addTestData()" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
                    📋 Тестовые данные
                </button>
            </div>
        `;
        document.body.appendChild(panel);

        // Показываем/скрываем панель по клику на индикатор
        const indicator = document.getElementById('dev-mode-indicator');
        indicator.addEventListener('click', () => {
            const panelContent = document.getElementById('dev-panel').firstElementChild;
            const isVisible = panelContent.style.display === 'block';
            panelContent.style.display = isVisible ? 'none' : 'block';

            ConfigUtils.log('🔧 Dev Panel', isVisible ? 'скрыт' : 'показан');
        });

        ConfigUtils.log('🔧 Dev Panel создан');
    },

    // Быстрый вход в дебаг режиме
    devModeLogin(role) {
        ConfigUtils.log('🔧 Dev mode login as:', role);

        // Создаем тестового пользователя
        const testUser = {
            ...CONFIG.DEV_USER,
            role: role,
            registeredAt: new Date().toISOString(),
            referralCode: AuthSystem.generateReferralCode(CONFIG.DEV_USER.id)
        };

        // Сохраняем пользователя
        AuthSystem.currentUser = testUser;
        Storage.set(CONFIG.STORAGE_KEYS.USER_DATA, testUser);

        // Переходим к основному приложению
        AuthSystem.completeAuth();

        // Скрываем dev panel
        const panel = document.getElementById('dev-panel').firstElementChild;
        panel.style.display = 'none';
    },

    // Очистить данные в дебаг режиме
    clearDevData() {
        ConfigUtils.log('🔧 Clearing dev data');
        Storage.clear();
        AuthSystem.currentUser = null;
        AuthSystem.selectedRole = null;
        this.showAuthScreen();

        // Скрываем dev panel
        const panel = document.getElementById('dev-panel').firstElementChild;
        panel.style.display = 'none';
    },

    // Добавить тестовые данные
    addTestData() {
        ConfigUtils.log('🔧 Adding test data');

        // Добавляем тестовые временные слоты
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const testSlots = [
            {
                start: `${tomorrow.toISOString().split('T')[0]}T10:00`,
                end: `${tomorrow.toISOString().split('T')[0]}T11:00`,
                status: CONFIG.SLOT_STATUS.AVAILABLE
            },
            {
                start: `${tomorrow.toISOString().split('T')[0]}T14:00`,
                end: `${tomorrow.toISOString().split('T')[0]}T15:00`,
                status: CONFIG.SLOT_STATUS.AVAILABLE
            },
            {
                start: `${tomorrow.toISOString().split('T')[0]}T16:00`,
                end: `${tomorrow.toISOString().split('T')[0]}T17:00`,
                status: CONFIG.SLOT_STATUS.PENDING
            }
        ];

        testSlots.forEach(slot => TimeSlotStorage.add(slot));

        // Добавляем тестовые записи
        const testBooking = {
            clientId: CONFIG.DEV_USER.id,
            tarotId: 987654321,
            slotId: TimeSlotStorage.getAll()[0]?.id,
            clientName: 'Тестовый клиент',
            clientContact: '@test_user',
            consultationType: 'online',
            question: 'Тестовый вопрос для консультации'
        };

        BookingStorage.add(testBooking);

        alert('✅ Тестовые данные добавлены');

        // Скрываем dev panel
        const panel = document.getElementById('dev-panel').firstElementChild;
        panel.style.display = 'none';

        // Обновляем интерфейс
        this.refreshData();
    }
};

// Глобальные функции для HTML
window.selectRole = (role) => {
    AuthSystem.selectRole(role);
};

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Экспортируем главный модуль
window.App = App;