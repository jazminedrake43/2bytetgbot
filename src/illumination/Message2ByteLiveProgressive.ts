import Message2byte from "./Message2Byte";
import Message2bytePool from "./Message2bytePool";

export type Message2ByteLiveProgressiveStyle = 'default' | 'matrix' | 'neo' | 'clean';

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
  private style: Message2ByteLiveProgressiveStyle = 'default';
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

  setStyle(style: Message2ByteLiveProgressiveStyle): this {
    this.style = style;
    return this;
  }

  matrixStyle(): this {
    return this.setStyle('matrix');
  }

  neoStyle(): this {
    return this.setStyle('neo');
  }

  cleanStyle(): this {
    return this.setStyle('clean');
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
    const message = this.renderMessage();
    this.message2bytePool.update(message.trim());
  }

  private renderMessage(): string {
    if (this.style === 'matrix') {
      return this.renderMatrixMessage();
    }

    if (this.style === 'neo') {
      return this.renderNeoMessage();
    }

    if (this.style === 'clean') {
      return this.renderCleanMessage();
    }

    return this.renderDefaultMessage();
  }

  private renderDefaultMessage(): string {
    let message = this.baseMessage;

    if (this.items.size > 0) {
      message += '\n\n';

      this.getSortedItems().forEach(item => {
        const statusIcon = this.getStatusIcon(item);
        const progressIcon = this.getProgressIcon(item);

        message += `${statusIcon} ${item.text}${progressIcon}\n`;
        message += this.renderCaption(item, '   ');
      });
    }

    return message;
  }

  private renderMatrixMessage(): string {
    const lines: string[] = [];
    const baseMessage = this.baseMessage.trim();

    if (baseMessage) {
      lines.push(`[SYS] ${baseMessage}`);
    }

    if (this.items.size > 0) {
      lines.push('[SCAN] pipeline engaged');
      lines.push('');

      this.getSortedItems().forEach(item => {
        const statusLabel = this.getMatrixStatusLabel(item);
        const progressIcon = this.getProgressIcon(item);
        const signal = this.getMatrixSignal(item.id);

        lines.push(`[${statusLabel}] node-${item.id.toString().padStart(2, '0')} :: ${item.text} :: ${signal}${progressIcon}`);

        const caption = this.renderCaption(item, '    > ').trimEnd();
        if (caption) {
          lines.push(caption);
        }
      });
    }

    return lines.join('\n');
  }

  private getSortedItems(): ProgressiveItem[] {
    return Array.from(this.items.values()).sort((a, b) => a.id - b.id);
  }

  private renderCaption(item: ProgressiveItem, prefix: string): string {
    if (!item.caption) {
      return '';
    }

    if (this.message2byte.messageExtra && this.message2byte.messageExtra.parse_mode === 'html') {
      return `${prefix}<i>${item.caption}</i>\n`;
    }

    if (this.message2byte.messageExtra && this.message2byte.messageExtra.parse_mode === 'markdown') {
      return `${prefix}_${item.caption}_\n`;
    }

    return `${prefix}${item.caption}\n`;
  }

  private getMatrixStatusLabel(item: ProgressiveItem): string {
    switch (item.status) {
      case 'active': return 'EXEC';
      case 'completed': return 'SYNC';
      case 'error': return 'FAIL';
      case 'pending': return 'WAIT';
      default: return 'WAIT';
    }
  }

  private getMatrixSignal(id: number): string {
    const binary = id.toString(2).padStart(8, '0');
    return `${binary.slice(0, 4)}.${binary.slice(4)}`;
  }

  private renderNeoMessage(): string {
    const lines: string[] = [];
    const sep = '────────────────────────';

    if (this.baseMessage.trim()) {
      lines.push(`◈  ${this.baseMessage.trim()}`);
      lines.push(sep);
    }

    if (this.items.size > 0) {
      lines.push('');

      this.getSortedItems().forEach(item => {
        const icon = this.getNeoStatusIcon(item);
        const bar = this.getNeoProgressBar(item);
        const spinner = this.getProgressIcon(item);

        lines.push(`${icon}  ${item.text}   ${bar}${spinner}`);

        if (item.caption) {
          lines.push(`   ↳ ${item.caption}`);
        }

        lines.push('');
      });

      lines.push(sep);
    }

    return lines.join('\n').trim();
  }

  private getNeoStatusIcon(item: ProgressiveItem): string {
    switch (item.status) {
      case 'pending': return '○';
      case 'active': return '◎';
      case 'completed': return '◆';
      case 'error': return '✖';
      default: return '○';
    }
  }

  private renderCleanMessage(): string {
    const lines: string[] = [];

    if (this.baseMessage.trim()) {
      lines.push(`✨  ${this.baseMessage.trim()}`);
      lines.push('');
    }

    if (this.items.size > 0) {
      this.getSortedItems().forEach(item => {
        const icon = this.getCleanStatusIcon(item);
        const spinner = this.getProgressIcon(item);

        lines.push(`${icon}  ${item.text}${spinner}`);

        if (item.caption) {
          lines.push(`      ${item.caption}`);
        }
      });

      const total = this.items.size;
      const done = this.getSortedItems().filter(i => i.status === 'completed' || i.status === 'error').length;
      const barWidth = 10;
      const filled = Math.round((done / total) * barWidth);
      const bar = '▰'.repeat(filled) + '▱'.repeat(barWidth - filled);

      lines.push('');
      lines.push(`${bar}  ${done} / ${total}`);
    }

    return lines.join('\n').trim();
  }

  private getCleanStatusIcon(item: ProgressiveItem): string {
    switch (item.status) {
      case 'pending': return '⬜';
      case 'active': return '⏳';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⬜';
    }
  }

  private getNeoProgressBar(item: ProgressiveItem): string {
    const filled = '▓';
    const empty = '░';
    const width = 8;

    switch (item.status) {
      case 'completed':
      case 'error':
        return filled.repeat(width);
      case 'active':
        return filled.repeat(4) + empty.repeat(4);
      case 'pending':
      default:
        return empty.repeat(width);
    }
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