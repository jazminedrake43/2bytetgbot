import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export class GenerateCommand {
  async generateSection(name: string): Promise<void> {
    console.log(chalk.blue(`🎯 Generating section: ${name}`));

    const currentDir = process.cwd();
    const sectionsDir = path.join(currentDir, 'sections');
    const sectionName = this.formatSectionName(name);
    const sectionPath = path.join(sectionsDir, `${sectionName}Section.ts`);

    // Ensure sections directory exists
    await fs.ensureDir(sectionsDir);

    // Check if section already exists
    if (await fs.pathExists(sectionPath)) {
      console.log(chalk.red(`❌ Section ${sectionName} already exists at ${sectionPath}`));
      return;
    }

    // Generate section content
    const template = this.getSectionTemplate(sectionName);
    await fs.writeFile(sectionPath, template);

    console.log(chalk.green(`✅ Created section ${sectionName} at ${sectionPath}`));
  }

  async generateService(name: string): Promise<void> {
    console.log(chalk.blue(`⚙️  Generating service: ${name}`));

    const currentDir = process.cwd();
    const servicesDir = path.join(currentDir, 'workflow', 'services');
    const serviceName = this.formatServiceName(name);
    const servicePath = path.join(servicesDir, `${serviceName}.ts`);

    // Ensure services directory exists
    await fs.ensureDir(servicesDir);

    // Check if service already exists
    if (await fs.pathExists(servicePath)) {
      console.log(chalk.red(`❌ Service ${serviceName} already exists at ${servicePath}`));
      return;
    }

    // Generate service content
    const template = this.getServiceTemplate(serviceName);
    await fs.writeFile(servicePath, template);

    console.log(chalk.green(`✅ Created service ${serviceName} at ${servicePath}`));
    console.log(chalk.yellow(`💡 Service will be automatically loaded from workflow/services directory`));
  }

  async generateMigration(name: string): Promise<void> {
    console.log(chalk.blue(`🗃️  Generating migration: ${name}`));

    const currentDir = process.cwd();
    const migrationsDir = path.join(currentDir, 'database', 'migrations');

    // Ensure migrations directory exists
    await fs.ensureDir(migrationsDir);

    // Get next migration ID
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .map(file => parseInt(file.split('_')[0]))
      .filter(id => !isNaN(id));

    const nextId = (Math.max(0, ...migrationFiles) + 1).toString().padStart(3, '0');
    const fileName = `${nextId}_${name}.sql`;
    const filePath = path.join(migrationsDir, fileName);

    const template = this.getMigrationTemplate(name);
    await fs.writeFile(filePath, template);

    console.log(chalk.green(`✅ Created migration: ${fileName}`));
  }

  private formatSectionName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private formatServiceName(name: string): string {
    // Convert to PascalCase and add "Service" suffix if not present
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    return pascalName.endsWith('Service') ? pascalName : `${pascalName}Service`;
  }

  private getSectionTemplate(name: string): string {
    return `import { Section } from "@2byte/tgbot-framework";
import { SectionOptions } from "@2byte/tgbot-framework";
import { InlineKeyboard } from "@2byte/tgbot-framework";

export default class ${name}Section extends Section {
  static command = "${name.toLowerCase()}";
  static description = "${name} section";
  static actionRoutes = {
    "${name}.index": "index",
  };
  
  public sectionId = "${name}";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard().addFootFixedButtons(this.btnHome);
  }

  public async up(): Promise<void> {}
  public async down(): Promise<void> {}
  public async setup(): Promise<void> {}
  public async unsetup(): Promise<void> {}

  async index() {
    const message = \`
      👋 Welcome to ${name} Section
    \`;

    await this.message(message)
      .inlineKeyboard(this.mainInlineKeyboard)
      .send();
  }
}
`;
  }

  private getServiceTemplate(name: string): string {
    return `import { App } from "@2byte/tgbot-framework";
import { ApiService } from "@2byte/tgbot-framework";

export default class ${name} extends ApiService {

    constructor(
        protected app: App,
        public name: string = "${name}"
    ) {
        super(app, name);
    }

    /**
     * Setup method called when service is registered
     * Use this for initialization tasks like setting up connections,
     * loading configurations, etc.
     */
    public async setup(): Promise<void> {
        // TODO: Add setup logic here
        this.app.debugLog(\`[\${this.name}] Service setup completed\`);
        return Promise.resolve();
    }

    /**
     * Cleanup method called when service is being destroyed
     * Use this for cleanup tasks like closing connections,
     * releasing resources, etc.
     */
    public async unsetup(): Promise<void> {
        // TODO: Add cleanup logic here
        this.app.debugLog(\`[\${this.name}] Service cleanup completed\`);
        return Promise.resolve();
    }

    /**
     * Main run method for the service
     * This is where your service's main logic should be implemented
     */
    public async run(): Promise<void> {
        // TODO: Add your service logic here
        this.app.debugLog(\`[\${this.name}] Service running\`);
        return Promise.resolve();
    }

    /**
     * Example method - you can add your own methods here
     */
    // public async exampleMethod(): Promise<void> {
    //     // Your custom logic
    // }
}
`;
  }

  private getMigrationTemplate(name: string): string {
    return `-- UP
CREATE TABLE IF NOT EXISTS ${name} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS ${name};
`;
  }
}