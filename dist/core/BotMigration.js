"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotMigration = void 0;
const chalk_1 = __importDefault(require("chalk"));
const migrate_1 = require("../console/migrate");
class BotMigration {
    constructor(options) {
        this.options = options;
    }
    async run() {
        console.log(chalk_1.default.blue(`🗃️ Running migrations for bot...`));
        try {
            await (0, migrate_1.setupMigrations)({
                pathMigrations: this.options.migrationsPath,
                pathDatabase: this.options.databasePath
            });
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Migration failed:'), error);
            throw error;
        }
    }
}
exports.BotMigration = BotMigration;
