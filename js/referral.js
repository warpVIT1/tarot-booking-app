// Модуль реферальной системы
const ReferralSystem = {
    // Инициализация
    init() {
        ConfigUtils.log('Инициализация реферальной системы');
        this.loadReferralData();
    },

    // Загрузить данные о рефералах
    loadReferralData() {
        const container = document.getElementById('referral-content');
        if (!container) {
            ConfigUtils.log('Контейнер referral-content не найден');
            return;
        }

        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) {
            container.innerHTML = '<p>Ошибка: пользователь не авторизован</p>';
            return;
        }

        container.innerHTML = this.createReferralHTML(currentUser);
        ConfigUtils.log('Данные реферальной системы загружены');
    },

    // Создать HTML реферальной системы
    createReferralHTML(user) {
        const referralLink = this.getReferralLink(user.referralCode);
        const stats = ReferralStorage.getUserStats(user.id);
        const referrals = ReferralStorage.getUserReferrals(user.id);
        const bonuses = ReferralStorage.getUserBonuses(user.id);

        return `
            <div class="referral-container">
                <div class="referral-header">
                    <h2>🎁 Реферальная программа</h2>
                    <p>Приглашайте друзей и получайте бонусы за каждого нового пользователя!</p>
                </div>

                <div class="referral-card">
                    <h3>Ваша реферальная ссылка</h3>
                    <div class="referral-link">
                        <code>${referralLink}</code>
                        <button class="copy-btn" onclick="ReferralSystem.copyReferralLink()">
                            📋 Копировать
                        </button>
                    </div>
                    <div class="referral-actions">
                        <button onclick="ReferralSystem.shareToTelegram()" class="action-btn">
                            📱 Поделиться в Telegram
                        </button>
                        <button onclick="ReferralSystem.generateQR()" class="action-btn">
                            📱 QR-код
                        </button>
                    </div>
                </div>

                <div class="referral-stats">
                    <h3>Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${stats.totalReferrals}</div>
                            <div class="stat-label">Всего приглашений</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.activeReferrals}</div>
                            <div class="stat-label">Активных рефералов</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.totalBonus}₽</div>
                            <div class="stat-label">Заработано бонусов</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${this.getNextBonusProgress(stats.totalReferrals)}%</div>
                            <div class="stat-label">До следующего бонуса</div>
                        </div>
                    </div>
                </div>

                <div class="referral-rewards">
                    <h3>Система наград</h3>
                    <div class="rewards-list">
                        <div class="reward-item ${stats.totalReferrals >= 1 ? 'achieved' : 'pending'}">
                            <div class="reward-icon">${stats.totalReferrals >= 1 ? '✅' : '⏳'}</div>
                            <div class="reward-info">
                                <div class="reward-title">Первый реферал</div>
                                <div class="reward-description">Бонус 50₽ за первого приглашенного</div>
                            </div>
                        </div>

                        <div class="reward-item ${stats.totalReferrals >= 3 ? 'achieved' : 'pending'}">
                            <div class="reward-icon">${stats.totalReferrals >= 3 ? '✅' : '⏳'}</div>
                            <div class="reward-info">
                                <div class="reward-title">3 реферала</div>
                                <div class="reward-description">Дополнительный бонус 100₽</div>
                            </div>
                        </div>

                        <div class="reward-item ${stats.totalReferrals >= 5 ? 'achieved' : 'pending'}">
                            <div class="reward-icon">${stats.totalReferrals >= 5 ? '✅' : '⏳'}</div>
                            <div class="reward-info">
                                <div class="reward-title">5 рефералов</div>
                                <div class="reward-description">Скидка 20% на все консультации</div>
                            </div>
                        </div>

                        <div class="reward-item ${stats.totalReferrals >= 10 ? 'achieved' : 'pending'}">
                            <div class="reward-icon">${stats.totalReferrals >= 10 ? '✅' : '⏳'}</div>
                            <div class="reward-info">
                                <div class="reward-title">10 рефералов</div>
                                <div class="reward-description">Бесплатная консультация</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${referrals.length > 0 ? `
                    <div class="referrals-list">
                        <h3>Ваши рефералы (${referrals.length})</h3>
                        <div class="referrals-grid">
                            ${referrals.map(referral => this.createReferralItemHTML(referral)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${bonuses.length > 0 ? `
                    <div class="bonuses-history">
                        <h3>История бонусов</h3>
                        <div class="bonuses-list">
                            ${bonuses.map(bonus => this.createBonusItemHTML(bonus)).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="referral-info">
                    <h3>Как это работает?</h3>
                    <div class="info-steps">
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <div class="step-title">Поделитесь ссылкой</div>
                                <div class="step-description">Отправьте вашу реферальную ссылку друзьям</div>
                            </div>
                        </div>

                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <div class="step-title">Друг регистрируется</div>
                                <div class="step-description">Ваш друг переходит по ссылке и регистрируется</div>
                            </div>
                        </div>

                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <div class="step-title">Получаете бонус</div>
                                <div class="step-description">Вы получаете бонус, друг получает скидку на первую консультацию</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Получить реферальную ссылку
    getReferralLink(referralCode) {
        return ConfigUtils.getBotReferralLink(referralCode);
    },

    // Скопировать реферальную ссылку
    copyReferralLink() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) return;

        const referralLink = this.getReferralLink(currentUser.referralCode);

        TelegramApp.copyToClipboard(referralLink);
        TelegramApp.showAlert('Реферальная ссылка скопирована!');
        Components.showNotification('Ссылка скопирована в буфер обмена', 'success');
        TelegramApp.hapticFeedback('success');

        ConfigUtils.log('Реферальная ссылка скопирована');
    },

    // Поделиться в Telegram
    shareToTelegram() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) return;

        TelegramApp.shareReferralLink(currentUser.referralCode);
        TelegramApp.hapticFeedback('selection');

        ConfigUtils.log('Открыто окно поделиться в Telegram');
    },

    // Генерировать QR-код
    generateQR() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) return;

        const referralLink = this.getReferralLink(currentUser.referralCode);

        // Простой QR-код через внешний сервис
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;

        const modal = Modal.create({
            title: 'QR-код для реферальной ссылки',
            content: `
                <div style="text-align: center;">
                    <img src="${qrUrl}" alt="QR-код" style="max-width: 100%; border-radius: 10px; margin: 20px 0;">
                    <p>Покажите этот QR-код друзьям для быстрого перехода по реферальной ссылке</p>
                    <div style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 0.9rem;">
                        ${referralLink}
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Скачать QR-код',
                    action: () => this.downloadQR(qrUrl),
                    primary: true
                },
                {
                    text: 'Закрыть',
                    action: () => Modal.close()
                }
            ]
        });

        Modal.show(modal);
        TelegramApp.hapticFeedback('success');
    },

    // Скачать QR-код
    downloadQR(qrUrl) {
        const a = document.createElement('a');
        a.href = qrUrl;
        a.download = 'tarot_referral_qr.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        Components.showNotification('QR-код скачан', 'success');
    },

    // Создать HTML элемента реферала
    createReferralItemHTML(referral) {
        const referralUser = this.findUserById(referral.referralId);
        const userName = referralUser ?
            `${referralUser.firstName} ${referralUser.lastName || ''}`.trim() :
            `Пользователь ${referral.referralId}`;

        const joinDate = new Date(referral.createdAt).toLocaleDateString('ru-RU');
        const statusIcon = referral.active ? '✅' : '⏸️';
        const statusText = referral.active ? 'Активен' : 'Неактивен';

        return `
            <div class="referral-item ${referral.active ? 'active' : 'inactive'}">
                <div class="referral-avatar">
                    ${referralUser?.photoUrl ?
                        `<img src="${referralUser.photoUrl}" alt="Аватар">` :
                        `<div class="avatar-placeholder">${userName.charAt(0)}</div>`
                    }
                </div>
                <div class="referral-info">
                    <div class="referral-name">${userName}</div>
                    <div class="referral-date">Присоединился: ${joinDate}</div>
                    <div class="referral-status">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
            </div>
        `;
    },

    // Создать HTML элемента бонуса
    createBonusItemHTML(bonus) {
        const date = new Date(bonus.createdAt).toLocaleDateString('ru-RU');
        const amount = bonus.amount > 0 ? `+${bonus.amount}₽` : `${bonus.amount}₽`;

        return `
            <div class="bonus-item">
                <div class="bonus-icon">💰</div>
                <div class="bonus-info">
                    <div class="bonus-amount">${amount}</div>
                    <div class="bonus-reason">${bonus.reason}</div>
                    <div class="bonus-date">${date}</div>
                </div>
            </div>
        `;
    },

    // Найти пользователя по ID (заглушка)
    findUserById(userId) {
        // В реальном приложении это будет запрос к базе данных
        // Здесь возвращаем фиктивные данные
        return {
            id: userId,
            firstName: 'Реферал',
            lastName: '',
            photoUrl: null
        };
    },

    // Получить прогресс до следующего бонуса
    getNextBonusProgress(totalReferrals) {
        const milestones = [1, 3, 5, 10, 20, 50];

        for (let milestone of milestones) {
            if (totalReferrals < milestone) {
                return Math.round((totalReferrals / milestone) * 100);
            }
        }

        return 100; // Достигнуты все цели
    },

    // Добавить реферала
    addReferral(referrerId, referralId) {
        const referral = ReferralStorage.addReferral(referrerId, referralId);

        // Проверяем достижения
        this.checkAchievements(referrerId);

        ConfigUtils.log('Добавлен реферал:', referral);
        return referral;
    },

    // Проверить достижения
    checkAchievements(userId) {
        const stats = ReferralStorage.getUserStats(userId);
        const achievements = [];

        // Первый реферал
        if (stats.totalReferrals === 1) {
            const bonus = ReferralStorage.addBonus(userId, 50, 'Бонус за первого реферала');
            achievements.push({ type: 'first_referral', bonus: 50 });
        }

        // 3 реферала
        if (stats.totalReferrals === 3) {
            const bonus = ReferralStorage.addBonus(userId, 100, 'Бонус за 3 рефералов');
            achievements.push({ type: 'three_referrals', bonus: 100 });
        }

        // 5 рефералов
        if (stats.totalReferrals === 5) {
            const bonus = ReferralStorage.addBonus(userId, 0, 'Скидка 20% разблокирована');
            achievements.push({ type: 'five_referrals', reward: 'discount_20' });
        }

        // 10 рефералов
        if (stats.totalReferrals === 10) {
            const bonus = ReferralStorage.addBonus(userId, 0, 'Бесплатная консультация разблокирована');
            achievements.push({ type: 'ten_referrals', reward: 'free_consultation' });
        }

        // Уведомляем о достижениях
        achievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });

        return achievements;
    },

    // Показать уведомление о достижении
    showAchievementNotification(achievement) {
        let message = '';
        let icon = '🎉';

        switch (achievement.type) {
            case 'first_referral':
                message = `Поздравляем! Вы получили ${achievement.bonus}₽ за первого реферала!`;
                icon = '🎁';
                break;
            case 'three_referrals':
                message = `Отлично! Бонус ${achievement.bonus}₽ за 3 рефералов!`;
                icon = '💰';
                break;
            case 'five_referrals':
                message = 'Супер! Разблокирована скидка 20% на все консультации!';
                icon = '🏆';
                break;
            case 'ten_referrals':
                message = 'Невероятно! Вы получили бесплатную консультацию!';
                icon = '👑';
                break;
        }

        TelegramApp.showPopup('Достижение разблокировано!', `${icon} ${message}`);
        Components.showNotification(message, 'success');
        TelegramApp.hapticFeedback('success');
    },

    // Применить реферальную скидку
    applyReferralDiscount(userId, amount) {
        const stats = ReferralStorage.getUserStats(userId);
        let discount = 0;

        // Скидка для новых пользователей
        const currentUser = AuthSystem.getCurrentUser();
        if (currentUser && currentUser.referredBy) {
            discount = Math.round(amount * (CONFIG.REFERRAL_SETTINGS.REFERRAL_DISCOUNT / 100));
        }

        // Дополнительная скидка за 5+ рефералов
        if (stats.totalReferrals >= 5) {
            discount = Math.max(discount, Math.round(amount * 0.20)); // 20% скидка
        }

        return {
            originalAmount: amount,
            discount: discount,
            finalAmount: amount - discount,
            reason: discount > 0 ? 'Реферальная скидка' : null
        };
    },

    // Получить доступные бонусы пользователя
    getAvailableBonuses(userId) {
        const bonuses = ReferralStorage.getUserBonuses(userId);
        const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

        return {
            totalAmount: totalBonus,
            canUse: totalBonus > 0,
            bonuses: bonuses
        };
    },

    // Использовать бонусы
    useBonuses(userId, amount) {
        const available = this.getAvailableBonuses(userId);

        if (!available.canUse || available.totalAmount <= 0) {
            return {
                success: false,
                message: 'У вас нет доступных бонусов'
            };
        }

        const useAmount = Math.min(amount, available.totalAmount);

        // Добавляем запись об использовании бонусов
        ReferralStorage.addBonus(userId, -useAmount, `Использованы бонусы для оплаты`);

        return {
            success: true,
            usedAmount: useAmount,
            remainingAmount: available.totalAmount - useAmount
        };
    },

    // Проверить статус реферальной программы
    getReferralStatus() {
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) return null;

        const stats = ReferralStorage.getUserStats(currentUser.id);
        const bonuses = this.getAvailableBonuses(currentUser.id);

        return {
            referralCode: currentUser.referralCode,
            referralLink: this.getReferralLink(currentUser.referralCode),
            stats: stats,
            bonuses: bonuses,
            achievements: this.getUnlockedAchievements(stats.totalReferrals)
        };
    },

    // Получить разблокированные достижения
    getUnlockedAchievements(totalReferrals) {
        return {
            firstReferral: totalReferrals >= 1,
            threeReferrals: totalReferrals >= 3,
            fiveReferrals: totalReferrals >= 5,
            tenReferrals: totalReferrals >= 10,
            discountUnlocked: totalReferrals >= 5,
            freeConsultationUnlocked: totalReferrals >= 10
        };
    }
};

// Экспортируем модуль
window.ReferralSystem = ReferralSystem;