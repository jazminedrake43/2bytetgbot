# Примеры использования Service Generator

## Тестовые сценарии

### Сценарий 1: Создание простого сервиса

```bash
cd your-bot-directory
2byte generate service Payment
```

**Ожидаемый результат:**
- Создан файл `workflow/services/PaymentService.ts`
- Выведено: `✅ Created service PaymentService at workflow/services/PaymentService.ts`

### Сценарий 2: Создание с полным именем

```bash
2byte g service NotificationService
```

**Ожидаемый результат:**
- Создан файл `workflow/services/NotificationService.ts`
- Суффикс Service не дублируется

### Сценарий 3: Попытка создать существующий сервис

```bash
2byte g service Payment  # Второй раз
```

**Ожидаемый результат:**
- Ошибка: `❌ Service PaymentService already exists`
- Файл не перезаписывается

### Сценарий 4: Создание нескольких сервисов

```bash
2byte g service Cache
2byte g service Logger  
2byte g service EmailSender
2byte g service DatabaseConnector
```

**Структура после создания:**
```
workflow/
└── services/
    ├── CacheService.ts
    ├── LoggerService.ts
    ├── EmailSenderService.ts
    └── DatabaseConnectorService.ts
```

## Проверка работы созданного сервиса

### 1. Создайте тестовый сервис

```bash
2byte g service Test
```

### 2. Измените сервис

Откройте `workflow/services/TestService.ts` и добавьте логику:

```typescript
import { App } from "@2byte/tgbot-framework";
import { ApiService } from "@2byte/tgbot-framework";

export default class TestService extends ApiService {

    constructor(
        protected app: App,
        public name: string = "TestService"
    ) {
        super(app, name);
    }

    public async setup(): Promise<void> {
        this.app.debugLog(`[${this.name}] Setting up test service`);
        return Promise.resolve();
    }

    public async unsetup(): Promise<void> {
        this.app.debugLog(`[${this.name}] Cleaning up test service`);
        return Promise.resolve();
    }

    public async run(): Promise<void> {
        this.app.debugLog(`[${this.name}] Test service is running!`);
        
        // Тестовая задача каждые 10 секунд
        setInterval(() => {
            this.app.debugLog(`[${this.name}] Heartbeat - ${new Date().toISOString()}`);
        }, 10000);
        
        return Promise.resolve();
    }

    // Кастомный метод для тестирования
    public getStatus(): string {
        return `TestService is active at ${new Date().toISOString()}`;
    }
}
```

### 3. Запустите бота

```bash
bun run index.ts
```

**Ожидаемые логи:**
```
[App] Registered API services: [ 'TestService', ... ]
[TestService] Setting up test service
[TestService] Service setup completed
[TestService] Test service is running!
[TestService] Heartbeat - 2025-10-29T...
[TestService] Heartbeat - 2025-10-29T...
```

### 4. Используйте сервис в секции

Создайте или откройте секцию:

```typescript
import { Section } from "@2byte/tgbot-framework";

export default class HomeSection extends Section {
    async index() {
        // Получаем наш тестовый сервис
        const testService = this.app.getService('TestService');
        
        if (testService) {
            const status = testService.getStatus();
            
            await this.message(`🤖 Bot Status\n\n${status}`)
                .send();
        }
    }
}
```

## Интеграционные тесты

### Test 1: Автозагрузка сервиса

```bash
# Создать сервис
2byte g service AutoLoad

# Запустить бота
bun run index.ts

# Проверить логи
# Должно быть: [App] Registered API services: [ 'AutoLoadService', ... ]
```

### Test 2: Использование в секциях

```typescript
// В любой секции
const service = this.app.getService('AutoLoadService');
console.log('Service loaded:', service ? 'YES' : 'NO');
```

### Test 3: Жизненный цикл

```bash
# Запустить бота
bun run index.ts
# Лог: [ServiceName] Service setup completed

# Остановить бота (Ctrl+C)
# Лог: [ServiceName] Service cleanup completed
```

## Примеры реальных сервисов

### Email Service

```bash
2byte g service Email
```

```typescript
// workflow/services/EmailService.ts
import { App, ApiService } from "@2byte/tgbot-framework";
import nodemailer from 'nodemailer';

export default class EmailService extends ApiService {
    private transporter: any;

    constructor(protected app: App, public name: string = "EmailService") {
        super(app, name);
    }

    public async setup(): Promise<void> {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        this.app.debugLog(`[${this.name}] Email service ready`);
    }

    public async sendEmail(to: string, subject: string, text: string) {
        const info = await this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text
        });
        
        this.app.debugLog(`[${this.name}] Email sent: ${info.messageId}`);
        return info;
    }
}
```

### Database Service

```bash
2byte g service Database
```

```typescript
// workflow/services/DatabaseService.ts
import { App, ApiService } from "@2byte/tgbot-framework";
import { Database } from 'sqlite3';

export default class DatabaseService extends ApiService {
    private db: Database | null = null;

    constructor(protected app: App, public name: string = "DatabaseService") {
        super(app, name);
    }

    public async setup(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new Database('./database.db', (err) => {
                if (err) {
                    this.app.debugLog(`[${this.name}] DB connection failed`, err);
                    reject(err);
                } else {
                    this.app.debugLog(`[${this.name}] DB connected`);
                    resolve();
                }
            });
        });
    }

    public async unsetup(): Promise<void> {
        return new Promise((resolve) => {
            this.db?.close(() => {
                this.app.debugLog(`[${this.name}] DB connection closed`);
                resolve();
            });
        });
    }

    public async query(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db?.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}
```

### Redis Cache Service

```bash
2byte g service RedisCache
```

```typescript
// workflow/services/RedisCacheService.ts
import { App, ApiService } from "@2byte/tgbot-framework";
import Redis from 'ioredis';

export default class RedisCacheService extends ApiService {
    private redis: Redis | null = null;

    constructor(protected app: App, public name: string = "RedisCacheService") {
        super(app, name);
    }

    public async setup(): Promise<void> {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
        });
        
        this.redis.on('connect', () => {
            this.app.debugLog(`[${this.name}] Redis connected`);
        });
    }

    public async unsetup(): Promise<void> {
        await this.redis?.quit();
        this.app.debugLog(`[${this.name}] Redis disconnected`);
    }

    public async get(key: string): Promise<string | null> {
        return this.redis?.get(key) || null;
    }

    public async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redis?.setex(key, ttl, value);
        } else {
            await this.redis?.set(key, value);
        }
    }

    public async del(key: string): Promise<void> {
        await this.redis?.del(key);
    }
}
```

## Troubleshooting Examples

### Проблема: Сервис не создается

```bash
$ 2byte g service Test
Error: EACCES: permission denied
```

**Решение:**
```bash
# Проверьте права доступа
ls -la workflow/services/

# Создайте директорию вручную если нужно
mkdir -p workflow/services
chmod 755 workflow/services
```

### Проблема: Сервис создан но не загружается

**Проверка:**
```bash
# Запустите бота с debug
DEBUG=* bun run index.ts

# Проверьте структуру файла
cat workflow/services/TestService.ts
```

**Типичные ошибки:**
- Файл не экспортирует класс как default
- Класс не наследуется от ApiService
- Синтаксическая ошибка в коде

## Performance Tests

### Тест загрузки множества сервисов

```bash
# Создать 10 сервисов
for i in {1..10}; do
    2byte g service Service$i
done

# Запустить и проверить время загрузки
time bun run index.ts
```

**Ожидаемый результат:**
- Все 10 сервисов загружены
- Время загрузки < 1 секунды
- Нет ошибок в логах
