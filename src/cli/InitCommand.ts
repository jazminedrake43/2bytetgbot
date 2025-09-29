import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export class InitCommand {
  async execute(options: any): Promise<void> {
    const currentDir = process.cwd();
    const packageJsonPath = path.join(currentDir, 'package.json');

    console.log(chalk.blue('🔧 Initializing 2byte bot in current directory...'));

    // Check if already a 2byte bot
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      if (packageJson.dependencies && packageJson.dependencies['2bytetgbot']) {
        if (!options.force) {
          console.log(chalk.yellow('⚠️  This directory already contains a 2byte bot.'));
          console.log(chalk.yellow('   Use --force to override existing files.'));
          return;
        }
      }
    }

    // Create basic bot structure
    await this.createBotStructure(currentDir, options);

    console.log(chalk.green('✅ 2byte bot initialized successfully!'));
    console.log(chalk.blue('📋 Next steps:'));
    console.log('   bun install           # Install dependencies');
    console.log('   bun run migrate        # Run migrations');
    console.log('   bun run seed           # Seed database');
    console.log('   bun run dev            # Start bot');
  }

  private async createBotStructure(targetPath: string, options: any): Promise<void> {
    const templatesPath = path.join(__dirname, '../../templates/bot');
    
    // Copy essential files
    const essentialFiles = [
      'package.json',
      'artisan.ts',
      'bot.ts',
      'sections.ts',
      '.env.example',
      'database/migrate.ts',
      'database/seed.ts',
    ];

    for (const file of essentialFiles) {
      const sourcePath = path.join(templatesPath, file);
      const targetFilePath = path.join(targetPath, file);

      if (await fs.pathExists(sourcePath)) {
        if (!options.force && await fs.pathExists(targetFilePath)) {
          console.log(chalk.yellow(`⚠️  Skipping ${file} (already exists)`));
          continue;
        }

        await fs.ensureDir(path.dirname(targetFilePath));
        
        // Read and process template
        let content = await fs.readFile(sourcePath, 'utf-8');
        
        // For now, use current directory name as bot name
        const botName = path.basename(targetPath);
        const config = {
          botName,
          className: this.toPascalCase(botName),
          kebabName: this.toKebabCase(botName),
          description: `A telegram bot created with 2byte framework`,
          author: '',
          useDatabase: true,
        };

        // Simple template replacement
        content = this.processTemplate(content, config);
        
        await fs.writeFile(targetFilePath, content);
        console.log(chalk.green(`✅ Created ${file}`));
      }
    }
  }

  private processTemplate(content: string, config: any): string {
    // Simple mustache-style replacement
    return content
      .replace(/\{\{botName\}\}/g, config.botName)
      .replace(/\{\{className\}\}/g, config.className)
      .replace(/\{\{kebabName\}\}/g, config.kebabName)
      .replace(/\{\{description\}\}/g, config.description)
      .replace(/\{\{author\}\}/g, config.author);
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}