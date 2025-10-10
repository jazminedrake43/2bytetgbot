import Message2byte from "./Message2Byte";
import Message2bytePool from "./Message2bytePool";
interface ProgressiveItem {
    id: number;
    text: string;
    status?: 'pending' | 'active' | 'completed' | 'error';
    progressBar?: {
        active: boolean;
        duration?: number;
        infinite?: boolean;
    };
}
export default class Message2ByteLiveProgressive {
    private message2bytePool;
    private items;
    private baseMessage;
    private progressBarTimer?;
    private progressBarIcons;
    private progressBarIndex;
    private activeProgressItem?;
    static init(message2byte: Message2byte, message2bytePool: Message2bytePool): Message2ByteLiveProgressive;
    constructor(message2bytePool: Message2bytePool);
    /**
     * Устанавливает базовое сообщение
     */
    setBaseMessage(message: string): this;
    /**
     * Добавляет новый пункт
     */
    appendItem(id: number, text: string, status?: 'pending' | 'active' | 'completed' | 'error'): this;
    /**
     * Изменяет существующий пункт
     */
    changeItem(id: number, text: string, status?: 'pending' | 'active' | 'completed' | 'error'): this;
    /**
     * Удаляет пункт по ID
     */
    removeItem(id: number): this;
    /**
     * Изменяет статус пункта
     */
    setItemStatus(id: number, status: 'pending' | 'active' | 'completed' | 'error'): this;
    /**
     * Запускает прогрессбар для конкретного пункта
     */
    sleepProgressBar(duration?: number, itemId?: number): this;
    /**
     * Останавливает прогрессбар
     */
    stopSleepProgress(): this;
    /**
     * Запускает анимацию прогрессбара
     */
    private startProgressBar;
    /**
     * Обновляет сообщение с текущими пунктами
     */
    private updateMessage;
    /**
     * Получает иконку статуса для пункта
     */
    private getStatusIcon;
    /**
     * Получает иконку прогресса для пункта
     */
    private getProgressIcon;
    /**
     * Очищает все пункты
     */
    clear(): this;
    /**
     * Получает все пункты
     */
    getItems(): ProgressiveItem[];
    /**
     * Получает пункт по ID
     */
    getItem(id: number): ProgressiveItem | undefined;
    /**
     * Отправляет сообщение
     */
    send(): Promise<true | import("@telegraf/types").Message.TextMessage | import("@telegraf/types").Message.PhotoMessage | (import("@telegraf/types").Update.Edited & import("@telegraf/types").Message.CaptionableMessage)>;
}
export {};
