import { BotMigration } from '@2byte/tgbot-framework';
import path from 'path';

const migration = new BotMigration({
  botPath: __dirname,
  migrationsPath: path.join(__dirname, 'migrations'),
  databasePath: path.join(__dirname, 'database.sqlite')
});

migration.run();