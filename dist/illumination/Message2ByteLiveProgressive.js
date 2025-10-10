"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Message2ByteLiveProgressive {
    static init(message2byte, message2bytePool) {
        // message2byte нужен для совместимости с API, но используется через pool
        return new Message2ByteLiveProgressive(message2bytePool);
    }
    constructor(message2bytePool) {
        this.items = new Map();
        this.baseMessage = '';
        this.progressBarIcons = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        this.progressBarIndex = 0;
        this.message2bytePool = message2bytePool;
    }
    /**
     * Устанавливает базовое сообщение
     */
    setBaseMessage(message) {
        this.baseMessage = message;
        return this;
    }
    /**
     * Добавляет новый пункт
     */
    appendItem(id, text, status = 'pending') {
        this.items.set(id, {
            id,
            text,
            status
        });
        return this;
    }
    /**
     * Изменяет существующий пункт
     */
    changeItem(id, text, status) {
        const existingItem = this.items.get(id);
        if (existingItem) {
            this.items.set(id, {
                ...existingItem,
                text,
                status: status || existingItem.status
            });
        }
        return this;
    }
    /**
     * Удаляет пункт по ID
     */
    removeItem(id) {
        this.items.delete(id);
        return this;
    }
    /**
     * Изменяет статус пункта
     */
    setItemStatus(id, status) {
        const item = this.items.get(id);
        if (item) {
            item.status = status;
        }
        return this;
    }
    /**
     * Запускает прогрессбар для конкретного пункта
     */
    sleepProgressBar(duration, itemId) {
        if (itemId) {
            this.activeProgressItem = itemId;
            const item = this.items.get(itemId);
            if (item) {
                item.progressBar = {
                    active: true,
                    duration,
                    infinite: !duration
                };
                item.status = 'active';
            }
        }
        this.startProgressBar(duration);
        return this;
    }
    /**
     * Останавливает прогрессбар
     */
    stopSleepProgress() {
        if (this.progressBarTimer) {
            clearInterval(this.progressBarTimer);
            this.progressBarTimer = undefined;
        }
        if (this.activeProgressItem) {
            const item = this.items.get(this.activeProgressItem);
            if (item && item.progressBar) {
                item.progressBar.active = false;
                item.status = 'completed';
            }
            this.activeProgressItem = undefined;
        }
        return this;
    }
    /**
     * Запускает анимацию прогрессбара
     */
    startProgressBar(duration) {
        if (this.progressBarTimer) {
            clearInterval(this.progressBarTimer);
        }
        this.progressBarTimer = setInterval(() => {
            this.progressBarIndex = (this.progressBarIndex + 1) % this.progressBarIcons.length;
            this.updateMessage();
        }, 200);
        if (duration) {
            setTimeout(() => {
                this.stopSleepProgress();
            }, duration);
        }
    }
    /**
     * Обновляет сообщение с текущими пунктами
     */
    updateMessage() {
        let message = this.baseMessage;
        if (this.items.size > 0) {
            message += '\n\n';
            // Сортируем пункты по ID
            const sortedItems = Array.from(this.items.values()).sort((a, b) => a.id - b.id);
            sortedItems.forEach(item => {
                const statusIcon = this.getStatusIcon(item);
                const progressIcon = this.getProgressIcon(item);
                message += `${statusIcon} ${item.text}${progressIcon}\n`;
            });
        }
        this.message2bytePool.update(message.trim());
    }
    /**
     * Получает иконку статуса для пункта
     */
    getStatusIcon(item) {
        switch (item.status) {
            case 'pending': return '⏳';
            case 'active': return '🔄';
            case 'completed': return '✅';
            case 'error': return '❌';
            default: return '⏳';
        }
    }
    /**
     * Получает иконку прогресса для пункта
     */
    getProgressIcon(item) {
        if (item.progressBar?.active && item.id === this.activeProgressItem) {
            return ` ${this.progressBarIcons[this.progressBarIndex]}`;
        }
        return '';
    }
    /**
     * Очищает все пункты
     */
    clear() {
        this.items.clear();
        return this;
    }
    /**
     * Получает все пункты
     */
    getItems() {
        return Array.from(this.items.values()).sort((a, b) => a.id - b.id);
    }
    /**
     * Получает пункт по ID
     */
    getItem(id) {
        return this.items.get(id);
    }
    /**
     * Отправляет сообщение
     */
    async send() {
        this.updateMessage();
        const entity = await this.message2bytePool.send();
        return entity;
    }
}
exports.default = Message2ByteLiveProgressive;
