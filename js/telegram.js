// Модуль для работы с Telegram Web App API
const TelegramApp = {
    // Инициализация Telegram Web App
    init() {
        ConfigUtils.log('Инициализация Telegram Web App');

        if (!ConfigUtils.isTelegramApp()) {
            ConfigUtils.log('Приложение не запущено в Telegram, используем тестовый режим');
            this.initTestMode();
            return;
        }

        const tg = window.Telegram.WebApp;

        // Настройка внешнего вида
        tg.ready();
        tg.expand();

        // Применяем тему Telegram
        this.applyTheme();

        // Настройка кнопок
        this.setupMainButton();
        this.setupBackButton();

        // Обработка события закрытия
        tg.onEvent('mainButtonClicked', this.handleMainButtonClick.bind(this));
        tg.onEvent('backButtonClicked', this.handleBackButtonClick.bind(this));

        ConfigUtils.log('Telegram Web App инициализирован');
    },

    // Тестовый режим для разработки вне Telegram
    initTestMode() {
        window.Telegram = {
            WebApp: {
                initData: '',
                initDataUnsafe: {
                    user: CONFIG.DEV_USER,
                    start_param: 'ref_123456' // Тестовый реферальный код
                },
                colorScheme: 'light',
                ready: () => ConfigUtils.log('Telegram.WebApp.ready() called'),
                expand: () => ConfigUtils.log('Telegram.WebApp.expand() called'),
                close: () => {
                    if (CONFIG.DEV_MODE) {
                        alert('В реальном Telegram приложение закрылось бы');
                    }
                },
                MainButton: {
                    text: '',
                    show: () => ConfigUtils.log('MainButton.show() called'),
                    hide: () => ConfigUtils.log('MainButton.hide() called'),
                    setText: (text) => ConfigUtils.log('MainButton.setText():', text),
                    setParams: (params) => ConfigUtils.log('MainButton.setParams():', params)
                },
                BackButton: {
                    show: () => ConfigUtils.log('BackButton.show() called'),
                    hide: () => ConfigUtils.log('BackButton.hide() called')
                },
                onEvent: (event, callback) => ConfigUtils.log('onEvent():', event),
                showAlert: (message) => {
                    if (CONFIG.DEV_MODE) {
                        alert('📱 Telegram Alert:\n' + message);
                    } else {
                        alert(message);
                    }
                },
                showConfirm: (message, callback) => {
                    let result;
                    if (CONFIG.DEV_MODE) {
                        result = confirm('📱 Telegram Confirm:\n' + message);
                    } else {
                        result = confirm(message);
                    }
                    callback(result);
                },
                showPopup: (params, callback) => {
                    let message = params.message;
                    if (CONFIG.DEV_MODE) {
                        message = '📱 Telegram Popup:\n' + params.title + '\n\n' + message;
                    }
                    alert(message);
                    if (callback) callback('ok');
                },
                hapticFeedback: {
                    impactOccurred: (style) => ConfigUtils.log('Haptic impact:', style),
                    selectionChanged: () => ConfigUtils.log('Haptic selection changed'),
                    notificationOccurred: (type) => ConfigUtils.log('Haptic notification:', type)
                }
            }
        };
        ConfigUtils.log('Тестовый режим Telegram активирован');

        // Показываем в консоли что это дебаг режим
        if (CONFIG.DEV_MODE) {
            console.log(`
🔧 ========== DEV MODE ========== 🔧
📱 Telegram Web App эмулируется
👤 Тестовый пользователь: ${CONFIG.DEV_USER.first_name}
🚀 Для быстрого тестирования используйте Dev Panel (справа вверху)
🔧 =============================== 🔧
            `);
        }
    },

    // Применение темы Telegram
    applyTheme() {
        const tg = window.Telegram.WebApp;
        const theme = tg.colorScheme;

        if (theme === 'dark') {
            document.body.classList.add('dark');
        }

        // Применяем цвета темы Telegram
        if (tg.themeParams) {
            const root = document.documentElement;
            root.style.setProperty('--tg-bg-color', tg.themeParams.bg_color || '#ffffff');
            root.style.setProperty('--tg-text-color', tg.themeParams.text_color || '#000000');
            root.style.setProperty('--tg-hint-color', tg.themeParams.hint_color || '#999999');
            root.style.setProperty('--tg-button-color', tg.themeParams.button_color || '#40a7e3');
            root.style.setProperty('--tg-button-text-color', tg.themeParams.button_text_color || '#ffffff');
        }
    },

    // Получить данные пользователя
    getUserData() {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;

        if (!user) {
            ConfigUtils.log('Данные пользователя недоступны');
            return null;
        }

        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name || '',
            username: user.username || '',
            languageCode: user.language_code || 'ru',
            isPremium: user.is_premium || false,
            photoUrl: user.photo_url || ''
        };
    },

    // Получить реферальный код из параметров запуска
    getReferralCode() {
        const tg = window.Telegram.WebApp;
        const startParam = tg.initDataUnsafe?.start_param;

        if (startParam && startParam.startsWith('ref_')) {
            const referralCode = startParam.replace('ref_', '');
            ConfigUtils.log('Обнаружен реферальный код:', referralCode);
            return referralCode;
        }

        return null;
    },

    // Настройка главной кнопки
    setupMainButton() {
        const mainButton = window.Telegram.WebApp.MainButton;
        mainButton.hide();
    },

    // Показать главную кнопку
    showMainButton(text, callback) {
        const mainButton = window.Telegram.WebApp.MainButton;
        mainButton.setText(text);
        mainButton.show();
        this.mainButtonCallback = callback;
    },

    // Скрыть главную кнопку
    hideMainButton() {
        window.Telegram.WebApp.MainButton.hide();
        this.mainButtonCallback = null;
    },

    // Обработка клика по главной кнопке
    handleMainButtonClick() {
        if (this.mainButtonCallback) {
            this.mainButtonCallback();
        }
    },

    // Настройка кнопки "Назад"
    setupBackButton() {
        const backButton = window.Telegram.WebApp.BackButton;
        backButton.hide();
    },

    // Показать кнопку "Назад"
    showBackButton(callback) {
        const backButton = window.Telegram.WebApp.BackButton;
        backButton.show();
        this.backButtonCallback = callback;
    },

    // Скрыть кнопку "Назад"
    hideBackButton() {
        window.Telegram.WebApp.BackButton.hide();
        this.backButtonCallback = null;
    },

    // Обработка клика по кнопке "Назад"
    handleBackButtonClick() {
        if (this.backButtonCallback) {
            this.backButtonCallback();
        }
    },

    // Показать уведомление
    showAlert(message) {
        if (CONFIG.DEV_MODE && !ConfigUtils.isTelegramApp()) {
            // В дебаг режиме используем обычный alert
            alert('📱 ' + message);
        } else {
            // В Telegram используем нативный метод
            try {
                window.Telegram.WebApp.showAlert(message);
            } catch (error) {
                // Если метод не поддерживается, используем fallback
                alert(message);
            }
        }
    },

    // Показать подтверждение
    showConfirm(message, callback) {
        window.Telegram.WebApp.showConfirm(message, callback);
    },

    // Показать попап
    showPopup(title, message, buttons = ['ok']) {
        return new Promise((resolve) => {
            const params = {
                title,
                message,
                buttons: buttons.map(btn => ({
                    id: btn,
                    type: btn === 'ok' ? 'default' : 'destructive',
                    text: btn === 'ok' ? 'OK' : btn === 'cancel' ? 'Отмена' : btn
                }))
            };

            window.Telegram.WebApp.showPopup(params, (buttonId) => {
                resolve(buttonId);
            });
        });
    },

    // Тактильная обратная связь
    hapticFeedback(type = 'light') {
        const haptic = window.Telegram.WebApp.hapticFeedback;

        switch (type) {
            case 'light':
            case 'medium':
            case 'heavy':
                haptic.impactOccurred(type);
                break;
            case 'selection':
                haptic.selectionChanged();
                break;
            case 'success':
            case 'warning':
            case 'error':
                haptic.notificationOccurred(type);
                break;
        }
    },

    // Закрыть приложение
    close() {
        window.Telegram.WebApp.close();
    },

    // Поделиться ссылкой
    shareReferralLink(referralCode) {
        const botLink = ConfigUtils.getBotReferralLink(referralCode);
        const message = `🔮 Запишись на таро-консультацию через мою реферальную ссылку и получи скидку!\n\n${botLink}`;

        // В реальном Telegram это откроет диалог выбора чата
        if (window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(message)}`);
        } else {
            // Фоллбэк для копирования в буфер обмена
            this.copyToClipboard(botLink);
            this.showAlert('Ссылка скопирована в буфер обмена!');
        }
    },

    // Копировать в буфер обмена
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    // Фоллбэк для копирования
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            ConfigUtils.error('Не удалось скопировать текст:', err);
        }

        document.body.removeChild(textArea);
    },

    // Проверить, поддерживается ли функция
    isFeatureSupported(feature) {
        const tg = window.Telegram.WebApp;

        switch (feature) {
            case 'popup':
                return !!tg.showPopup;
            case 'haptic':
                return !!tg.hapticFeedback;
            case 'mainButton':
                return !!tg.MainButton;
            case 'backButton':
                return !!tg.BackButton;
            default:
                return false;
        }
    }
};

// Экспортируем модуль
window.TelegramApp = TelegramApp;