export interface BotArtisanOptions {
    botName: string;
    sectionsPath?: string;
}
export declare class BotArtisan {
    private artisan;
    private options;
    constructor(botPath: string, options: BotArtisanOptions);
    run(): Promise<void>;
    private showHelp;
}
