import chalk from 'chalk';
import { Artisan } from '../illumination/Artisan';
import { UserModel } from '../user/UserModel';
import type { Database } from 'bun:sqlite'

export interface BotArtisanOptions {
  botName: string;
  sectionsPath?: string;
  db?: Database;
}

export class BotArtisan {
  private artisan: Artisan;
  private options: BotArtisanOptions;

  constructor(botPath: string, options: BotArtisanOptions) {
    this.options = options;
    this.artisan = new Artisan(botPath, { db: options.db });

    if (options.db) {
      UserModel.setDatabase(options.db);
    }
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

        case 'list:users': {
          const users = UserModel.getAll();
          if (!users.length) {
            console.log(chalk.yellow('No users found.'));
            break;
          }
          console.log(chalk.green('Users:'));
          users.forEach(u => {
            console.log(
              `ID: ${u.id} | Username: ${u.tgUsername} | Name: ${u.tgName} | Role: ${u.role}`
            );
          });
          break;
        }

        case 'set:admin': {
          if (args.length < 1) {
            console.error(chalk.red('❌ Error: User ID is required'));
            console.log('Usage: artisan set:admin <userId>');
            break;
          }
          const userId = Number(args[0]);

          const user = UserModel.findById(userId);

          if (!user) {
            console.error(chalk.red(`❌ Error: User with ID ${userId} not found`));
            break;
          }
          UserModel.update(userId, { role: 'admin' });
          console.log(chalk.green(`User ${user.tgUsername} (ID: ${userId}) is now admin.`));
          break;
        }

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

  list:users                    List all users
  set:admin <userId>            Set user role to admin

Examples:
  artisan make:section Auth     Create new AuthSection
  artisan add:method Auth login Add login method to AuthSection
  artisan list:sections        Show all available sections
  artisan list:users           Show all users
  artisan set:admin 1          Set user with ID 1 as admin
`);
  }
}