import * as path from 'path';
import chalk from 'chalk';
import { Database } from 'bun:sqlite';

export interface BotSeederOptions {
  botPath: string;
  databasePath: string;
  seeders: Array<(db: Database) => Promise<void> | void>;
}

export class BotSeeder {
  private options: BotSeederOptions;

  constructor(options: BotSeederOptions) {
    this.options = options;
  }

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const isCleanOnly = args.includes('--clean-only');
    const isClear = args.includes('--clear');

    console.log(chalk.blue(`🌱 Running seeders for bot...`));

    const db = new Database(this.options.databasePath);

    try {
      if (isCleanOnly) {
        console.log(chalk.yellow('🧹 Cleaning database...'));
        await this.cleanDatabase(db);
        console.log(chalk.green('✅ Database cleaned successfully!'));
        return;
      }

      if (isClear) {
        console.log(chalk.yellow('🧹 Clearing and reseeding database...'));
        await this.cleanDatabase(db);
      }

      console.log(chalk.blue('🌱 Seeding database...'));
      for (const seeder of this.options.seeders) {
        await seeder(db);
      }

      console.log(chalk.green('✅ Database seeded successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Seeding failed:'), error);
      throw error;
    } finally {
      db.close();
    }
  }

  private async cleanDatabase(db: Database): Promise<void> {
    // Get all tables
    const tables = db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'
    `).all() as Array<{ name: string }>;

    // Clear all tables except migrations
    for (const table of tables) {
      db.query(`DELETE FROM ${table.name}`).run();
      console.log(chalk.yellow(`🧹 Cleared table: ${table.name}`));
    }
  }
}