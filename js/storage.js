// Модуль для работы с локальным хранилищем
const Storage = {
    // Сохранить данные
    set(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            ConfigUtils.log(`Данные сохранены в хранилище: ${key}`);
            return true;
        } catch (error) {
            ConfigUtils.error('Ошибка сохранения данных:', error);
            return false;
        }
    },

    // Получить данные
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            ConfigUtils.error('Ошибка загрузки данных:', error);
            return defaultValue;
        }
    },

    // Удалить данные
    remove(key) {
        try {
            localStorage.removeItem(key);
            ConfigUtils.log(`Данные удалены из хранилища: ${key}`);
            return true;
        } catch (error) {
            ConfigUtils.error('Ошибка удаления данных:', error);
            return false;
        }
    },

    // Очистить все данные приложения
    clear() {
        try {
            Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            ConfigUtils.log('Хранилище очищено');
            return true;
        } catch (error) {
            ConfigUtils.error('Ошибка очистки хранилища:', error);
            return false;
        }
    },

    // Проверить существование данных
    exists(key) {
        return localStorage.getItem(key) !== null;
    },

    // Получить размер данных в хранилище
    getStorageSize() {
        let total = 0;
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length;
            }
        });
        return total;
    }
};

// Модуль для работы с временными слотами
const TimeSlotStorage = {
    // Получить все временные слоты
    getAll() {
        return Storage.get(CONFIG.STORAGE_KEYS.TIME_SLOTS, []);
    },

    // Сохранить временные слоты
    saveAll(slots) {
        return Storage.set(CONFIG.STORAGE_KEYS.TIME_SLOTS, slots);
    },

    // Добавить временной слот
    add(slot) {
        const slots = this.getAll();
        slot.id = this.generateId();
        slot.createdAt = new Date().toISOString();
        slot.status = CONFIG.SLOT_STATUS.AVAILABLE;

        slots.push(slot);
        this.saveAll(slots);

        ConfigUtils.log('Добавлен временной слот:', slot);
        return slot;
    },

    // Обновить временной слот
    update(id, updates) {
        const slots = this.getAll();
        const index = slots.findIndex(slot => slot.id === id);

        if (index !== -1) {
            slots[index] = { ...slots[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveAll(slots);
            ConfigUtils.log('Обновлен временной слот:', id);
            return slots[index];
        }

        return null;
    },

    // Удалить временной слот
    remove(id) {
        const slots = this.getAll();
        const filteredSlots = slots.filter(slot => slot.id !== id);

        if (filteredSlots.length !== slots.length) {
            this.saveAll(filteredSlots);
            ConfigUtils.log('Удален временной слот:', id);
            return true;
        }

        return false;
    },

    // Найти слот по ID
    findById(id) {
        const slots = this.getAll();
        return slots.find(slot => slot.id === id);
    },

    // Получить доступные слоты
    getAvailable() {
        const slots = this.getAll();
        const now = new Date();

        return slots.filter(slot => {
            const slotStart = new Date(slot.start);
            return slot.status === CONFIG.SLOT_STATUS.AVAILABLE && slotStart > now;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
    },

    // Получить слоты по статусу
    getByStatus(status) {
        const slots = this.getAll();
        return slots.filter(slot => slot.status === status);
    },

    // Генерировать уникальный ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },

    // Очистить устаревшие слоты
    cleanupExpired() {
        const slots = this.getAll();
        const now = new Date();
        const validSlots = slots.filter(slot => {
            const slotEnd = new Date(slot.end);
            return slotEnd > now;
        });

        if (validSlots.length !== slots.length) {
            this.saveAll(validSlots);
            ConfigUtils.log('Очищены устаревшие слоты');
        }
    }
};

// Модуль для работы с записями
const BookingStorage = {
    // Получить все записи
    getAll() {
        return Storage.get(CONFIG.STORAGE_KEYS.BOOKINGS, []);
    },

    // Сохранить записи
    saveAll(bookings) {
        return Storage.set(CONFIG.STORAGE_KEYS.BOOKINGS, bookings);
    },

    // Добавить запись
    add(booking) {
        const bookings = this.getAll();
        booking.id = this.generateId();
        booking.createdAt = new Date().toISOString();
        booking.status = CONFIG.BOOKING_STATUS.PENDING;

        bookings.push(booking);
        this.saveAll(bookings);

        ConfigUtils.log('Добавлена запись:', booking);
        return booking;
    },

    // Обновить запись
    update(id, updates) {
        const bookings = this.getAll();
        const index = bookings.findIndex(booking => booking.id === id);

        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveAll(bookings);
            ConfigUtils.log('Обновлена запись:', id);
            return bookings[index];
        }

        return null;
    },

    // Удалить запись
    remove(id) {
        const bookings = this.getAll();
        const filteredBookings = bookings.filter(booking => booking.id !== id);

        if (filteredBookings.length !== bookings.length) {
            this.saveAll(filteredBookings);
            ConfigUtils.log('Удалена запись:', id);
            return true;
        }

        return false;
    },

    // Найти запись по ID
    findById(id) {
        const bookings = this.getAll();
        return bookings.find(booking => booking.id === id);
    },

    // Получить записи пользователя
    getUserBookings(userId) {
        const bookings = this.getAll();
        return bookings.filter(booking => booking.clientId === userId)
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // Получить записи по статусу
    getByStatus(status) {
        const bookings = this.getAll();
        return bookings.filter(booking => booking.status === status);
    },

    // Получить записи для таролога
    getTarotBookings(tarotId) {
        const bookings = this.getAll();
        return bookings.filter(booking => booking.tarotId === tarotId)
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // Генерировать уникальный ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
};

// Модуль для работы с рефералами
const ReferralStorage = {
    // Получить данные о рефералах
    getAll() {
        return Storage.get(CONFIG.STORAGE_KEYS.REFERRALS, {
            referrals: [],
            bonuses: [],
            stats: {
                totalReferrals: 0,
                totalBonus: 0,
                activeReferrals: 0
            }
        });
    },

    // Сохранить данные о рефералах
    saveAll(data) {
        return Storage.set(CONFIG.STORAGE_KEYS.REFERRALS, data);
    },

    // Добавить реферала
    addReferral(referrerId, referralId) {
        const data = this.getAll();

        const referral = {
            id: this.generateId(),
            referrerId: referrerId,
            referralId: referralId,
            createdAt: new Date().toISOString(),
            bonusGiven: false,
            active: true
        };

        data.referrals.push(referral);
        data.stats.totalReferrals += 1;
        data.stats.activeReferrals += 1;

        this.saveAll(data);
        ConfigUtils.log('Добавлен реферал:', referral);

        return referral;
    },

    // Получить рефералов пользователя
    getUserReferrals(userId) {
        const data = this.getAll();
        return data.referrals.filter(ref => ref.referrerId === userId);
    },

    // Добавить бонус
    addBonus(userId, amount, reason) {
        const data = this.getAll();

        const bonus = {
            id: this.generateId(),
            userId: userId,
            amount: amount,
            reason: reason,
            createdAt: new Date().toISOString()
        };

        data.bonuses.push(bonus);
        data.stats.totalBonus += amount;

        this.saveAll(data);
        ConfigUtils.log('Добавлен бонус:', bonus);

        return bonus;
    },

    // Получить бонусы пользователя
    getUserBonuses(userId) {
        const data = this.getAll();
        return data.bonuses.filter(bonus => bonus.userId === userId);
    },

    // Получить статистику пользователя
    getUserStats(userId) {
        const referrals = this.getUserReferrals(userId);
        const bonuses = this.getUserBonuses(userId);

        return {
            totalReferrals: referrals.length,
            activeReferrals: referrals.filter(ref => ref.active).length,
            totalBonus: bonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
            lastReferralDate: referrals.length > 0
                ? new Date(Math.max(...referrals.map(ref => new Date(ref.createdAt))))
                : null
        };
    },

    // Генерировать уникальный ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
};

// Экспортируем модули
window.Storage = Storage;
window.TimeSlotStorage = TimeSlotStorage;
window.BookingStorage = BookingStorage;
window.ReferralStorage = ReferralStorage;