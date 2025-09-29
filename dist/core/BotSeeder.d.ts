import { Database } from 'bun:sqlite';
export interface BotSeederOptions {
    botPath: string;
    databasePath: string;
    seeders: Array<(db: Database) => Promise<void> | void>;
}
export declare class BotSeeder {
    private options;
    constructor(options: BotSeederOptions);
    run(): Promise<void>;
    private cleanDatabase;
}
