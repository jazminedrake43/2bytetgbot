# Улучшенная система ввода пользователя

## Обзор

Система ввода была значительно улучшена для поддержки:
- Возможности отмены ввода пользователем
- Настраиваемых опций отмены при создании запроса
- Сохранения состояния ожидания при неверном вводе
- Расширенной валидации, включая файлы
- Гибкой системы валидации для различных типов ботов

## Основные возможности

### 1. Настройка отмены ввода

При создании запроса на ввод можно настроить возможность отмены:

```typescript
// Разрешить отмену (по умолчанию)
.requestInput("phone", {
  validator: "phone",
  allowCancel: true, // по умолчанию true
  cancelButtonText: "Отмена", // текст кнопки
  cancelAction: "home.index[cancel_wait=1]", // действие при отмене
})

// Запретить отмену (обязательный ввод)
.requestInputWithAwait("password", {
  allowCancel: false, // отмена запрещена
  errorMessage: "Пароль обязателен для ввода"
})
```

### 2. Сохранение состояния при ошибках

При неверном вводе пользователь остается в режиме ожидания:

```typescript
.requestInput("code", {
  validator: "code",
  errorMessage: "Неверный формат кода. Введите 5-6 цифр",
  allowCancel: true
})
```

Система будет:
- Показывать сообщение об ошибке
- Увеличивать счетчик попыток
- Сохранять состояние ожидания
- Позволять отмену только если `allowCancel: true`

### 3. Валидация файлов

Поддержка загрузки и валидации файлов:

```typescript
.requestInput("uploadedFile", {
  validator: "file",
  errorMessage: "Неподдерживаемый формат файла",
  fileValidation: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10 МБ
    minSize: 1024, // 1 КБ
  },
  allowCancel: true
})
```

### 4. Кастомная валидация

Поддержка асинхронных валидаторов:

```typescript
.requestInput("customData", {
  validator: async (value) => {
    // Асинхронная проверка
    const isValid = await checkInDatabase(value);
    return isValid;
  },
  errorMessage: "Данные не прошли проверку"
})
```

## Типы валидаторов

### Встроенные валидаторы:
- `"number"` - числовые значения
- `"phone"` - российские номера телефонов (79xxxxxxxxx)
- `"code"` - коды подтверждения (5-6 цифр)
- `"file"` - файлы (с дополнительными опциями)

### Кастомные валидаторы:
```typescript
// Синхронный валидатор
validator: (value: string) => value.length > 5

// Асинхронный валидатор
validator: async (value: string) => {
  const result = await apiCall(value);
  return result.isValid;
}
```

## Примеры использования

### Базовый ввод с отменой
```typescript
async startRegistration() {
  await this.message("Введите ваш номер телефона:")
    .requestInput("phone", {
      validator: "phone",
      errorMessage: "Неверный формат. Используйте: 79000000000",
      allowCancel: true,
      cancelButtonText: "Отмена",
      cancelAction: "home.index[cancel_wait=1]",
      runSection: new RunSectionRoute().section("home").method("processPhone")
    })
    .send();
}
```

### Обязательный ввод без отмены
```typescript
async requestPassword() {
  return await this.message("Введите пароль:")
    .requestInputWithAwait("password", {
      errorMessage: "Пароль не может быть пустым",
      allowCancel: false // отмена запрещена
    });
}
```

### Загрузка файлов с валидацией
```typescript
async uploadDocument() {
  await this.message("Отправьте документ (PDF, до 5 МБ):")
    .requestInput("document", {
      validator: "file",
      fileValidation: {
        allowedTypes: ['application/pdf'],
        maxSize: 5 * 1024 * 1024,
        minSize: 1024
      },
      errorMessage: "Только PDF файлы до 5 МБ",
      allowCancel: true,
      runSection: new RunSectionRoute().section("home").method("processDocument")
    })
    .send();
}
```

### Кастомная валидация с API
```typescript
async requestUsername() {
  await this.message("Введите желаемое имя пользователя:")
    .requestInput("username", {
      validator: async (username: string) => {
        // Проверяем доступность имени через API
        const response = await fetch(`/api/check-username/${username}`);
        const data = await response.json();
        return data.available;
      },
      errorMessage: "Это имя уже занято. Попробуйте другое.",
      allowCancel: true,
      runSection: new RunSectionRoute().section("user").method("processUsername")
    })
    .send();
}
```

## Обработка отмены

Отмена обрабатывается автоматически через параметр `cancel_wait`:

```typescript
// В конструкторе Section автоматически вызывается:
this.cancelUserWaitingReply();

// Который проверяет параметр cancel_wait и очищает состояние ожидания
```

## Миграция с старой системы

### Было:
```typescript
.requestInput("phone", {
  validator: "phone",
  errorMessage: "Неверный номер"
})
```

### Стало:
```typescript
.requestInput("phone", {
  validator: "phone", 
  errorMessage: "Неверный номер",
  allowCancel: true, // новый параметр
  cancelButtonText: "Отмена", // настройка текста кнопки
  cancelAction: "home.index[cancel_wait=1]" // действие при отмене
})
```

Старый код будет работать с настройками по умолчанию (отмена разрешена).

## Лучшие практики

1. **Всегда предоставляйте возможность отмены** для необязательных действий
2. **Используйте понятные сообщения об ошибках** с указанием формата
3. **Ограничивайте размеры файлов** для предотвращения злоупотреблений
4. **Используйте асинхронную валидацию** для проверок через API
5. **Тестируйте различные сценарии** включая отмену и повторные попытки
