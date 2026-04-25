# MassSendApiService — Массовая рассылка сообщений

## Описание

`MassSendApiService` — встроенный HTTP-сервис (Bun.serve) для массовой рассылки различных типов сообщений пользователям Telegram-бота.

Клиентский класс `MassSends` (`workflow/MassSends.ts`) предоставляет удобный TypeScript-интерфейс над HTTP API.

---

## Возможности

- ✅ Рассылка **всем** пользователям бота (из БД) или **конкретному** списку `userIds`
- ✅ Поддержка 7 типов сообщений: `text`, `photo`, `video`, `document`, `audio`, `animation`, `voice`
- ✅ Форматирование: `HTML`, `Markdown`, `MarkdownV2`
- ✅ Настраиваемая задержка между отправками (защита от flood-лимитов)
- ✅ Fire-and-forget: API отвечает сразу, рассылка идёт в фоне
- ✅ Автоматическая обработка ошибок с подробным логированием
- ✅ CLI-запуск через `bun workflow/MassSends.ts`

---

## Настройка

Порт сервиса задаётся переменной окружения:

```env
BOT_APP_API_PORT=3033
```

Или передаётся напрямую при регистрации сервиса:

```ts
app.registerApiService(new MassSendApiService({ port: 4000 }));
```

---

## HTTP API

### Базовый URL

```
http://localhost:3033
```

### Эндпоинты

| Method | Path    | Описание                        |
|--------|---------|---------------------------------|
| GET    | `/`     | Health-check, возвращает статус |
| POST   | `/send` | Запустить рассылку              |

---

### POST /send

Запускает рассылку. Ответ приходит немедленно, отправка идёт асинхронно в фоне.

#### Общие поля запроса

| Поле        | Тип        | Обязательно | Описание                                                  |
|-------------|------------|-------------|-----------------------------------------------------------|
| `type`      | `string`   | ✅           | Тип сообщения (см. ниже)                                  |
| `userIds`   | `number[]` | ❌           | Список Telegram chat ID. Если не указан — всем из БД      |
| `parseMode` | `string`   | ❌           | `"HTML"` \| `"Markdown"` \| `"MarkdownV2"`                |
| `delay`     | `number`   | ❌           | Задержка между отправками, мс. По умолчанию `50`          |

---

### Типы сообщений

#### `text` — текстовое сообщение

```json
{
  "type": "text",
  "message": "Привет, <b>мир</b>!",
  "parseMode": "HTML"
}
```

| Поле      | Тип      | Обязательно | Описание      |
|-----------|----------|-------------|---------------|
| `message` | `string` | ✅           | Текст письма  |

---

#### `photo` — изображение

```json
{
  "type": "photo",
  "media": "AgACAgIAAxkBAAIB...",
  "caption": "Посмотри на это!",
  "parseMode": "HTML"
}
```

| Поле      | Тип      | Обязательно | Описание                          |
|-----------|----------|-------------|-----------------------------------|
| `media`   | `string` | ✅           | `file_id`, HTTPS URL              |
| `caption` | `string` | ❌           | Подпись к фото                    |

---

#### `video` — видео

```json
{
  "type": "video",
  "media": "BAACAgIAAxkBAAIB...",
  "caption": "Видео недели",
  "supportsStreaming": true
}
```

| Поле                | Тип       | Обязательно | Описание              |
|---------------------|-----------|-------------|-----------------------|
| `media`             | `string`  | ✅           | `file_id` или URL     |
| `caption`           | `string`  | ❌           | Подпись               |
| `supportsStreaming`  | `boolean` | ❌           | Пометить как стриминг |

---

#### `document` — файл / документ

```json
{
  "type": "document",
  "media": "BQACAgIAAxkBAAIB...",
  "caption": "Отчёт Q1"
}
```

| Поле      | Тип      | Обязательно | Описание          |
|-----------|----------|-------------|-------------------|
| `media`   | `string` | ✅           | `file_id` или URL |
| `caption` | `string` | ❌           | Подпись           |

---

#### `audio` — аудио-файл (отображается как музыка)

```json
{
  "type": "audio",
  "media": "CQACAgIAAxkBAAIB...",
  "caption": "Трек дня",
  "performer": "Artist Name",
  "title": "Song Title",
  "duration": 213
}
```

| Поле        | Тип      | Обязательно | Описание                |
|-------------|----------|-------------|-------------------------|
| `media`     | `string` | ✅           | `file_id` или URL       |
| `caption`   | `string` | ❌           | Подпись                 |
| `performer` | `string` | ❌           | Исполнитель             |
| `title`     | `string` | ❌           | Название трека          |
| `duration`  | `number` | ❌           | Длительность в секундах |

---

#### `animation` — GIF / анимация

```json
{
  "type": "animation",
  "media": "CgACAgIAAxkBAAIB...",
  "caption": "Посмотри на этот GIF!"
}
```

| Поле      | Тип      | Обязательно | Описание          |
|-----------|----------|-------------|-------------------|
| `media`   | `string` | ✅           | `file_id` или URL |
| `caption` | `string` | ❌           | Подпись           |

---

#### `voice` — голосовое сообщение (`.ogg` OPUS)

```json
{
  "type": "voice",
  "media": "AwACAgIAAxkBAAIB...",
  "duration": 15
}
```

| Поле       | Тип      | Обязательно | Описание                |
|------------|----------|-------------|-------------------------|
| `media`    | `string` | ✅           | `file_id` или URL       |
| `caption`  | `string` | ❌           | Подпись                 |
| `duration` | `number` | ❌           | Длительность в секундах |

---

## Примеры — curl

```bash
# Текст всем пользователям
curl -X POST http://localhost:3033/send \
  -H "Content-Type: application/json" \
  -d '{"type":"text","message":"Привет!","parseMode":"HTML"}'

# Фото конкретным пользователям
curl -X POST http://localhost:3033/send \
  -H "Content-Type: application/json" \
  -d '{"type":"photo","media":"AgACAgIAAxk...","caption":"Смотри!","userIds":[111,222]}'

# Видео с задержкой 100мс
curl -X POST http://localhost:3033/send \
  -H "Content-Type: application/json" \
  -d '{"type":"video","media":"BAACAgIAAxk...","caption":"Видео","delay":100}'
```

---

## Примеры — TypeScript (`MassSends`)

```ts
import { MassSends } from "./workflow/MassSends";

const ms = new MassSends(); // http://localhost:3033 по умолчанию

// Текст всем
await ms.sendText("Привет всем!", { parseMode: "HTML" });

// Фото конкретным пользователям
await ms.sendPhoto("AgACAgIAAxk...", "Посмотри!", { userIds: [111222333] });

// Видео
await ms.sendVideo("BAACAgIAAxk...", "Видео дня", { supportsStreaming: true });

// Документ
await ms.sendDocument("BQACAgIAAxk...", "Важный файл");

// Аудио
await ms.sendAudio("CQACAgIAAxk...", "Трек", { performer: "Artist", title: "Song" });

// GIF
await ms.sendAnimation("CgACAgIAAxk...", "Смешной GIF");

// Голосовое
await ms.sendVoice("AwACAgIAAxk...", undefined, { duration: 10 });
```

---

## CLI

```bash
bun workflow/MassSends.ts text "Привет всем!"
bun workflow/MassSends.ts photo <file_id> "Посмотри!"
bun workflow/MassSends.ts video <file_id> "Видео дня"
bun workflow/MassSends.ts document <file_id>
bun workflow/MassSends.ts audio <file_id>
bun workflow/MassSends.ts animation <file_id>
bun workflow/MassSends.ts voice <file_id>
```

---

## Ответ сервера

```json
{ "status": 200, "message": "Mass send initiated." }
```

При ошибке валидации:

```json
{ "status": 400, "error": "Missing required field \"type\"" }
```

---

## Настройка

```env
BOT_APP_API_PORT=3033
```

Сервис требует подключения к базе данных (`db`) в глобальной области видимости для получения списка пользователей, если `userIds` не передан явно.

---

## Производительность

- Рассылка выполняется последовательно (во избежание flood-лимитов Telegram)
- Рекомендуется не превышать ~30 сообщений/сек → выставляйте `delay` от 50 до 100 мс
- Для огромных объёмов рассмотрите очередь сообщений (BullMQ и т.п.)

## См. также

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [SERVICE_EXAMPLES.md](SERVICE_EXAMPLES.md)