# 2byte CLI - Quick Reference

## Installation

```bash
npm install -g @2byte/tgbot-framework
# or
bun install -g @2byte/tgbot-framework
```

## Commands

### Create Bot
```bash
2byte create-bot <name> [options]

# Options:
#   -p, --path [path]    Target directory (default: current directory)
#   --no-database        Skip database setup

# Examples:
2byte create-bot my-awesome-bot
2byte create-bot shop-bot --path ./bots
2byte create-bot simple-bot --no-database
```

### Initialize Bot
```bash
2byte init [options]

# Options:
#   -f, --force    Override existing files

# Example:
2byte init
2byte init --force
```

### Generate Components

#### Section
```bash
2byte generate section <name>
2byte g section <name>

# Examples:
2byte g section Settings
2byte g section Shop
2byte g section UserProfile
```

#### Service
```bash
2byte generate service <name>
2byte g service <name>

# Examples:
2byte g service PaymentAPI
2byte g service Cache
2byte g service Logger
2byte g service Notification
```

#### Migration
```bash
2byte generate migration <name>
2byte g migration <name>

# Examples:
2byte g migration create_users_table
2byte g migration add_role_to_users
2byte g migration create_orders
```

## Project Structure

```
my-bot/
├── sections/              # Generated sections
│   ├── HomeSection.ts
│   ├── SettingsSection.ts
│   └── ...
├── workflow/
│   └── services/         # Generated services
│       ├── CacheService.ts
│       ├── PaymentAPIService.ts
│       └── ...
├── database/
│   └── migrations/       # Generated migrations
│       ├── 001_create_users.sql
│       ├── 002_add_role.sql
│       └── ...
├── index.ts              # Main entry point
└── package.json
```

## Quick Start

1. **Create a new bot:**
   ```bash
   2byte create-bot my-bot
   cd my-bot
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure bot:**
   ```bash
   # Edit .env file with your bot token
   echo "BOT_TOKEN=your_bot_token_here" > .env
   ```

4. **Generate components:**
   ```bash
   # Create sections
   2byte g section Home
   2byte g section Settings
   
   # Create services
   2byte g service Cache
   2byte g service Logger
   
   # Create migrations
   2byte g migration create_users
   ```

5. **Run bot:**
   ```bash
   bun run index.ts
   ```

## Component Templates

### Section Template
```typescript
import { Section } from "@2byte/tgbot-framework";

export default class HomeSection extends Section {
  static command = "home";
  static description = "Home section";
  
  async index() {
    await this.message("Welcome!")
      .inlineKeyboard(this.mainInlineKeyboard)
      .send();
  }
}
```

### Service Template
```typescript
import { App, ApiService } from "@2byte/tgbot-framework";

export default class CacheService extends ApiService {
  constructor(protected app: App, public name: string = "CacheService") {
    super(app, name);
  }

  public async setup(): Promise<void> {
    // Initialization
  }

  public async run(): Promise<void> {
    // Main logic
  }
}
```

### Migration Template
```sql
-- UP
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS users;
```

## Help

```bash
# Show all commands
2byte --help

# Show version
2byte --version

# Show generate commands
2byte generate --help
```

## Documentation

- [Services Documentation](./docs/CLI_SERVICES.md)
- [Full Documentation](./docs/)
- [Examples](./examples/)

## Links

- GitHub: https://github.com/2byte/tgbot-framework
- NPM: https://www.npmjs.com/package/@2byte/tgbot-framework
- Documentation: https://docs.2byte.dev/tgbot-framework
