import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import Mustache from 'mustache';

export class CreateBotCommand {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '../../templates');
  }

  async execute(botName: string, options: any): Promise<void> {
    console.log(chalk.blue(`🚀 Creating new bot: ${botName}`));

    const targetPath = path.join(options.path, botName);

    // Check if directory already exists
    if (await fs.pathExists(targetPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${botName} already exists. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('⚠️  Operation cancelled'));
        return;
      }

      await fs.remove(targetPath);
    }

    // Create directory
    await fs.ensureDir(targetPath);

    // Get bot configuration
    const config = await this.getBotConfig(botName, options);

    // Copy templates
    await this.copyTemplates(targetPath, config);

    // Install dependencies if requested
    if (config.installDeps) {
      await this.installDependencies(targetPath);
    }

    console.log(chalk.green(`✅ Bot ${botName} created successfully!`));
    console.log(chalk.blue('📋 Next steps:'));
    console.log(`   cd ${botName}`);
    console.log(`   ${config.installDeps ? '' : 'bun install'}${config.installDeps ? '' : ' # Install dependencies'}`);
    console.log('   bun run migrate        # Run migrations');
    console.log('   bun run seed           # Seed database');
    console.log('   bun run dev            # Start bot');
  }

  private async getBotConfig(botName: string, options: any) {
    const questions = [
      {
        type: 'input',
        name: 'description',
        message: 'Bot description:',
        default: `A telegram bot created with 2byte framework`,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: '',
      },
      {
        type: 'confirm',
        name: 'useDatabase',
        message: 'Include database setup?',
        default: !options.noDatabase,
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies now?',
        default: true,
      },
    ];

    const answers = await inquirer.prompt(questions);

    return {
      botName,
      ...answers,
      className: this.toPascalCase(botName),
      kebabName: this.toKebabCase(botName),
    };
  }

  private async copyTemplates(targetPath: string, config: any): Promise<void> {
    const templatePath = path.join(this.templatesPath, 'bot');

    // Copy all files from template
    await this.copyTemplateFiles(templatePath, targetPath, config);
  }

  private async copyTemplateFiles(sourcePath: string, targetPath: string, config: any): Promise<void> {
    const items = await fs.readdir(sourcePath);

    for (const item of items) {
      const sourceItemPath = path.join(sourcePath, item);
      const targetItemPath = path.join(targetPath, item);

      const stat = await fs.stat(sourceItemPath);

      if (stat.isDirectory()) {
        await fs.ensureDir(targetItemPath);
        await this.copyTemplateFiles(sourceItemPath, targetItemPath, config);
      } else {
        // Read file content
        let content = await fs.readFile(sourceItemPath, 'utf-8');
        
        // Process template
        content = Mustache.render(content, config);
        
        // Write processed content
        await fs.writeFile(targetItemPath, content);
      }
    }
  }

  private async installDependencies(targetPath: string): Promise<void> {
    console.log(chalk.blue('📦 Installing dependencies...'));
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const install = spawn('bun', ['install'], { 
        cwd: targetPath, 
        stdio: 'inherit' 
      });

      install.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
    });
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