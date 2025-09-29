export declare class Artisan {
    private basePath;
    constructor(basePath: string);
    /**
     * Создает новую секцию
     * @param name Имя секции (например: Home, Auth, Settings)
     */
    createSection(name: string): Promise<void>;
    /**
     * Форматирует имя секции (первая буква заглавная, остальные строчные)
     */
    private formatSectionName;
    /**
     * Возвращает шаблон для новой секции
     */
    private getSectionTemplate;
    /**
     * Добавляет новый метод в существующую секцию
     */
    addMethod(sectionName: string, methodName: string): Promise<void>;
    /**
     * Выводит список всех секций
     */
    listSections(): Promise<void>;
}
