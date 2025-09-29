# 2byte Telegram Bot Framework

🚀 A TypeScript framework and CLI for creating Telegram bots with sections-based architecture.

## Features

- 🎯 **Sections-based architecture** - Organize bot logic into manageable sections
- 🛠️ **CLI tools** - Generate bots, sections, and migrations with simple commands
- 🗃️ **Database migrations** - SQLite database migrations with up/down support
- 🌱 **Database seeding** - Populate database with test data
- 📦 **Template system** - Pre-built templates for rapid development
- 🎨 **TypeScript support** - Full TypeScript support out of the box
- ⚡ **Bun runtime** - Optimized for Bun JavaScript runtime

## Installation

### Global CLI Installation

```bash
npm install -g 2bytetgbot
```

### Local Project Installation

```bash
npm install 2bytetgbot
# or
bun add 2bytetgbot
```

## Quick Start

### 1. Create a New Bot

```bash
2byte create-bot my-awesome-bot
cd my-awesome-bot
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your BOT_TOKEN from @BotFather
```

### 3. Run Migrations and Seed Database

```bash
bun run migrate
bun run seed
```

### 4. Start Your Bot

```bash
bun run dev
```

## CLI Commands

### Bot Management

```bash
2byte create-bot <name>           # Create a new bot
2byte init                        # Initialize 2byte bot in current directory
```

### Code Generation

```bash
2byte generate section <name>     # Generate a new section
2byte generate migration <name>   # Generate a new migration
```

### Project Commands (inside bot directory)

```bash
bun run artisan make:section <name>    # Create new section
bun run artisan add:method <section> <method>  # Add method to section
bun run artisan list:sections          # List all sections

bun run migrate                        # Run migrations
bun run seed                          # Seed database
bun run seed:clear                    # Clear and reseed database
bun run seed:clean                    # Clean database only
```

## Project Structure

When you create a new bot, you'll get this structure:

```
my-awesome-bot/
├── bot.ts              # Main bot entry point
├── artisan.ts          # Artisan CLI for this bot
├── sections/           # Bot sections
│   └── HomeSection.ts  # Default home section
├── database/
│   ├── migrate.ts      # Migration runner
│   ├── seed.ts         # Database seeder
│   ├── migrations/     # Migration files
│   └── database.sqlite # SQLite database
├── package.json
└── .env.example
```

## Creating Sections

Sections are the main building blocks of your bot. Each section handles specific functionality:

```typescript
import { Section, SectionOptions, InlineKeyboard } from '2bytetgbot';

export default class AuthSection extends Section {
  static command = "auth";
  static description = "Authentication section";
  static actionRoutes = {
    "auth.login": "login",
    "auth.register": "register",
  };
  
  public sectionId = "auth";

  constructor(options: SectionOptions) {
    super(options);
  }

  async login() {
    const message = "Please enter your credentials...";
    await this.message(message).send();
  }

  async register() {
    const message = "Registration form...";
    await this.message(message).send();
  }
}
```

## Database Migrations

Create database tables and modify schema using migrations:

```bash
bun run artisan generate migration create_users_table
```

This creates a migration file like `001_create_users_table.sql`:

```sql
-- UP
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS users;
```

Run migrations:

```bash
bun run migrate up      # Run all pending migrations
bun run migrate down 2  # Rollback last 2 migrations
bun run migrate status  # Show migration status
```

## Database Seeding

Populate your database with test data:

```typescript
import { Database } from 'bun:sqlite';

export async function seedUsers(db: Database) {
  const stmt = db.prepare(`
    INSERT INTO users (username) VALUES (?)
  `);
  
  const users = ['alice', 'bob', 'charlie'];
  
  for (const username of users) {
    stmt.run(username);
    console.log(`✅ Created user: ${username}`);
  }
}
```

## Bot Configuration

Configure your bot in `bot.ts`:

```typescript
import 'dotenv/config';
import { App } from '2bytetgbot';
import HomeSection from './sections/HomeSection';
import AuthSection from './sections/AuthSection';

const sections = [
  HomeSection,
  AuthSection,
];

const app = new App({
  token: process.env.BOT_TOKEN!,
  sections: sections,
  database: {
    path: './database/database.sqlite'
  }
});

app.launch();
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
BOT_TOKEN=your_bot_token_from_botfather
DATABASE_PATH=./database/database.sqlite
LOG_LEVEL=info
```

## Advanced Usage

### Custom Migration Path

```typescript
import { BotMigration } from '2bytetgbot';

const migration = new BotMigration({
  botPath: __dirname,
  migrationsPath: './custom/migrations',
  databasePath: './custom/database.sqlite'
});
```

### Custom Seeder

```typescript
import { BotSeeder } from '2bytetgbot';
import { seedUsers } from './seeds/users';
import { seedProducts } from './seeds/products';

const seeder = new BotSeeder({
  botPath: __dirname,
  databasePath: './database/database.sqlite',
  seeders: [seedUsers, seedProducts]
});
```

### Custom Artisan Commands

```typescript
import { BotArtisan } from '2bytetgbot';

const artisan = new BotArtisan(__dirname, {
  botName: 'MyBot',
  sectionsPath: './src/sections'
});
```

## Examples

Check out example bots:

- **Reward Bot** - User rewards and social media integration
- **Registration Bot** - Telegram account management and automation

## Development

### Building the Library

```bash
cd lib/
bun install
bun run build
```

### Local Testing

```bash
bun run publish:local  # Install globally for testing
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/your-org/2bytetgbot/wiki)
- 🐛 [Issue Tracker](https://github.com/your-org/2bytetgbot/issues)
- 💬 [Discussions](https://github.com/your-org/2bytetgbot/discussions)

---

Made with ❤️ by 2byte Team