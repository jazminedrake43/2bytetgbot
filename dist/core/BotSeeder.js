"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotSeeder = void 0;
const chalk_1 = __importDefault(require("chalk"));
const bun_sqlite_1 = require("bun:sqlite");
class BotSeeder {
    constructor(options) {
        this.options = options;
    }
    async run() {
        const args = process.argv.slice(2);
        const isCleanOnly = args.includes('--clean-only');
        const isClear = args.includes('--clear');
        console.log(chalk_1.default.blue(`🌱 Running seeders for bot...`));
        const db = new bun_sqlite_1.Database(this.options.databasePath);
        try {
            if (isCleanOnly) {
                console.log(chalk_1.default.yellow('🧹 Cleaning database...'));
                await this.cleanDatabase(db);
                console.log(chalk_1.default.green('✅ Database cleaned successfully!'));
                return;
            }
            if (isClear) {
                console.log(chalk_1.default.yellow('🧹 Clearing and reseeding database...'));
                await this.cleanDatabase(db);
            }
            console.log(chalk_1.default.blue('🌱 Seeding database...'));
            for (const seeder of this.options.seeders) {
                await seeder(db);
            }
            console.log(chalk_1.default.green('✅ Database seeded successfully!'));
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Seeding failed:'), error);
            throw error;
        }
        finally {
            db.close();
        }
    }
    async cleanDatabase(db) {
        // Get all tables
        const tables = db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'
    `).all();
        // Clear all tables except migrations
        for (const table of tables) {
            db.query(`DELETE FROM ${table.name}`).run();
            console.log(chalk_1.default.yellow(`🧹 Cleared table: ${table.name}`));
        }
    }
}
exports.BotSeeder = BotSeeder;
