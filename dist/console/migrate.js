#!/usr/bin/env bun
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMigrations = void 0;
const bun_sqlite_1 = require("bun:sqlite");
const Migration_1 = require("../illumination/Migration");
const path_1 = __importDefault(require("path"));
async function main(params = {}) {
    const MIGRATIONS_PATH = params.pathMigrations || path_1.default.join(__dirname, 'migrations');
    const command = process.argv[2];
    const args = process.argv.slice(3);
    if (!command) {
        showHelp();
        return;
    }
    const db = new bun_sqlite_1.Database(params.pathDatabase || __dirname + '/database/database.sqlite');
    const migration = new Migration_1.Migration(db, MIGRATIONS_PATH);
    try {
        switch (command) {
            case 'create':
                if (args.length === 0) {
                    console.error('❌ Ошибка: Требуется имя миграции');
                    console.log('Использование: migrate create migration_name');
                    return;
                }
                await Migration_1.Migration.create(args[0], MIGRATIONS_PATH);
                break;
            case 'up':
                await migration.up();
                console.log('✅ Миграции выполнены');
                break;
            case 'down':
                const steps = args[0] ? parseInt(args[0]) : 1;
                await migration.down(steps);
                console.log('✅ Откат миграций выполнен');
                break;
            case 'status':
                migration.status();
                break;
            default:
                console.error(`❌ Неизвестная команда: ${command}`);
                showHelp();
        }
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        db.close();
    }
}
function showHelp() {
    console.log(`
🗃️ Migration CLI для SQLite

Доступные команды:
  create <name>    Создать новую миграцию
  up              Выполнить все новые миграции
  down [steps]    Откатить последние миграции (по умолчанию 1)
  status          Показать статус миграций

Примеры:
  migrate create create_users_table
  migrate up
  migrate down 2
  migrate status
`);
}
const setupMigrations = async (params) => {
    return main(params).catch(console.error);
};
exports.setupMigrations = setupMigrations;
