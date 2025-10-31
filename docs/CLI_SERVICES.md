# Service Generator - CLI Documentation

## Описание

Генератор для создания API сервисов в 2byte Telegram Bot Framework. Сервисы - это переиспользуемые компоненты, которые предоставляют функциональность для всего бота.

## Использование

### Базовая команда

```bash
2byte generate service <name>
# или короткая форма
2byte g service <name>
```

### Примеры

```bash
# Создать сервис для работы с API
2byte generate service PaymentAPI

# Создать сервис для уведомлений
2byte g service Notification

# Создать сервис для кеширования
2byte g service Cache

# Создать сервис для логирования
2byte g service Logger
```

## Что создается

### Структура файла

Генератор создает файл в директории `workflow/services/`:

```
your-bot/
├── workflow/
│   └── services/
│       ├── PaymentAPIService.ts    ← новый файл
│       ├── NotificationService.ts
│       └── ...
```

### Имя файла

- Автоматически добавляется суффикс `Service` если его нет
- Используется PascalCase форматирование

**Примеры:**
- `payment` → `PaymentService.ts`
- `PaymentAPI` → `PaymentAPIService.ts`
- `notification-sender` → `Notification-senderService.ts` (лучше использовать camelCase)

## Структура сервиса

Сгенерированный сервис содержит:

```typescript
import { App } from "@2byte/tgbot-framework";
import { ApiService } from "@2byte/tgbot-framework";

export default class PaymentAPIService extends ApiService {

    constructor(
        protected app: App,
        public name: string = "PaymentAPIService"
    ) {
        super(app, name);
    }

    public async setup(): Promise<void> {
        // Инициализация при запуске
    }

    public async unsetup(): Promise<void> {
        // Очистка при остановке
    }

    public async run(): Promise<void> {
        // Основная логика сервиса
    }
}
```

## Методы сервиса

### `setup()`

Вызывается при регистрации сервиса во время запуска бота.

**Используйте для:**
- Инициализации подключений к БД
- Загрузки конфигураций
- Настройки HTTP клиентов
- Подписки на события

**Пример:**
```typescript
public async setup(): Promise<void> {
    this.apiClient = axios.create({
        baseURL: 'https://api.example.com',
        timeout: 5000
    });
    
    this.app.debugLog(`[${this.name}] API client initialized`);
}
```

### `unsetup()`

Вызывается при остановке бота или выгрузке сервиса.

**Используйте для:**
- Закрытия подключений
- Сохранения состояния
- Отписки от событий
- Освобождения ресурсов

**Пример:**
```typescript
public async unsetup(): Promise<void> {
    await this.apiClient?.disconnect();
    this.app.debugLog(`[${this.name}] Cleanup completed`);
}
```

### `run()`

Основной метод для логики сервиса.

**Используйте для:**
- Запуска фоновых задач
- Периодических операций
- Обработки очередей
- Любой основной логики

**Пример:**
```typescript
public async run(): Promise<void> {
    // Запуск периодической задачи
    setInterval(async () => {
        await this.checkPayments();
    }, 60000); // каждую минуту
}
```

## Автоматическая загрузка

Сервисы автоматически загружаются из директории `workflow/services/` при запуске бота.

**Процесс:**
1. Бот сканирует `workflow/services/`
2. Импортирует все `.ts` файлы
3. Создает экземпляры сервисов
4. Вызывает `setup()` для каждого
5. Регистрирует в `ApiServiceManager`

## Использование сервисов

### Из секций

```typescript
// В любой секции
export default class HomeSection extends Section {
    async index() {
        // Получить сервис
        const paymentService = this.app.getService('PaymentAPIService');
        
        // Использовать
        const result = await paymentService.processPayment(100);
    }
}
```

### Из других сервисов

```typescript
export default class NotificationService extends ApiService {
    public async sendNotification(userId: number, message: string) {
        // Получить другой сервис
        const logger = this.app.getService('LoggerService');
        logger.log(`Sending notification to ${userId}`);
        
        // Ваша логика
    }
}
```

### Из App

```typescript
const app = new App(config);

// После инициализации
const service = app.getService('PaymentAPIService');
```

## Примеры сервисов

### 1. API клиент

```typescript
import { App, ApiService } from "@2byte/tgbot-framework";
import axios, { AxiosInstance } from 'axios';

export default class PaymentAPIService extends ApiService {
    private client: AxiosInstance;

    constructor(protected app: App, public name: string = "PaymentAPIService") {
        super(app, name);
    }

    public async setup(): Promise<void> {
        this.client = axios.create({
            baseURL: process.env.PAYMENT_API_URL,
            headers: {
                'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}`
            }
        });
    }

    public async createPayment(amount: number, userId: number) {
        const response = await this.client.post('/payments', {
            amount,
            userId,
            currency: 'USD'
        });
        return response.data;
    }

    public async checkPaymentStatus(paymentId: string) {
        const response = await this.client.get(`/payments/${paymentId}`);
        return response.data;
    }
}
```

### 2. Кеш сервис

```typescript
import { App, ApiService } from "@2byte/tgbot-framework";

export default class CacheService extends ApiService {
    private cache: Map<string, any> = new Map();
    private ttl: Map<string, number> = new Map();

    constructor(protected app: App, public name: string = "CacheService") {
        super(app, name);
    }

    public async setup(): Promise<void> {
        // Очистка истекших записей каждые 5 минут
        setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
    }

    public set(key: string, value: any, ttlSeconds: number = 3600): void {
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttlSeconds * 1000);
    }

    public get(key: string): any | null {
        if (!this.cache.has(key)) return null;
        
        const expiry = this.ttl.get(key);
        if (expiry && expiry < Date.now()) {
            this.cache.delete(key);
            this.ttl.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    private cleanExpired(): void {
        const now = Date.now();
        for (const [key, expiry] of this.ttl.entries()) {
            if (expiry < now) {
                this.cache.delete(key);
                this.ttl.delete(key);
            }
        }
    }
}
```

### 3. Логгер сервис

```typescript
import { App, ApiService } from "@2byte/tgbot-framework";
import * as fs from 'fs-extra';
import * as path from 'path';

export default class LoggerService extends ApiService {
    private logPath: string;

    constructor(protected app: App, public name: string = "LoggerService") {
        super(app, name);
        this.logPath = path.join(process.cwd(), 'logs');
    }

    public async setup(): Promise<void> {
        await fs.ensureDir(this.logPath);
    }

    public async log(message: string, level: 'info' | 'error' | 'warn' = 'info'): Promise<void> {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        
        const filename = `${new Date().toISOString().split('T')[0]}.log`;
        const filepath = path.join(this.logPath, filename);
        
        await fs.appendFile(filepath, logMessage);
        
        // Также выводим в консоль
        console.log(logMessage);
    }

    public async error(message: string): Promise<void> {
        await this.log(message, 'error');
    }

    public async warn(message: string): Promise<void> {
        await this.log(message, 'warn');
    }
}
```

### 4. Планировщик задач

```typescript
import { App, ApiService } from "@2byte/tgbot-framework";

interface ScheduledTask {
    id: string;
    callback: () => Promise<void>;
    interval: number;
    timer?: NodeJS.Timeout;
}

export default class SchedulerService extends ApiService {
    private tasks: Map<string, ScheduledTask> = new Map();

    constructor(protected app: App, public name: string = "SchedulerService") {
        super(app, name);
    }

    public async setup(): Promise<void> {
        this.app.debugLog(`[${this.name}] Scheduler ready`);
    }

    public async unsetup(): Promise<void> {
        // Останавливаем все задачи
        for (const task of this.tasks.values()) {
            if (task.timer) {
                clearInterval(task.timer);
            }
        }
        this.tasks.clear();
    }

    public addTask(id: string, callback: () => Promise<void>, intervalMs: number): void {
        if (this.tasks.has(id)) {
            throw new Error(`Task ${id} already exists`);
        }

        const timer = setInterval(async () => {
            try {
                await callback();
            } catch (error) {
                this.app.debugLog(`[${this.name}] Task ${id} error:`, error);
            }
        }, intervalMs);

        this.tasks.set(id, { id, callback, interval: intervalMs, timer });
        this.app.debugLog(`[${this.name}] Task ${id} scheduled every ${intervalMs}ms`);
    }

    public removeTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (!task) return false;

        if (task.timer) {
            clearInterval(task.timer);
        }
        this.tasks.delete(id);
        return true;
    }

    public async run(): Promise<void> {
        // Пример: добавление задачи при запуске
        // this.addTask('example', async () => {
        //     console.log('Scheduled task executed');
        // }, 60000);
    }
}
```

## Best Practices

### 1. Именование
- ✅ Используйте описательные имена: `EmailService`, `PaymentAPIService`
- ❌ Избегайте общих имен: `Service1`, `Helper`

### 2. Ответственность
- ✅ Один сервис - одна ответственность
- ❌ Не создавайте "God Objects"

### 3. Зависимости
- ✅ Инжектите зависимости через конструктор
- ✅ Используйте другие сервисы через `app.getService()`
- ❌ Не создавайте жесткие связи

### 4. Обработка ошибок
```typescript
public async setup(): Promise<void> {
    try {
        // Инициализация
    } catch (error) {
        this.app.debugLog(`[${this.name}] Setup failed:`, error);
        throw error; // Пробросить для остановки бота
    }
}
```

### 5. Логирование
```typescript
this.app.debugLog(`[${this.name}] Important action`);
```

## Жизненный цикл

```
Bot Start
    ↓
Load Services from workflow/services/
    ↓
new Service(app, name)
    ↓
service.setup()
    ↓
service.run()
    ↓
[Service is active]
    ↓
Bot Stop
    ↓
service.unsetup()
    ↓
Service destroyed
```

## Отладка

### Включить debug логи

```typescript
const app = new App({
    debug: true,
    // ...
});
```

### Проверить загруженные сервисы

```typescript
// В коде
const services = app.getAllServices();
console.log('Loaded services:', Array.from(services.keys()));
```

### Логи при загрузке

```
[App] Registered API services: [ 'PaymentAPIService', 'CacheService', 'LoggerService' ]
[PaymentAPIService] Service setup completed
[CacheService] Service setup completed
[LoggerService] Service setup completed
```

## Troubleshooting

### Сервис не загружается

**Проверьте:**
1. Файл находится в `workflow/services/`
2. Файл экспортирует класс как `export default`
3. Класс наследуется от `ApiService`
4. Нет ошибок в конструкторе

### Ошибка при setup()

```
Error: Service setup failed
```

**Решение:**
- Проверьте логи в консоли
- Добавьте try-catch в setup()
- Проверьте доступность внешних ресурсов

### Сервис недоступен из секций

```typescript
const service = this.app.getService('ServiceName');
if (!service) {
    console.error('Service not found!');
}
```

**Решение:**
- Проверьте имя сервиса (case-sensitive)
- Убедитесь что сервис загружен
- Проверьте `app.getAllServices()`

## Дополнительные команды

```bash
# Создать секцию
2byte generate section Settings

# Создать миграцию
2byte generate migration create_users_table

# Показать помощь
2byte generate --help
```

## См. также

- [API Reference - ApiService](../API_SERVICE.md)
- [Architecture - Services](../ARCHITECTURE.md#services)
- [Examples - Service Patterns](../examples/services/)
