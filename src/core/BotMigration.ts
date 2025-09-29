import * as path from 'path';
import chalk from 'chalk';
import { setupMigrations } from '../console/migrate';

export interface BotMigrationOptions {
  botPath: string;
  migrationsPath: string;
  databasePath: string;
}

export class BotMigration {
  private options: BotMigrationOptions;

  constructor(options: BotMigrationOptions) {
    this.options = options;
  }

  async run(): Promise<void> {
    console.log(chalk.blue(`🗃️ Running migrations for bot...`));

    try {
      await setupMigrations({
        pathMigrations: this.options.migrationsPath,
        pathDatabase: this.options.databasePath
      });
    } catch (error) {
      console.error(chalk.red('❌ Migration failed:'), error);
      throw error;
    }
  }
}