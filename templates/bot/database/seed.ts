import { BotSeeder } from '@2byte/tgbot-framework';
import path from 'path';

// Импортируйте здесь ваши сидеры
// import { seedUsers } from './seeds/users';

const seeder = new BotSeeder({
  botPath: __dirname,
  databasePath: path.join(__dirname, 'database.sqlite'),
  seeders: [
    // seedUsers,
  ]
});

seeder.run();