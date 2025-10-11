-- UP
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `role` TEXT DEFAULT 'user',
    `tg_id` INTEGER NOT NULL UNIQUE,
    `username` TEXT,
    `first_name` TEXT,
    `last_name` TEXT,
    `is_banned_by_user` INTEGER DEFAULT 0,
    `is_banned_by_admin` INTEGER DEFAULT 0,
    `banned_reason` TEXT,
    `language` TEXT DEFAULT 'en',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
-- DOWN
DROP TABLE IF EXISTS `users`;