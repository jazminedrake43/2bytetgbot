import * as path from 'path';
import chalk from 'chalk';
import { Artisan } from '../illumination/Artisan';

export interface BotArtisanOptions {
  botName: string;
  sectionsPath?: string;
}

export class BotArtisan {
  private artisan: Artisan;
  private options: BotArtisanOptions;

  constructor(botPath: string, options: BotArtisanOptions) {
    this.options = options;
    this.artisan = new Artisan(botPath);
  }

  async run(): Promise<void> {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    if (!command) {
      this.showHelp();
      return;
    }

    try {
      switch (command) {
        case 'make:section':
          if (args.length === 0) {
            console.error(chalk.red('❌ Error: Section name is required'));
            console.log('Usage: artisan make:section SectionName');
            return;
          }
          await this.artisan.createSection(args[0]);
          break;

        case 'add:method':
          if (args.length < 2) {
            console.error(chalk.red('❌ Error: Section name and method name are required'));
            console.log('Usage: artisan add:method SectionName methodName');
            return;
          }
          await this.artisan.addMethod(args[0], args[1]);
          break;

        case 'list:sections':
          await this.artisan.listSections();
          break;

        default:
          console.error(chalk.red(`❌ Unknown command: ${command}`));
          this.showHelp();
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`❌ Error: ${error.message}`));
      } else {
        console.error(chalk.red('❌ An unknown error occurred'));
      }
    }
  }

  private showHelp(): void {
    console.log(`
🔧 ${this.options.botName} Artisan CLI

Available commands:
  make:section <name>           Create a new section
  add:method <section> <name>   Add a new method to existing section
  list:sections                 List all sections

Examples:
  artisan make:section Auth     Create new AuthSection
  artisan add:method Auth login Add login method to AuthSection
  artisan list:sections        Show all available sections
`);
  }
}