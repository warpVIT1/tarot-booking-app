// Модуль авторизации
const AuthSystem = {
    currentUser: null,
    selectedRole: null,

    // Инициализация системы авторизации
    init() {
        ConfigUtils.log('Инициализация системы авторизации');
        this.checkExistingAuth();
    },

    // Проверка существующей авторизации
    checkExistingAuth() {
        const savedUser = Storage.get(CONFIG.STORAGE_KEYS.USER_DATA);

        if (savedUser && this.validateUser(savedUser)) {
            this.currentUser = savedUser;
            ConfigUtils.log('Найден авторизованный пользователь:', savedUser.firstName);
            return true;
        }

        return false;
    },

    // Валидация данных пользователя
    validateUser(user) {
        return user && user.id && user.firstName && user.role;
    },

    // Выбор роли пользователя
    selectRole(role) {
        if (!Object.values(CONFIG.USER_ROLES).includes(role)) {
            ConfigUtils.error('Неизвестная роль:', role);
            return false;
        }

        this.selectedRole = role;

        // В дебаг режиме сразу авторизуем
        if (CONFIG.DEV_MODE && !ConfigUtils.isTelegramApp()) {
            ConfigUtils.log('🔧 Быстрая авторизация в дебаг режиме для роли:', role);
            this.devModeAuth(role);
            return true;
        }

        // Обычный режим - показываем Telegram авторизацию
        this.showTelegramAuth();

        // Тактильная обратная связь
        TelegramApp.hapticFeedback('selection');

        ConfigUtils.log('Выбрана роль:', role);
        return true;
    },

    // Быстрая авторизация для дебаг режима
    devModeAuth(role) {
        const testUser = {
            id: CONFIG.DEV_USER.id,
            telegramId: CONFIG.DEV_USER.id,
            firstName: CONFIG.DEV_USER.first_name,
            lastName: CONFIG.DEV_USER.last_name || '',
            username: CONFIG.DEV_USER.username || '',
            role: role,
            languageCode: CONFIG.DEV_USER.language_code || 'ru',
            isPremium: false,
            photoUrl: '',
            registeredAt: new Date().toISOString(),
            referralCode: this.generateReferralCode(CONFIG.DEV_USER.id),
            referredBy: null
        };

        // Сохраняем пользователя
        this.currentUser = testUser;
        Storage.set(CONFIG.STORAGE_KEYS.USER_DATA, testUser);

        ConfigUtils.log('🔧 Тестовый пользователь создан:', testUser);

        // Переходим к основному приложению
        this.completeAuth();
    },

    // Показать информацию о пользователе Telegram
    showTelegramAuth() {
        const telegramUser = TelegramApp.getUserData();

        if (!telegramUser) {
            ConfigUtils.error('Не удалось получить данные пользователя Telegram');
            TelegramApp.showAlert('Ошибка получения данных пользователя');
            return;
        }

        // Показываем информацию о пользователе
        this.displayUserInfo(telegramUser);

        // Показываем кнопку подтверждения
        document.getElementById('telegram-auth').style.display = 'block';

        // Настраиваем обработчик подтверждения
        const confirmBtn = document.getElementById('confirm-auth');
        confirmBtn.onclick = () => this.confirmAuth(telegramUser);

        // Анимация появления
        document.getElementById('telegram-auth').classList.add('fade-in');
    },

    // Отображение информации о пользователе
    displayUserInfo(telegramUser) {
        const avatarEl = document.getElementById('user-avatar');
        const infoEl = document.getElementById('user-info');

        // Аватар (инициалы если нет фото)
        if (telegramUser.photoUrl) {
            avatarEl.innerHTML = `<img src="${telegramUser.photoUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const initials = this.getInitials(telegramUser.firstName, telegramUser.lastName);
            avatarEl.textContent = initials;
        }

        // Информация о пользователе
        const fullName = [telegramUser.firstName, telegramUser.lastName].filter(Boolean).join(' ');
        const roleText = this.selectedRole === CONFIG.USER_ROLES.TAROT ? 'Таролог' : 'Клиент';

        infoEl.innerHTML = `
            <h4>${fullName}</h4>
            <p>@${telegramUser.username || 'без username'}</p>
            <p>Роль: <strong>${roleText}</strong></p>
        `;
    },

    // Получить инициалы
    getInitials(firstName, lastName) {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last || '?';
    },

    // Подтверждение авторизации
    confirmAuth(telegramUser) {
        ConfigUtils.log('Подтверждение авторизации для пользователя:', telegramUser.id);

        // Создаем объект пользователя
        const user = {
            id: telegramUser.id,
            telegramId: telegramUser.id,
            firstName: telegramUser.firstName,
            lastName: telegramUser.lastName,
            username: telegramUser.username,
            role: this.selectedRole,
            languageCode: telegramUser.languageCode,
            isPremium: telegramUser.isPremium,
            photoUrl: telegramUser.photoUrl,
            registeredAt: new Date().toISOString(),
            referralCode: this.generateReferralCode(telegramUser.id),
            referredBy: TelegramApp.getReferralCode() // Кто пригласил
        };

        // Сохраняем пользователя
        this.currentUser = user;
        Storage.set(CONFIG.STORAGE_KEYS.USER_DATA, user);

        // Обрабатываем реферальную систему
        this.processReferral();

        // Тактильная обратная связь
        TelegramApp.hapticFeedback('success');

        // Переходим к основному приложению
        this.completeAuth();

        ConfigUtils.log('Авторизация завершена для пользователя:', user.firstName);
    },

    // Генерация реферального кода
    generateReferralCode(userId) {
        // Простой алгоритм генерации кода на основе ID пользователя
        const base = userId.toString();
        const hash = this.simpleHash(base);
        return `${base}_${hash}`;
    },

    // Простая хеш-функция
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36).substring(0, 6);
    },

    // Обработка реферальной системы
    processReferral() {
        const referralCode = TelegramApp.getReferralCode();

        if (referralCode && referralCode !== this.currentUser.referralCode) {
            ConfigUtils.log('Обработка реферала от:', referralCode);

            // Находим пользователя, который пригласил
            const referrer = this.findUserByReferralCode(referralCode);

            if (referrer) {
                // Добавляем бонус пригласившему
                ReferralSystem.addReferral(referrer.id, this.currentUser.id);

                // Уведомляем о скидке новому пользователю
                TelegramApp.showPopup(
                    'Добро пожаловать!',
                    `Вы получили скидку ${CONFIG.REFERRAL_SETTINGS.REFERRAL_DISCOUNT}% на первую консультацию благодаря реферальной ссылке!`
                );
            }
        }
    },

    // Поиск пользователя по реферальному коду
    findUserByReferralCode(referralCode) {
        // В реальном приложении это будет запрос к базе данных
        // Здесь используем localStorage для демонстрации
        const allUsers = Storage.get('all_users') || [];
        return allUsers.find(user => user.referralCode === referralCode);
    },

    // Завершение авторизации
    completeAuth() {
        ConfigUtils.log('Переход к основному приложению');

        // Скрываем экран авторизации
        document.getElementById('auth-screen').classList.remove('active');

        // Показываем основное приложение
        document.getElementById('main-app').classList.add('active');

        // Инициализируем интерфейс в зависимости от роли
        this.initRoleBasedInterface();

        // Настраиваем навигацию
        this.setupNavigation();
    },

    // Инициализация интерфейса в зависимости от роли
    initRoleBasedInterface() {
        const isClient = this.currentUser.role === CONFIG.USER_ROLES.CLIENT;
        const isTarot = this.currentUser.role === CONFIG.USER_ROLES.TAROT;

        // Показываем/скрываем элементы интерфейса
        const clientView = document.getElementById('client-booking');
        const tarotView = document.getElementById('tarot-admin');

        if (isClient) {
            clientView.style.display = 'block';
            tarotView.style.display = 'none';
            BookingSystem.init();
        } else if (isTarot) {
            clientView.style.display = 'none';
            tarotView.style.display = 'block';
            AdminPanel.init();
        }

        // Инициализируем профиль и рефералы для всех
        ProfileManager.init();
        ReferralSystem.init();
    },

    // Настройка навигации
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);

                // Тактильная обратная связь
                TelegramApp.hapticFeedback('selection');
            });
        });
    },

    // Переключение вкладок
    switchTab(tabName) {
        // Убираем активность со всех кнопок и вкладок
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        // Активируем выбранную вкладку
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Обновляем контент в зависимости от вкладки
        switch (tabName) {
            case 'booking':
                if (this.currentUser.role === CONFIG.USER_ROLES.CLIENT) {
                    BookingSystem.loadAvailableSlots();
                } else {
                    AdminPanel.loadBookings();
                }
                break;
            case 'profile':
                ProfileManager.loadProfile();
                break;
            case 'referral':
                ReferralSystem.loadReferralData();
                break;
        }

        ConfigUtils.log('Переключение на вкладку:', tabName);
    },

    // Выход из аккаунта
    logout() {
        TelegramApp.showConfirm('Вы уверены, что хотите выйти?', (confirmed) => {
            if (confirmed) {
                // Очищаем данные
                Storage.clear();
                this.currentUser = null;
                this.selectedRole = null;

                // Возвращаемся к экрану авторизации
                document.getElementById('main-app').classList.remove('active');
                document.getElementById('auth-screen').classList.add('active');

                ConfigUtils.log('Пользователь вышел из системы');
                TelegramApp.hapticFeedback('success');
            }
        });
    },

    // Получить текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    },

    // Проверить роль пользователя
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },

    // Обновить данные пользователя
    updateUser(updates) {
        if (!this.currentUser) return false;

        this.currentUser = { ...this.currentUser, ...updates };
        Storage.set(CONFIG.STORAGE_KEYS.USER_DATA, this.currentUser);

        ConfigUtils.log('Данные пользователя обновлены');
        return true;
    }
};

// Экспортируем модуль
window.AuthSystem = AuthSystem;