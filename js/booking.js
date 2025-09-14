// Модуль системы записей для клиентов
const BookingSystem = {
    selectedSlot: null,

    // Инициализация
    init() {
        ConfigUtils.log('Инициализация системы записей');
        this.loadAvailableSlots();
    },

    // Загрузить доступные временные слоты
    loadAvailableSlots() {
        const container = document.getElementById('available-slots');
        if (!container) {
            ConfigUtils.log('Контейнер available-slots не найден');
            return;
        }

        const availableSlots = TimeSlotStorage.getAvailable();
        ConfigUtils.log('Найдено доступных слотов:', availableSlots.length);

        if (availableSlots.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📅</div>
                    <h3>Свободного времени пока нет</h3>
                    <p>Попробуйте позже или предложите свое время в форме записи</p>
                </div>
            `;
            return;
        }

        container.innerHTML = availableSlots.map(slot =>
            Components.createTimeSlot(slot)
        ).join('');

        ConfigUtils.log('Доступные слоты загружены');
    },

    // Выбрать временной слот
    selectTimeSlot(slotId) {
        const slot = TimeSlotStorage.findById(slotId);
        if (!slot) {
            ConfigUtils.error('Слот не найден:', slotId);
            return;
        }

        if (slot.status !== CONFIG.SLOT_STATUS.AVAILABLE) {
            TelegramApp.showAlert('Этот временной слот уже недоступен');
            return;
        }

        this.selectedSlot = slot;
        ConfigUtils.log('Выбран слот:', slot);

        // Показываем форму записи
        this.showBookingForm(slot);

        // Тактильная обратная связь
        TelegramApp.hapticFeedback('selection');
    },

    // Показать форму записи
    showBookingForm(slot) {
        const formContainer = document.getElementById('booking-form');
        if (!formContainer) {
            ConfigUtils.error('Контейнер booking-form не найден');
            return;
        }

        formContainer.innerHTML = Components.createBookingForm(slot);
        formContainer.style.display = 'block';

        // Прокручиваем к форме
        formContainer.scrollIntoView({ behavior: 'smooth' });

        ConfigUtils.log('Форма записи показана');
    },

    // Отправить запись
    submitBooking(slotId) {
        const name = document.getElementById('client-name')?.value?.trim();
        const contact = document.getElementById('client-contact')?.value?.trim();
        const question = document.getElementById('client-question')?.value?.trim();
        const suggestedTime = document.getElementById('suggested-time')?.value;

        // Валидация
        if (!name) {
            TelegramApp.showAlert('Пожалуйста, укажите ваше имя');
            return;
        }

        if (!contact) {
            TelegramApp.showAlert('Пожалуйста, укажите способ связи');
            return;
        }

        // Проверяем что слот еще доступен
        const slot = TimeSlotStorage.findById(slotId);
        if (!slot || slot.status !== CONFIG.SLOT_STATUS.AVAILABLE) {
            TelegramApp.showAlert('Выбранное время уже недоступно. Пожалуйста, выберите другое время.');
            this.loadAvailableSlots();
            this.cancelBooking();
            return;
        }

        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) {
            ConfigUtils.error('Пользователь не авторизован');
            return;
        }

        // Создаем запись
        const booking = {
            clientId: currentUser.id,
            clientName: name,
            clientContact: contact,
            slotId: slotId,
            consultationType: 'online', // Только онлайн консультации
            question: question || '',
            suggestedTime: suggestedTime || null,
            tarotId: this.findTarotId() // В реальном приложении это будет из слота
        };

        try {
            // Сохраняем запись
            const savedBooking = BookingStorage.add(booking);

            // Обновляем статус слота
            TimeSlotStorage.update(slotId, { status: CONFIG.SLOT_STATUS.PENDING });

            ConfigUtils.log('Запись создана:', savedBooking);

            // Показываем уведомление об успехе
            TelegramApp.showAlert('Заявка отправлена! Таролог свяжется с вами для подтверждения.');

            // Тактильная обратная связь
            TelegramApp.hapticFeedback('success');

            // Очищаем форму и обновляем слоты
            this.cancelBooking();
            this.loadAvailableSlots();

            // Показываем уведомление в интерфейсе
            Components.showNotification('Заявка успешно отправлена!', 'success');

        } catch (error) {
            ConfigUtils.error('Ошибка создания записи:', error);
            TelegramApp.showAlert('Произошла ошибка при создании записи. Попробуйте еще раз.');
            TelegramApp.hapticFeedback('error');
        }
    },

    // Найти ID таролога (пока заглушка)
    findTarotId() {
        // В реальном приложении здесь будет поиск таролога
        // связанного с временным слотом
        return 987654321; // Тестовый ID
    },

    // Отменить запись
    cancelBooking() {
        const formContainer = document.getElementById('booking-form');
        if (formContainer) {
            formContainer.style.display = 'none';
            formContainer.innerHTML = '';
        }

        this.selectedSlot = null;
        ConfigUtils.log('Форма записи скрыта');

        // Убираем выделение со слотов
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
    },

    // Получить записи пользователя
    getUserBookings() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) {
            return [];
        }

        return BookingStorage.getUserBookings(currentUser.id);
    },

    // Показать историю записей
    showBookingHistory() {
        const bookings = this.getUserBookings();

        if (bookings.length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
                    <h3>У вас пока нет записей</h3>
                    <p>Выберите удобное время для первой консультации</p>
                </div>
            `;
        }

        return bookings.map(booking => Components.createBookingCard(booking)).join('');
    },

    // Отменить существующую запись
    cancelExistingBooking(bookingId) {
        TelegramApp.showConfirm('Вы уверены, что хотите отменить эту запись?', (confirmed) => {
            if (confirmed) {
                const booking = BookingStorage.findById(bookingId);
                if (booking) {
                    // Обновляем статус записи
                    BookingStorage.update(bookingId, { status: CONFIG.BOOKING_STATUS.CANCELLED });

                    // Освобождаем временной слот
                    if (booking.slotId) {
                        TimeSlotStorage.update(booking.slotId, { status: CONFIG.SLOT_STATUS.AVAILABLE });
                    }

                    ConfigUtils.log('Запись отменена:', bookingId);
                    TelegramApp.showAlert('Запись отменена');
                    TelegramApp.hapticFeedback('success');

                    // Обновляем интерфейс
                    this.loadAvailableSlots();
                    Components.showNotification('Запись отменена', 'success');
                }
            }
        });
    },

    // Проверить можно ли отменить запись
    canCancelBooking(booking) {
        if (booking.status !== CONFIG.BOOKING_STATUS.PENDING &&
            booking.status !== CONFIG.BOOKING_STATUS.CONFIRMED) {
            return false;
        }

        // Проверяем время (можно отменить минимум за час)
        const slot = TimeSlotStorage.findById(booking.slotId);
        if (slot) {
            const slotStart = new Date(slot.start);
            const now = new Date();
            const diffHours = (slotStart - now) / (1000 * 60 * 60);

            return diffHours >= 1; // Минимум час до начала
        }

        return true;
    },

    // Предложить альтернативное время
    suggestAlternativeTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0); // 14:00 завтра по умолчанию

        const suggestedTimeInput = document.getElementById('suggested-time');
        if (suggestedTimeInput) {
            suggestedTimeInput.value = tomorrow.toISOString().slice(0, 16);
        }
    }
};

// Экспортируем модуль
window.BookingSystem = BookingSystem;