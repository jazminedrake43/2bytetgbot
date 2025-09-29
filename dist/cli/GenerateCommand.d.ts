export declare class GenerateCommand {
    generateSection(name: string): Promise<void>;
    generateMigration(name: string): Promise<void>;
    private formatSectionName;
    private getSectionTemplate;
    private getMigrationTemplate;
}
