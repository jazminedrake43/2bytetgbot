-- UP
CREATE TABLE IF NOT EXISTS tg_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    session TEXT NULL,
    password TEXT NULL,
    country TEXT NULL,
    proxy_id INTEGER NULL,
    status INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индекс для быстрого поиска по номеру телефона
CREATE INDEX IF NOT EXISTS idx_accounts_phone ON accounts(phone);

-- Создаем индекс для фильтрации по статусу
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- Создаем индекс для фильтрации по стране
CREATE INDEX IF NOT EXISTS idx_accounts_country ON accounts(country);

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER IF NOT EXISTS accounts_updated_at 
    AFTER UPDATE ON accounts
    FOR EACH ROW
BEGIN
    UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- DOWN
DROP TABLE IF EXISTS tg_accounts;
