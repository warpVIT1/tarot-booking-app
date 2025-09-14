// Модуль управления профилем
const ProfileManager = {
    // Инициализация
    init() {
        ConfigUtils.log('Инициализация управления профилем');
        this.loadProfile();
    },

    // Загрузить профиль
    loadProfile() {
        const container = document.getElementById('profile-content');
        if (!container) {
            ConfigUtils.log('Контейнер profile-content не найден');
            return;
        }

        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) {
            container.innerHTML = '<p>Ошибка: пользователь не авторизован</p>';
            return;
        }

        container.innerHTML = this.createProfileHTML(currentUser);
        ConfigUtils.log('Профиль загружен');
    },

    // Создать HTML профиля
    createProfileHTML(user) {
        const isClient = user.role === CONFIG.USER_ROLES.CLIENT;
        const isTarot = user.role === CONFIG.USER_ROLES.TAROT;

        // Получаем статистику пользователя
        const stats = this.getUserStatistics(user);

        return `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${user.photoUrl ?
                            `<img src="${user.photoUrl}" alt="Аватар" class="avatar-image">` :
                            `<div class="avatar-placeholder">${this.getInitials(user.firstName, user.lastName)}</div>`
                        }
                    </div>
                    <div class="profile-info">
                        <h2>${user.firstName} ${user.lastName || ''}</h2>
                        <p class="profile-role">${isTarot ? 'Таролог' : 'Клиент'}</p>
                        ${user.username ? `<p class="profile-username">@${user.username}</p>` : ''}
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>Статистика</h3>
                    <div class="stats-grid">
                        ${this.createStatsHTML(stats, user.role)}
                    </div>
                </div>

                <div class="profile-info-section">
                    <h3>Информация о профиле</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">ID пользователя:</span>
                            <span class="info-value">${user.id}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Telegram ID:</span>
                            <span class="info-value">${user.telegramId || user.id}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Язык:</span>
                            <span class="info-value">${user.languageCode || 'ru'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Telegram Premium:</span>
                            <span class="info-value">${user.isPremium ? 'Да' : 'Нет'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Дата регистрации:</span>
                            <span class="info-value">${new Date(user.registeredAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                    </div>
                </div>

                ${isTarot ? this.createTarotSettingsHTML() : ''}

                <div class="profile-actions">
                    <h3>Действия</h3>
                    <div class="actions-grid">
                        <button onclick="ProfileManager.editProfile()" class="action-btn">
                            ✏️ Редактировать профиль
                        </button>
                        <button onclick="ProfileManager.exportData()" class="action-btn">
                            📥 Экспортировать данные
                        </button>
                        <button onclick="ProfileManager.clearData()" class="action-btn danger">
                            🗑️ Очистить данные
                        </button>
                        <button onclick="AuthSystem.logout()" class="action-btn danger">
                            🚪 Выйти из аккаунта
                        </button>
                    </div>
                </div>

                <div class="profile-debug">
                    <h3>Информация о приложении</h3>
                    <div class="debug-info">
                        <div class="debug-item">
                            <span class="debug-label">Версия приложения:</span>
                            <span class="debug-value">${CONFIG.VERSION}</span>
                        </div>
                        <div class="debug-item">
                            <span class="debug-label">Режим разработки:</span>
                            <span class="debug-value">${CONFIG.DEV_MODE ? 'Включен' : 'Выключен'}</span>
                        </div>
                        <div class="debug-item">
                            <span class="debug-label">Поддержка Telegram:</span>
                            <span class="debug-value">${ConfigUtils.isTelegramApp() ? 'Да' : 'Нет'}</span>
                        </div>
                        <div class="debug-item">
                            <span class="debug-label">Размер данных:</span>
                            <span class="debug-value">${Storage.getStorageSize()} символов</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Получить инициалы
    getInitials(firstName, lastName) {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last || '?';
    },

    // Получить статистику пользователя
    getUserStatistics(user) {
        const isClient = user.role === CONFIG.USER_ROLES.CLIENT;

        if (isClient) {
            const bookings = BookingStorage.getUserBookings(user.id);
            const referrals = ReferralStorage.getUserReferrals(user.id);

            return {
                totalBookings: bookings.length,
                completedBookings: bookings.filter(b => b.status === CONFIG.BOOKING_STATUS.COMPLETED).length,
                pendingBookings: bookings.filter(b => b.status === CONFIG.BOOKING_STATUS.PENDING).length,
                referrals: referrals.length
            };
        } else {
            // Для тарологов
            const allBookings = BookingStorage.getAll(); // В реальном приложении фильтруем по tarotId
            const slots = TimeSlotStorage.getAll();
            const referrals = ReferralStorage.getUserReferrals(user.id);

            return {
                totalClients: allBookings.length,
                completedSessions: allBookings.filter(b => b.status === CONFIG.BOOKING_STATUS.COMPLETED).length,
                activeSlots: slots.filter(s => s.status === CONFIG.SLOT_STATUS.AVAILABLE).length,
                referrals: referrals.length
            };
        }
    },

    // Создать HTML статистики
    createStatsHTML(stats, userRole) {
        const isClient = userRole === CONFIG.USER_ROLES.CLIENT;

        if (isClient) {
            return `
                <div class="stat-item">
                    <div class="stat-number">${stats.totalBookings}</div>
                    <div class="stat-label">Всего записей</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.completedBookings}</div>
                    <div class="stat-label">Завершено</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.pendingBookings}</div>
                    <div class="stat-label">Ожидает</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.referrals}</div>
                    <div class="stat-label">Приглашено</div>
                </div>
            `;
        } else {
            return `
                <div class="stat-item">
                    <div class="stat-number">${stats.totalClients}</div>
                    <div class="stat-label">Всего клиентов</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.completedSessions}</div>
                    <div class="stat-label">Консультаций</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.activeSlots}</div>
                    <div class="stat-label">Активных слотов</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.referrals}</div>
                    <div class="stat-label">Приглашено</div>
                </div>
            `;
        }
    },

    // Создать настройки таролога
    createTarotSettingsHTML() {
        return `
            <div class="tarot-settings">
                <h3>Настройки таролога</h3>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Стоимость консультации (₽):</label>
                        <input type="number" id="consultation-price" value="2000" min="100" max="50000">
                    </div>
                    <div class="setting-item">
                        <label>Длительность консультации (мин):</label>
                        <select id="consultation-duration">
                            <option value="30">30 минут</option>
                            <option value="60" selected>60 минут</option>
                            <option value="90">90 минут</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Описание услуг:</label>
                        <textarea id="service-description" placeholder="Опишите свои услуги..." rows="3"></textarea>
                    </div>
                    <div class="setting-item">
                        <label>Контактная информация:</label>
                        <input type="text" id="contact-info" placeholder="Telegram, WhatsApp, email...">
                    </div>
                </div>
                <button onclick="ProfileManager.saveTarotSettings()" class="primary-btn">
                    Сохранить настройки
                </button>
            </div>
        `;
    },

    // Редактировать профиль
    editProfile() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) return;

        const modal = Modal.create({
            title: 'Редактировать профиль',
            content: `
                <div class="form-group">
                    <label>Имя:</label>
                    <input type="text" id="edit-first-name" value="${currentUser.firstName}">
                </div>
                <div class="form-group">
                    <label>Фамилия:</label>
                    <input type="text" id="edit-last-name" value="${currentUser.lastName || ''}">
                </div>
                <div class="form-group">
                    <label>Username (без @):</label>
                    <input type="text" id="edit-username" value="${currentUser.username || ''}">
                </div>
            `,
            buttons: [
                {
                    text: 'Сохранить',
                    action: () => this.saveProfileChanges(),
                    primary: true
                },
                {
                    text: 'Отмена',
                    action: () => Modal.close()
                }
            ]
        });

        Modal.show(modal);
    },

    // Сохранить изменения профиля
    saveProfileChanges() {
        const firstName = document.getElementById('edit-first-name')?.value?.trim();
        const lastName = document.getElementById('edit-last-name')?.value?.trim();
        const username = document.getElementById('edit-username')?.value?.trim();

        if (!firstName) {
            TelegramApp.showAlert('Имя обязательно для заполнения');
            return;
        }

        const updates = {
            firstName,
            lastName,
            username,
            updatedAt: new Date().toISOString()
        };

        AuthSystem.updateUser(updates);
        TelegramApp.showAlert('Профиль обновлен!');
        Components.showNotification('Профиль обновлен', 'success');
        TelegramApp.hapticFeedback('success');

        Modal.close();
        this.loadProfile();
    },

    // Сохранить настройки таролога
    saveTarotSettings() {
        const price = document.getElementById('consultation-price')?.value;
        const duration = document.getElementById('consultation-duration')?.value;
        const description = document.getElementById('service-description')?.value?.trim();
        const contactInfo = document.getElementById('contact-info')?.value?.trim();

        const settings = {
            consultationPrice: parseInt(price) || 2000,
            consultationDuration: parseInt(duration) || 60,
            serviceDescription: description,
            contactInfo: contactInfo,
            updatedAt: new Date().toISOString()
        };

        // Сохраняем настройки в профиле пользователя
        AuthSystem.updateUser({ tarotSettings: settings });

        TelegramApp.showAlert('Настройки сохранены!');
        Components.showNotification('Настройки таролога сохранены', 'success');
        TelegramApp.hapticFeedback('success');

        ConfigUtils.log('Настройки таролога сохранены:', settings);
    },

    // Экспортировать данные пользователя
    exportData() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) return;

        const userData = {
            profile: currentUser,
            bookings: BookingStorage.getUserBookings(currentUser.id),
            referrals: ReferralStorage.getUserReferrals(currentUser.id),
            slots: currentUser.role === CONFIG.USER_ROLES.TAROT ? TimeSlotStorage.getAll() : [],
            exportedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `tarot_profile_${currentUser.id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Components.showNotification('Данные экспортированы', 'success');
        TelegramApp.hapticFeedback('success');
    },

    // Очистить данные
    clearData() {
        TelegramApp.showConfirm(
            'Это действие удалит все ваши данные: записи, слоты времени, настройки. Продолжить?',
            (confirmed) => {
                if (confirmed) {
                    TelegramApp.showConfirm(
                        'Вы уверены? Это действие нельзя отменить!',
                        (doubleConfirmed) => {
                            if (doubleConfirmed) {
                                Storage.clear();
                                TelegramApp.showAlert('Все данные удалены. Приложение будет перезапущено.');
                                TelegramApp.hapticFeedback('success');

                                setTimeout(() => {
                                    window.location.reload();
                                }, 2000);
                            }
                        }
                    );
                }
            }
        );
    },

    // Получить настройки уведомлений
    getNotificationSettings() {
        const currentUser = AuthSystem.getCurrentUser();
        return currentUser?.notificationSettings || {
            bookingReminders: true,
            statusUpdates: true,
            promotional: false
        };
    },

    // Сохранить настройки уведомлений
    saveNotificationSettings(settings) {
        AuthSystem.updateUser({
            notificationSettings: settings,
            updatedAt: new Date().toISOString()
        });

        Components.showNotification('Настройки уведомлений сохранены', 'success');
    }
};

// Экспортируем модуль
window.ProfileManager = ProfileManager;