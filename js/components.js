// Модуль переиспользуемых компонентов
const Components = {
    // Создать карточку временного слота
    createTimeSlot(slot) {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        const dateStr = startDate.toLocaleDateString('ru-RU');
        const timeStr = `${startDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - ${endDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;

        const statusClass = slot.status === CONFIG.SLOT_STATUS.AVAILABLE ? 'status-available' :
                           slot.status === CONFIG.SLOT_STATUS.PENDING ? 'status-pending' : 'status-booked';

        const statusText = slot.status === CONFIG.SLOT_STATUS.AVAILABLE ? 'Свободно' :
                          slot.status === CONFIG.SLOT_STATUS.PENDING ? 'Ожидает' : 'Занято';

        return `
            <div class="time-slot ${slot.status}" onclick="Components.selectTimeSlot('${slot.id}')" data-slot-id="${slot.id}">
                <div class="slot-date">${dateStr}</div>
                <div class="slot-time">${timeStr}</div>
                <div class="slot-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    },

    // Выбор временного слота
    selectTimeSlot(slotId) {
        if (typeof BookingSystem !== 'undefined') {
            BookingSystem.selectTimeSlot(slotId);
        } else {
            ConfigUtils.log('BookingSystem не найден');
        }
    },

    // Создать карточку записи
    createBookingCard(booking) {
        const slot = TimeSlotStorage.findById(booking.slotId);
        let timeInfo = 'Время не найдено';

        if (slot) {
            const startDate = new Date(slot.start);
            const endDate = new Date(slot.end);
            const dateStr = startDate.toLocaleDateString('ru-RU');
            const timeStr = `${startDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - ${endDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;
            timeInfo = `${dateStr} ${timeStr}`;
        }

        const statusClass = booking.status === CONFIG.BOOKING_STATUS.PENDING ? 'pending' :
                           booking.status === CONFIG.BOOKING_STATUS.CONFIRMED ? 'confirmed' : 'cancelled';

        const statusText = booking.status === CONFIG.BOOKING_STATUS.PENDING ? 'Ожидает' :
                          booking.status === CONFIG.BOOKING_STATUS.CONFIRMED ? 'Подтверждено' : 'Отменено';

        const suggestedTimeHtml = booking.suggestedTime ?
            `<div class="booking-info-item">
                <span class="booking-info-label">Предложенное время:</span>
                <span>${new Date(booking.suggestedTime).toLocaleString('ru-RU')}</span>
            </div>` : '';

        const actionsHtml = booking.status === CONFIG.BOOKING_STATUS.PENDING ? `
            <div class="booking-actions">
                <button class="btn-confirm" onclick="Components.confirmBooking('${booking.id}')">Подтвердить</button>
                <button class="btn-reject" onclick="Components.rejectBooking('${booking.id}')">Отклонить</button>
            </div>
        ` : '';

        return `
            <div class="booking-item ${statusClass}">
                <div class="booking-header">
                    <div class="booking-client">${booking.clientName}</div>
                    <span class="status-badge status-${booking.status}">${statusText}</span>
                </div>

                <div class="booking-info">
                    <div class="booking-info-item">
                        <span class="booking-info-label">Время:</span>
                        <span>${timeInfo}</span>
                    </div>
                    <div class="booking-info-item">
                        <span class="booking-info-label">Контакт:</span>
                        <span>${booking.clientContact}</span>
                    </div>
                    <div class="booking-info-item">
                        <span class="booking-info-label">Тип:</span>
                        <span>Онлайн консультация</span>
                    </div>
                    ${booking.question ? `
                        <div class="booking-info-item">
                            <span class="booking-info-label">Вопрос:</span>
                            <span>${booking.question}</span>
                        </div>
                    ` : ''}
                    ${suggestedTimeHtml}
                </div>

                ${actionsHtml}
            </div>
        `;
    },

    // Подтвердить запись
    confirmBooking(bookingId) {
        if (typeof AdminPanel !== 'undefined') {
            AdminPanel.confirmBooking(bookingId);
        } else {
            ConfigUtils.log('AdminPanel не найден');
        }
    },

    // Отклонить запись
    rejectBooking(bookingId) {
        if (typeof AdminPanel !== 'undefined') {
            AdminPanel.rejectBooking(bookingId);
        } else {
            ConfigUtils.log('AdminPanel не найден');
        }
    },

    // Создать форму записи
    createBookingForm(slot) {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        const dateStr = startDate.toLocaleDateString('ru-RU');
        const timeStr = `${startDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - ${endDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;

        return `
            <div class="booking-form fade-in">
                <h3>Заполните данные для записи</h3>

                <div class="form-group">
                    <label>Выбранное время:</label>
                    <input type="text" id="selected-time" value="${dateStr} ${timeStr}" readonly>
                </div>

                <div class="form-group">
                    <label>Ваше имя:</label>
                    <input type="text" id="client-name" required>
                </div>

                <div class="form-group">
                    <label>Телефон или Telegram:</label>
                    <input type="text" id="client-contact" required>
                </div>

                <div class="form-group">
                    <label>Тип консультации:</label>
                    <select id="consultation-type">
                        <option value="online">Онлайн</option>
                        <option value="offline">Личная встреча</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Вопрос или комментарий (необязательно):</label>
                    <textarea id="client-question" rows="3"></textarea>
                </div>

                <div class="form-group">
                    <label>Предложить свое время:</label>
                    <input type="datetime-local" id="suggested-time">
                    <small>Если удобное время не найдено</small>
                </div>

                <div class="form-actions">
                    <button class="btn-submit" onclick="Components.submitBookingForm('${slot.id}')">
                        Отправить заявку
                    </button>
                    <button class="btn-cancel" onclick="Components.cancelBookingForm()">
                        Отмена
                    </button>
                </div>
            </div>
        `;
    },

    // Отправить форму записи
    submitBookingForm(slotId) {
        if (typeof BookingSystem !== 'undefined') {
            BookingSystem.submitBooking(slotId);
        } else {
            ConfigUtils.log('BookingSystem не найден');
        }
    },

    // Отменить форму записи
    cancelBookingForm() {
        if (typeof BookingSystem !== 'undefined') {
            BookingSystem.cancelBooking();
        } else {
            ConfigUtils.log('BookingSystem не найден');
        }
    },

    // Создать уведомление
    createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Добавляем стили если их нет
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 400px;
                    border-left: 4px solid #2196f3;
                }
                .notification.success { border-left-color: #4caf50; }
                .notification.warning { border-left-color: #ff9800; }
                .notification.error { border-left-color: #f44336; }
                .notification-content {
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #666;
                    margin-left: 10px;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Автоматически убираем через 5 секунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        return notification;
    },

    // Показать уведомление
    showNotification(message, type = 'info') {
        this.createNotification(message, type);
    },

    // Форматировать дату
    formatDate(date) {
        return new Date(date).toLocaleDateString('ru-RU');
    },

    // Форматировать время
    formatTime(date) {
        return new Date(date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    },

    // Форматировать дату и время
    formatDateTime(date) {
        return new Date(date).toLocaleString('ru-RU');
    },

    // Проверить валидность email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Проверить валидность телефона
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    // Очистить HTML от потенциально опасных тегов
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
};

// Экспортируем модуль
window.Components = Components;