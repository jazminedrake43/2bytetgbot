import { Database } from 'bun:sqlite';
export interface MigrationFile {
    id: number;
    name: string;
    path: string;
}
export declare class Migration {
    private db;
    private migrationsPath;
    constructor(db: Database, migrationsPath: string);
    /**
     * Инициализация таблицы миграций
     */
    private initMigrationsTable;
    /**
     * Получение списка файлов миграций
     */
    private getMigrationFiles;
    /**
     * Получение списка выполненных миграций
     */
    private getExecutedMigrations;
    /**
     * Выполнение миграции
     */
    up(): Promise<void>;
    /**
     * Откат миграций
     */
    down(steps?: number): Promise<void>;
    /**
     * Получение последнего номера batch
     */
    private getLastBatch;
    /**
     * Извлечение SQL для отката из файла миграции
     */
    private extractDownSQL;
    /**
     * Создание новой миграции
     */
    static create(name: string, migrationsPath: string): Promise<void>;
    /**
     * Статус миграций
     */
    status(): void;
}
