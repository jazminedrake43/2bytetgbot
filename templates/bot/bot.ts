import 'dotenv/config';
import { App } from '2bytetgbot';
import HomeSection from './sections/HomeSection';

// Импортируйте здесь все ваши секции
const sections = [
  HomeSection,
];

const app = new App({
  token: process.env.BOT_TOKEN!,
  sections: sections,
  database: {
    path: './database/database.sqlite'
  }
});

app.launch().then(() => {
  console.log('🚀 {{className}} Bot запущен!');
}).catch((error) => {
  console.error('❌ Ошибка запуска бота:', error);
});