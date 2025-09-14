// Конфигурация приложения
const CONFIG = {
    // Основные настройки
    APP_NAME: 'Tarot Booking',
    VERSION: '1.0.0',

    // Telegram Bot настройки
    BOT_USERNAME: 'your_tarot_bot', // Замените на ваш бот

    // API endpoints (если будете подключать бэкенд)
    API_BASE_URL: 'https://your-api.com/api',

    // Локальное хранилище ключи
    STORAGE_KEYS: {
        USER_DATA: 'tarot_user_data',
        TIME_SLOTS: 'tarot_time_slots',
        BOOKINGS: 'tarot_bookings',
        REFERRALS: 'tarot_referrals',
        SETTINGS: 'tarot_settings'
    },

    // Роли пользователей
    USER_ROLES: {
        CLIENT: 'client',
        TAROT: 'tarot'
    },

    // Статусы записей
    BOOKING_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed'
    },

    // Статусы временных слотов
    SLOT_STATUS: {
        AVAILABLE: 'available',
        PENDING: 'pending',
        BOOKED: 'booked'
    },

    // Типы консультаций
    CONSULTATION_TYPES: {
        ONLINE: 'online'
    },

    // Настройки времени
    TIME_SETTINGS: {
        DEFAULT_DURATION: 60, // минуты
        MIN_BOOKING_HOURS: 2, // минимум часов до записи
        MAX_BOOKING_DAYS: 30, // максимум дней для записи вперед
        WORKING_HOURS: {
            START: '09:00',
            END: '21:00'
        }
    },

    // Реферальная система
    REFERRAL_SETTINGS: {
        BONUS_AMOUNT: 100, // бонус за реферала (в рублях или условных единицах)
        MIN_REFERRALS_FOR_BONUS: 3, // минимум рефералов для получения бонуса
        REFERRAL_DISCOUNT: 10 // скидка рефералу в процентах
    },

    // Цены и услуги
    SERVICES: {
        DEFAULT_PRICE: 2000,
        CONSULTATION_TYPES: [
            { id: 'basic', name: 'Базовая консультация', duration: 60, price: 2000 },
            { id: 'extended', name: 'Расширенная консультация', duration: 90, price: 2800 },
            { id: 'express', name: 'Экспресс-консультация', duration: 30, price: 1200 }
        ]
    },

    // Уведомления
    NOTIFICATIONS: {
        ENABLED: true,
        BOOKING_REMINDER_HOURS: 2, // напоминание за N часов
        SOUND_ENABLED: false
    },

    // Дебаг режим
    DEBUG: true,

    // Режим разработки (работает без Telegram)
    DEV_MODE: true,

    // Тестовые данные для разработки
    DEV_USER: {
        id: 12345678,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user',
        language_code: 'ru'
    },

    // Временные зоны
    TIMEZONE: 'Europe/Moscow'
};

// Функции для работы с конфигурацией
const ConfigUtils = {
    // Получить настройки пользователя
    getUserSettings() {
        const settings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
        return settings ? JSON.parse(settings) : {};
    },

    // Сохранить настройки пользователя
    saveUserSettings(settings) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // Получить полную ссылку на бота с реферальным кодом
    getBotReferralLink(referralCode) {
        return `https://t.me/${CONFIG.BOT_USERNAME}?start=${referralCode}`;
    },

    // Проверить, запущено ли приложение в Telegram
    isTelegramApp() {
        return window.Telegram && window.Telegram.WebApp;
    },

    // Получить тему (светлая/темная)
    getTheme() {
        if (this.isTelegramApp()) {
            return window.Telegram.WebApp.colorScheme || 'light';
        }
        return 'light';
    },

    // Логирование (только в режиме дебага)
    log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[Tarot App]:', ...args);
        }
    },

    // Обработка ошибок
    error(...args) {
        console.error('[Tarot App Error]:', ...args);
    }
};

// Экспортируем для использования в других модулях
window.CONFIG = CONFIG;
window.ConfigUtils = ConfigUtils;