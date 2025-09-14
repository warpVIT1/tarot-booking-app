// Модуль панели администратора для тарологов
const AdminPanel = {
    // Инициализация
    init() {
        ConfigUtils.log('Инициализация панели администратора');
        this.loadBookings();
        this.setupTimeManagement();
    },

    // Загрузить записи
    loadBookings() {
        const container = document.getElementById('admin-bookings');
        if (!container) {
            ConfigUtils.log('Контейнер admin-bookings не найден');
            return;
        }

        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) {
            container.innerHTML = '<p>Ошибка: пользователь не авторизован</p>';
            return;
        }

        // Получаем все записи (в реальном приложении фильтруем по tarotId)
        const allBookings = BookingStorage.getAll();
        ConfigUtils.log('Найдено записей:', allBookings.length);

        if (allBookings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
                    <h3>Записей пока нет</h3>
                    <p>Добавьте доступное время, и клиенты смогут записаться</p>
                </div>
            `;
            return;
        }

        // Сортируем записи: сначала ожидающие, потом остальные
        const sortedBookings = allBookings.sort((a, b) => {
            const statusPriority = {
                [CONFIG.BOOKING_STATUS.PENDING]: 1,
                [CONFIG.BOOKING_STATUS.CONFIRMED]: 2,
                [CONFIG.BOOKING_STATUS.CANCELLED]: 3,
                [CONFIG.BOOKING_STATUS.COMPLETED]: 4
            };

            return statusPriority[a.status] - statusPriority[b.status];
        });

        container.innerHTML = sortedBookings.map(booking =>
            Components.createBookingCard(booking)
        ).join('');

        ConfigUtils.log('Записи загружены');
    },

    // Настройка управления временем
    setupTimeManagement() {
        const addButton = document.getElementById('add-time-btn');
        if (addButton) {
            addButton.onclick = () => this.showTimeManagementModal();
        }

        // Добавляем быстрые кнопки времени
        this.createQuickTimeButtons();
    },

    // Создать быстрые кнопки времени
    createQuickTimeButtons() {
        const container = document.getElementById('time-management');
        if (!container) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="time-management">
                <h3>Быстрое добавление времени</h3>

                <div class="form-group">
                    <label>Выберите дату:</label>
                    <input type="date" id="quick-date" value="${tomorrowStr}" min="${tomorrowStr}">
                </div>

                <div class="form-group">
                    <label>Доступное время:</label>
                    <div class="quick-times-grid" id="quick-times">
                        ${this.getQuickTimeOptions().map(time => `
                            <div class="time-option" data-time="${time.value}" onclick="AdminPanel.toggleTimeOption(this)">
                                ${time.label}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <button onclick="AdminPanel.addSelectedTimes()" class="primary-btn">
                        Добавить выбранное время
                    </button>
                </div>

                <div class="form-group">
                    <h4>Или добавить конкретное время:</h4>
                    <label>Начало:</label>
                    <input type="datetime-local" id="custom-start">
                    <label>Конец:</label>
                    <input type="datetime-local" id="custom-end">
                    <button onclick="AdminPanel.addCustomTime()" class="secondary-btn">
                        Добавить
                    </button>
                </div>

                <div class="form-group">
                    <h4>Управление существующими слотами:</h4>
                    <div id="existing-slots">
                        ${this.getExistingSlotsHTML()}
                    </div>
                </div>
            </div>
        `;
    },

    // Получить опции быстрого времени
    getQuickTimeOptions() {
        return [
            { label: '09:00 - 10:00', value: '09:00-10:00' },
            { label: '10:00 - 11:00', value: '10:00-11:00' },
            { label: '11:00 - 12:00', value: '11:00-12:00' },
            { label: '12:00 - 13:00', value: '12:00-13:00' },
            { label: '14:00 - 15:00', value: '14:00-15:00' },
            { label: '15:00 - 16:00', value: '15:00-16:00' },
            { label: '16:00 - 17:00', value: '16:00-17:00' },
            { label: '17:00 - 18:00', value: '17:00-18:00' },
            { label: '18:00 - 19:00', value: '18:00-19:00' },
            { label: '19:00 - 20:00', value: '19:00-20:00' },
            { label: '20:00 - 21:00', value: '20:00-21:00' }
        ];
    },

    // Переключить выбор времени
    toggleTimeOption(element) {
        element.classList.toggle('selected');
        TelegramApp.hapticFeedback('selection');
    },

    // Добавить выбранное время
    addSelectedTimes() {
        const selectedDate = document.getElementById('quick-date')?.value;
        const selectedTimes = document.querySelectorAll('.time-option.selected');

        if (!selectedDate) {
            TelegramApp.showAlert('Выберите дату');
            return;
        }

        if (selectedTimes.length === 0) {
            TelegramApp.showAlert('Выберите время');
            return;
        }

        let addedCount = 0;

        selectedTimes.forEach(timeElement => {
            const timeRange = timeElement.dataset.time;
            const [startTime, endTime] = timeRange.split('-');

            const slot = {
                start: `${selectedDate}T${startTime}`,
                end: `${selectedDate}T${endTime}`
            };

            // Проверяем что такой слот не существует
            if (!this.slotExists(slot)) {
                TimeSlotStorage.add(slot);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            TelegramApp.showAlert(`Добавлено временных слотов: ${addedCount}`);
            Components.showNotification(`Добавлено ${addedCount} временных слотов`, 'success');
            TelegramApp.hapticFeedback('success');

            // Очищаем выбор
            selectedTimes.forEach(element => element.classList.remove('selected'));

            // Обновляем список существующих слотов
            this.updateExistingSlots();

            // Обновляем основной интерфейс записей если нужно
            if (typeof BookingSystem !== 'undefined') {
                BookingSystem.loadAvailableSlots();
            }
        } else {
            TelegramApp.showAlert('Все выбранные слоты уже существуют');
        }
    },

    // Добавить произвольное время
    addCustomTime() {
        const start = document.getElementById('custom-start')?.value;
        const end = document.getElementById('custom-end')?.value;

        if (!start || !end) {
            TelegramApp.showAlert('Заполните время начала и окончания');
            return;
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const now = new Date();

        // Валидация
        if (startDate <= now) {
            TelegramApp.showAlert('Время начала должно быть в будущем');
            return;
        }

        if (endDate <= startDate) {
            TelegramApp.showAlert('Время окончания должно быть позже времени начала');
            return;
        }

        const duration = (endDate - startDate) / (1000 * 60); // в минутах
        if (duration < 30) {
            TelegramApp.showAlert('Минимальная продолжительность консультации: 30 минут');
            return;
        }

        if (duration > 120) {
            TelegramApp.showAlert('Максимальная продолжительность консультации: 2 часа');
            return;
        }

        const slot = { start, end };

        if (this.slotExists(slot)) {
            TelegramApp.showAlert('Такой временной слот уже существует');
            return;
        }

        TimeSlotStorage.add(slot);
        TelegramApp.showAlert('Временной слот добавлен!');
        Components.showNotification('Временной слот добавлен', 'success');
        TelegramApp.hapticFeedback('success');

        // Очищаем форму
        document.getElementById('custom-start').value = '';
        document.getElementById('custom-end').value = '';

        // Обновляем интерфейс
        this.updateExistingSlots();
        if (typeof BookingSystem !== 'undefined') {
            BookingSystem.loadAvailableSlots();
        }
    },

    // Проверить существует ли слот
    slotExists(newSlot) {
        const existingSlots = TimeSlotStorage.getAll();

        return existingSlots.some(slot =>
            slot.start === newSlot.start && slot.end === newSlot.end
        );
    },

    // Получить HTML существующих слотов
    getExistingSlotsHTML() {
        const slots = TimeSlotStorage.getAll();
        const futureSlots = slots.filter(slot => new Date(slot.start) > new Date());

        if (futureSlots.length === 0) {
            return '<p>Нет активных временных слотов</p>';
        }

        return futureSlots.map(slot => {
            const startDate = new Date(slot.start);
            const endDate = new Date(slot.end);
            const statusText = slot.status === CONFIG.SLOT_STATUS.AVAILABLE ? 'Свободно' :
                              slot.status === CONFIG.SLOT_STATUS.PENDING ? 'Ожидает подтверждения' : 'Забронировано';

            return `
                <div class="existing-slot ${slot.status}">
                    <div class="slot-info">
                        <strong>${startDate.toLocaleDateString('ru-RU')}</strong><br>
                        ${startDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} -
                        ${endDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                        <br>
                        <span class="status-badge status-${slot.status}">${statusText}</span>
                    </div>
                    ${slot.status === CONFIG.SLOT_STATUS.AVAILABLE ? `
                        <button onclick="AdminPanel.removeSlot('${slot.id}')" class="btn-remove">
                            Удалить
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    // Обновить список существующих слотов
    updateExistingSlots() {
        const container = document.getElementById('existing-slots');
        if (container) {
            container.innerHTML = this.getExistingSlotsHTML();
        }
    },

    // Удалить слот
    removeSlot(slotId) {
        TelegramApp.showConfirm('Удалить этот временной слот?', (confirmed) => {
            if (confirmed) {
                TimeSlotStorage.remove(slotId);
                TelegramApp.showAlert('Временной слот удален');
                Components.showNotification('Временной слот удален', 'success');
                TelegramApp.hapticFeedback('success');

                this.updateExistingSlots();
                if (typeof BookingSystem !== 'undefined') {
                    BookingSystem.loadAvailableSlots();
                }
            }
        });
    },

    // Подтвердить запись
    confirmBooking(bookingId) {
        const booking = BookingStorage.findById(bookingId);
        if (!booking) {
            ConfigUtils.error('Запись не найдена:', bookingId);
            return;
        }

        TelegramApp.showConfirm(`Подтвердить запись для ${booking.clientName}?`, (confirmed) => {
            if (confirmed) {
                // Обновляем статус записи
                BookingStorage.update(bookingId, {
                    status: CONFIG.BOOKING_STATUS.CONFIRMED,
                    confirmedAt: new Date().toISOString()
                });

                // Обновляем статус слота
                if (booking.slotId) {
                    TimeSlotStorage.update(booking.slotId, { status: CONFIG.SLOT_STATUS.BOOKED });
                }

                ConfigUtils.log('Запись подтверждена:', bookingId);
                TelegramApp.showAlert('Запись подтверждена!');
                Components.showNotification('Запись подтверждена', 'success');
                TelegramApp.hapticFeedback('success');

                // Обновляем интерфейс
                this.loadBookings();
                if (typeof BookingSystem !== 'undefined') {
                    BookingSystem.loadAvailableSlots();
                }
            }
        });
    },

    // Отклонить запись
    rejectBooking(bookingId) {
        const booking = BookingStorage.findById(bookingId);
        if (!booking) {
            ConfigUtils.error('Запись не найдена:', bookingId);
            return;
        }

        TelegramApp.showConfirm(`Отклонить запись для ${booking.clientName}?`, (confirmed) => {
            if (confirmed) {
                // Обновляем статус записи
                BookingStorage.update(bookingId, {
                    status: CONFIG.BOOKING_STATUS.CANCELLED,
                    cancelledAt: new Date().toISOString(),
                    cancelledBy: 'tarot'
                });

                // Освобождаем слот
                if (booking.slotId) {
                    TimeSlotStorage.update(booking.slotId, { status: CONFIG.SLOT_STATUS.AVAILABLE });
                }

                ConfigUtils.log('Запись отклонена:', bookingId);
                TelegramApp.showAlert('Запись отклонена, время снова доступно');
                Components.showNotification('Запись отклонена', 'warning');
                TelegramApp.hapticFeedback('success');

                // Обновляем интерфейс
                this.loadBookings();
                if (typeof BookingSystem !== 'undefined') {
                    BookingSystem.loadAvailableSlots();
                }
            }
        });
    },

    // Отметить как завершенную
    completeBooking(bookingId) {
        TelegramApp.showConfirm('Отметить консультацию как завершенную?', (confirmed) => {
            if (confirmed) {
                BookingStorage.update(bookingId, {
                    status: CONFIG.BOOKING_STATUS.COMPLETED,
                    completedAt: new Date().toISOString()
                });

                ConfigUtils.log('Консультация завершена:', bookingId);
                Components.showNotification('Консультация отмечена как завершенная', 'success');
                TelegramApp.hapticFeedback('success');

                this.loadBookings();
            }
        });
    },

    // Получить статистику
    getStatistics() {
        const allBookings = BookingStorage.getAll();
        const allSlots = TimeSlotStorage.getAll();

        const stats = {
            totalBookings: allBookings.length,
            pendingBookings: allBookings.filter(b => b.status === CONFIG.BOOKING_STATUS.PENDING).length,
            confirmedBookings: allBookings.filter(b => b.status === CONFIG.BOOKING_STATUS.CONFIRMED).length,
            completedBookings: allBookings.filter(b => b.status === CONFIG.BOOKING_STATUS.COMPLETED).length,
            availableSlots: allSlots.filter(s => s.status === CONFIG.SLOT_STATUS.AVAILABLE).length,
            bookedSlots: allSlots.filter(s => s.status === CONFIG.SLOT_STATUS.BOOKED).length
        };

        return stats;
    },

    // Показать статистику
    showStatistics() {
        const stats = this.getStatistics();

        return `
            <div class="admin-stats">
                <div class="stat-item">
                    <div class="stat-number">${stats.pendingBookings}</div>
                    <div class="stat-label">Ожидают подтверждения</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.confirmedBookings}</div>
                    <div class="stat-label">Подтверждено</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.completedBookings}</div>
                    <div class="stat-label">Завершено</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.availableSlots}</div>
                    <div class="stat-label">Свободных слотов</div>
                </div>
            </div>
        `;
    },

    // Экспортировать данные
    exportData() {
        const allBookings = BookingStorage.getAll();
        const allSlots = TimeSlotStorage.getAll();

        const data = {
            bookings: allBookings,
            slots: allSlots,
            exportedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `tarot_bookings_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Components.showNotification('Данные экспортированы', 'success');
    }
};

// Экспортируем модуль
window.AdminPanel = AdminPanel;