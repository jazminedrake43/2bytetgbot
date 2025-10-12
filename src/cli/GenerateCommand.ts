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