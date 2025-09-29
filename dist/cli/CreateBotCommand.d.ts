export declare class CreateBotCommand {
    private templatesPath;
    constructor();
    execute(botName: string, options: any): Promise<void>;
    private getBotConfig;
    private copyTemplates;
    private copyTemplateFiles;
    private installDependencies;
    private toPascalCase;
    private toKebabCase;
}
