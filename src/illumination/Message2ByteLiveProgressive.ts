import Message2byte from "./Message2Byte";
import Message2bytePool from "./Message2bytePool";

interface ProgressiveItem {
  id: number;
  text: string;
  status?: 'pending' | 'active' | 'completed' | 'error';
  caption?: string;
  progressBar?: {
    active: boolean;
    duration?: number;
    infinite?: boolean;
  };
}

export default class Message2ByteLiveProgressive {
  private message2byte: Message2byte;
  private message2bytePool: Message2bytePool;
  private items: Map<number, ProgressiveItem> = new Map();
  private baseMessage: string = '';
  private progressBarTimer?: NodeJS.Timeout;
  private progressBarIcons = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private progressBarIndex = 0;
  private activeProgressItem?: number;

  static init(message2byte: Message2byte, message2bytePool: Message2bytePool) {
    return new Message2ByteLiveProgressive(message2byte, message2bytePool);
  }

  constructor(message2byte: Message2byte, message2bytePool: Message2bytePool) {
    this.message2byte = message2byte;
    this.message2bytePool = message2bytePool;
  }

  /**
   * Устанавливает базовое сообщение
   */
  setBaseMessage(message: string): this {
    this.baseMessage = message;
    return this;
  }

  /**
   * Добавляет новый пункт
   */
  appendItem(id: number, text: string, status: 'pending' | 'active' | 'completed' | 'error' = 'pending'): this {
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
  changeItem(id: number, text: string, status?: 'pending' | 'active' | 'completed' | 'error'): this {
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

  setItemCaption(id: number, caption: string): this {
    const item = this.items.get(id);
    if (item) {
      item.caption = caption;
    }
    return this;
  }

  changeItemCaption(id: number, caption: string): this {
    const item = this.items.get(id);
    if (item) {
      item.caption = caption;
    }
    return this;
  }

  /**
   * Удаляет пункт по ID
   */
  removeItem(id: number): this {
    this.items.delete(id);
    return this;
  }

  /**
   * Изменяет статус пункта
   */
  setItemStatus(id: number, status: 'pending' | 'active' | 'completed' | 'error'): this {
    const item = this.items.get(id);
    if (item) {
      item.status = status;
    }
    return this;
  }

  setItemStatusError(id: number, errorText?: string): this {
    const item = this.items.get(id);
    if (item) {
      item.status = 'error';
      if (errorText) {
        item.text += ` - ${errorText}`;
      }
    }
    return this;
  }

  setItemStatusCompleted(id: number): this {
    const item = this.items.get(id);
    if (item) {
      item.status = 'completed';
    }
    return this;
  }

  /**
   * Запускает прогрессбар для конкретного пункта
   */
  sleepProgressBar(duration?: number, itemId?: number): this {
    if (!itemId) {
      itemId = this.items.size > 0 ? Array.from(this.items.keys())[this.items.size - 1] : undefined;
    }
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
  async stopSleepProgress(): Promise<this> {
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
      this.updateMessage();
      await this.message2bytePool.send();
    }

    return this;
  }

  /**
   * Запускает анимацию прогрессбара
   */
  private startProgressBar(duration?: number): void {
    if (this.progressBarTimer) {
      clearInterval(this.progressBarTimer);
    }

    this.progressBarTimer = setInterval(() => {
      this.progressBarIndex = (this.progressBarIndex + 1) % this.progressBarIcons.length;
      this.updateMessage();
      this.message2bytePool.send();
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
  private updateMessage(): void {
    let message = this.baseMessage;
    
    if (this.items.size > 0) {
      message += '\n\n';
      
      // Сортируем пункты по ID
      const sortedItems = Array.from(this.items.values()).sort((a, b) => a.id - b.id);
      
      sortedItems.forEach(item => {
        const statusIcon = this.getStatusIcon(item);
        const progressIcon = this.getProgressIcon(item);
        
        message += `${statusIcon} ${item.text}${progressIcon}\n`;

        if (item.caption) {
          if (this.message2byte.messageExtra && this.message2byte.messageExtra.parse_mode === 'html') {
            message += `   <i>${item.caption}</i>\n`;
          } else if (this.message2byte.messageExtra && this.message2byte.messageExtra.parse_mode === 'markdown') {
            message += `   _${item.caption}_\n`;
          } else {
            message += `   ${item.caption}\n`;
          }
        }
      });
    }

    this.message2bytePool.update(message.trim());
  }

  /**
   * Получает иконку статуса для пункта
   */
  private getStatusIcon(item: ProgressiveItem): string {
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
  private getProgressIcon(item: ProgressiveItem): string {
    if (item.progressBar?.active && item.id === this.activeProgressItem) {
      return ` ${this.progressBarIcons[this.progressBarIndex]}`;
    }
    return '';
  }

  /**
   * Очищает все пункты
   */
  clear(): this {
    this.items.clear();
    return this;
  }

  /**
   * Получает все пункты
   */
  getItems(): ProgressiveItem[] {
    return Array.from(this.items.values()).sort((a, b) => a.id - b.id);
  }

  /**
   * Получает пункт по ID
   */
  getItem(id: number): ProgressiveItem | undefined {
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
