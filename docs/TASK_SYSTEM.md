# Система управления задачами в 2byte Telegram Bot

## Описание

Система управления задачами позволяет запускать длительные операции в фоновом режиме с возможностью двусторонней коммуникации между задачей и основным кодом бота.

## Основные возможности

- Запуск фоновых задач без блокировки основного потока
- Двусторонняя коммуникация с задачами
- Отслеживание статуса задач
- Возможность отмены задач
- Автоматическая очистка завершенных задач
- Поддержка "тихого" режима (без уведомлений в чат)

## Примеры использования

### 1. Простой запуск задачи

```typescript
const taskId = this.app.runTask(ctx, async ({ signal, sendMessage }) => {
  await sendMessage("Начинаю обработку...");
  
  for (let i = 0; i < 100 && !signal.aborted; i++) {
    await sendMessage(`Прогресс: ${i}%`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await sendMessage("Обработка завершена!");
});
```

### 2. Задача с обработкой входящих сообщений

```typescript
const taskId = this.app.runTask(ctx, async ({ signal, sendMessage, onMessage }) => {
  // Подписываемся на входящие сообщения
  onMessage((message, source) => {
    if (source === 'external') {
      switch (message) {
        case 'status':
          sendMessage("Задача активна и обрабатывает данные...");
          break;
        case 'speed_up':
          sendMessage("Ускоряю обработку!");
          break;
        case 'pause':
          sendMessage("Приостанавливаю обработку...");
          break;
      }
    }
  });

  // Основной код задачи
  while (!signal.aborted) {
    await sendMessage("Обработка данных...");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}, {
  startMessage: "Запуск интерактивной задачи",
  completeMessage: "Задача завершена",
  silent: false
});
```

### 3. Отправка сообщений в задачу

```typescript
// Отправка команды в задачу
await this.app.sendMessageToTask(taskId, "status");

// Отправка данных для обработки
await this.app.sendMessageToTask(taskId, JSON.stringify({ 
  action: "process", 
  data: { /* ... */ } 
}));
```

### 4. Задача в тихом режиме

```typescript
const taskId = this.app.runTask(ctx, async ({ signal, sendMessage }) => {
  await sendMessage("Начало тихой обработки");
  // ... код задачи ...
}, {
  silent: true // Отключаем уведомления в чат
});
```

### 5. Отмена задачи

```typescript
// Отмена задачи по ID
const cancelled = this.app.cancelTask(taskId);
if (cancelled) {
  console.log("Задача успешно отменена");
} else {
  console.log("Не удалось отменить задачу");
}
```

### 6. Получение информации о задаче

```typescript
const taskInfo = this.app.getTaskInfo(taskId);
if (taskInfo) {
  console.log(`Статус задачи: ${taskInfo.status}`);
  console.log(`Время запуска: ${new Date(taskInfo.startTime)}`);
  if (taskInfo.endTime) {
    console.log(`Время завершения: ${new Date(taskInfo.endTime)}`);
  }
}
```

### 7. Получение списка задач пользователя

```typescript
const userTasks = this.app.getUserTasks(ctx.from.id);
console.log(`Активные задачи пользователя:`, userTasks);
```

## Параметры конфигурации

При запуске задачи можно указать следующие параметры:

```typescript
interface TaskOptions {
  taskId?: string;           // Пользовательский ID задачи
  notifyStart?: boolean;     // Уведомлять о запуске
  notifyComplete?: boolean;  // Уведомлять о завершении
  startMessage?: string;     // Сообщение при запуске
  completeMessage?: string;  // Сообщение при завершении
  errorMessage?: string;     // Сообщение при ошибке
  silent?: boolean;          // Тихий режим (без сообщений в чат)
}
```

## Очистка старых задач

Система автоматически не очищает завершенные задачи. Для очистки старых задач используйте метод:

```typescript
// Очистка задач старше 1 часа
this.app.cleanupOldTasks(3600000);

// Очистка задач старше 24 часов
this.app.cleanupOldTasks(24 * 3600000);
```

## Рекомендации по использованию

1. Всегда проверяйте `signal.aborted` в длительных операциях для корректной отмены задачи
2. Используйте `try/catch` внутри задач для обработки ошибок
3. В тихом режиме (`silent: true`) сообщения не отправляются в чат, но всё ещё доступны через обработчики
4. Регулярно очищайте старые завершенные задачи
5. Используйте структурированные сообщения (например, JSON) для передачи сложных команд в задачу
