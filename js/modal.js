// Модуль модальных окон
const Modal = {
    currentModal: null,

    // Создать модальное окно
    create(options) {
        const modal = {
            id: 'modal_' + Date.now(),
            title: options.title || 'Модальное окно',
            content: options.content || '',
            buttons: options.buttons || [{ text: 'OK', action: () => this.close() }],
            size: options.size || 'medium', // small, medium, large, full
            closable: options.closable !== false,
            overlay: options.overlay !== false
        };

        return modal;
    },

    // Показать модальное окно
    show(modal) {
        if (this.currentModal) {
            this.close();
        }

        this.currentModal = modal;
        this.render(modal);

        // Анимация появления
        setTimeout(() => {
            const modalElement = document.getElementById(modal.id);
            if (modalElement) {
                modalElement.classList.add('active');
            }
        }, 10);

        // Тактильная обратная связь
        TelegramApp.hapticFeedback('selection');

        ConfigUtils.log('Модальное окно показано:', modal.title);
    },

    // Отрендерить модальное окно
    render(modal) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) {
            ConfigUtils.error('Контейнер modal-overlay не найден');
            return;
        }

        const sizeClass = `modal-${modal.size}`;
        const closableClass = modal.closable ? 'modal-closable' : '';

        overlay.innerHTML = `
            <div id="${modal.id}" class="modal ${sizeClass} ${closableClass}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${modal.title}</h3>
                        ${modal.closable ? `
                            <button class="modal-close-btn" onclick="Modal.close()">×</button>
                        ` : ''}
                    </div>

                    <div class="modal-body">
                        ${modal.content}
                    </div>

                    ${modal.buttons.length > 0 ? `
                        <div class="modal-footer">
                            ${modal.buttons.map((button, index) => `
                                <button
                                    class="modal-btn ${button.primary ? 'modal-btn-primary' : 'modal-btn-secondary'} ${button.danger ? 'modal-btn-danger' : ''}"
                                    onclick="Modal.handleButtonClick(${index})"
                                >
                                    ${button.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        overlay.classList.add('active');

        // Обработчик клика по overlay
        if (modal.closable && modal.overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            };
        }

        // Обработчик клавиш
        document.addEventListener('keydown', this.handleKeyPress);
    },

    // Обработать клик по кнопке
    handleButtonClick(buttonIndex) {
        if (!this.currentModal) return;

        const button = this.currentModal.buttons[buttonIndex];
        if (button && button.action) {
            button.action();
        }

        TelegramApp.hapticFeedback('selection');
    },

    // Обработать нажатие клавиш
    handleKeyPress(event) {
        if (!Modal.currentModal) return;

        switch (event.key) {
            case 'Escape':
                if (Modal.currentModal.closable) {
                    Modal.close();
                }
                break;
            case 'Enter':
                // Нажать первую primary кнопку
                const primaryButton = Modal.currentModal.buttons.find(btn => btn.primary);
                if (primaryButton && primaryButton.action) {
                    primaryButton.action();
                }
                break;
        }
    },

    // Закрыть модальное окно
    close() {
        if (!this.currentModal) return;

        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');

            setTimeout(() => {
                overlay.innerHTML = '';
            }, 300); // Время анимации
        }

        document.removeEventListener('keydown', this.handleKeyPress);

        ConfigUtils.log('Модальное окно закрыто');
        this.currentModal = null;

        TelegramApp.hapticFeedback('selection');
    },

    // Показать простое уведомление
    alert(title, message, buttonText = 'OK') {
        const modal = this.create({
            title: title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: buttonText,
                    primary: true,
                    action: () => this.close()
                }
            ],
            size: 'small'
        });

        this.show(modal);
    },

    // Показать подтверждение
    confirm(title, message, onConfirm, onCancel) {
        const modal = this.create({
            title: title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'Да',
                    primary: true,
                    action: () => {
                        this.close();
                        if (onConfirm) onConfirm();
                    }
                },
                {
                    text: 'Отмена',
                    action: () => {
                        this.close();
                        if (onCancel) onCancel();
                    }
                }
            ],
            size: 'small'
        });

        this.show(modal);
    },

    // Показать форму ввода
    prompt(title, message, defaultValue = '', onSubmit, onCancel) {
        const inputId = 'prompt_input_' + Date.now();

        const modal = this.create({
            title: title,
            content: `
                <p>${message}</p>
                <div class="form-group">
                    <input type="text" id="${inputId}" value="${defaultValue}" class="modal-input" autofocus>
                </div>
            `,
            buttons: [
                {
                    text: 'OK',
                    primary: true,
                    action: () => {
                        const input = document.getElementById(inputId);
                        const value = input ? input.value : '';
                        this.close();
                        if (onSubmit) onSubmit(value);
                    }
                },
                {
                    text: 'Отмена',
                    action: () => {
                        this.close();
                        if (onCancel) onCancel();
                    }
                }
            ],
            size: 'small'
        });

        this.show(modal);

        // Фокус на input после показа
        setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    },

    // Показать загрузку
    loading(message = 'Загрузка...') {
        const modal = this.create({
            title: '',
            content: `
                <div class="loading-modal">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `,
            buttons: [],
            closable: false,
            overlay: false,
            size: 'small'
        });

        // Добавляем стили загрузки если их нет
        if (!document.getElementById('loading-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'loading-modal-styles';
            styles.textContent = `
                .loading-modal {
                    text-align: center;
                    padding: 20px;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }

        this.show(modal);
        return modal;
    },

    // Скрыть загрузку
    hideLoading() {
        this.close();
    },

    // Показать изображение
    showImage(src, title = 'Изображение') {
        const modal = this.create({
            title: title,
            content: `
                <div style="text-align: center;">
                    <img src="${src}" alt="${title}" style="max-width: 100%; max-height: 70vh; border-radius: 10px;">
                </div>
            `,
            buttons: [
                {
                    text: 'Закрыть',
                    primary: true,
                    action: () => this.close()
                }
            ],
            size: 'large'
        });

        this.show(modal);
    },

    // Показать HTML контент
    showHTML(html, title = 'Информация', size = 'medium') {
        const modal = this.create({
            title: title,
            content: html,
            buttons: [
                {
                    text: 'Закрыть',
                    primary: true,
                    action: () => this.close()
                }
            ],
            size: size
        });

        this.show(modal);
    },

    // Показать список выбора
    showSelect(title, options, onSelect, onCancel) {
        const optionsHTML = options.map((option, index) => `
            <div class="select-option" onclick="Modal.selectOption(${index})" data-value="${option.value}">
                <div class="select-option-icon">${option.icon || '📋'}</div>
                <div class="select-option-content">
                    <div class="select-option-title">${option.title}</div>
                    ${option.description ? `<div class="select-option-description">${option.description}</div>` : ''}
                </div>
            </div>
        `).join('');

        const modal = this.create({
            title: title,
            content: `
                <div class="select-list">
                    ${optionsHTML}
                </div>
            `,
            buttons: [
                {
                    text: 'Отмена',
                    action: () => {
                        this.close();
                        if (onCancel) onCancel();
                    }
                }
            ],
            size: 'medium'
        });

        // Сохраняем колбэк для выбора
        this.currentSelectCallback = onSelect;

        // Добавляем стили если их нет
        if (!document.getElementById('select-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'select-modal-styles';
            styles.textContent = `
                .select-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .select-option {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    margin-bottom: 10px;
                }
                .select-option:hover {
                    background: #f8f9fa;
                }
                .select-option-icon {
                    font-size: 1.5rem;
                    margin-right: 15px;
                }
                .select-option-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                .select-option-description {
                    font-size: 0.9rem;
                    color: #666;
                }
            `;
            document.head.appendChild(styles);
        }

        this.show(modal);
    },

    // Обработать выбор опции
    selectOption(index) {
        if (this.currentSelectCallback && this.currentModal) {
            const options = this.currentModal.content.match(/data-value="([^"]*)"/g);
            if (options && options[index]) {
                const value = options[index].match(/data-value="([^"]*)"/)[1];
                this.close();
                this.currentSelectCallback(value, index);
            }
        }

        this.currentSelectCallback = null;
    },

    // Проверить открыто ли модальное окно
    isOpen() {
        return this.currentModal !== null;
    },

    // Получить текущее модальное окно
    getCurrent() {
        return this.currentModal;
    }
};

// Экспортируем модуль
window.Modal = Modal;