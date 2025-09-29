#!/usr/bin/env bun
import { Database } from 'bun:sqlite';
import { Migration } from '../illumination/Migration';
import path from 'path';

type setupParams = {
  pathDatabase?: string;
  pathMigrations?: string;
};

async function main(params: setupParams = {}) {

const MIGRATIONS_PATH = params.pathMigrations || path.join(__dirname, 'migrations');

  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command) {
    showHelp();
    return;
  }

  const db = new Database(params.pathDatabase || __dirname + '/database/database.sqlite');

  const migration = new Migration(db, MIGRATIONS_PATH);

  try {
    switch (command) {
      case 'create':
        if (args.length === 0) {
          console.error('❌ Ошибка: Требуется имя миграции');
          console.log('Использование: migrate create migration_name');
          return;
        }
        await Migration.create(args[0], MIGRATIONS_PATH);
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
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
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
export const setupMigrations = async (params: setupParams) => {
  return main(params).catch(console.error);
}