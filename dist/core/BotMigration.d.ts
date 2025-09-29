export interface BotMigrationOptions {
    botPath: string;
    migrationsPath: string;
    databasePath: string;
}
export declare class BotMigration {
    private options;
    constructor(options: BotMigrationOptions);
    run(): Promise<void>;
}
