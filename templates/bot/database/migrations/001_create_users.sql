-- UP
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `user_refid` INTEGER DEFAULT 0,
    `role` TEXT DEFAULT 'user',
    `tg_id` INTEGER NOT NULL UNIQUE,
    `tg_username` TEXT,
    `tg_full_name` TEXT GENERATED ALWAYS AS (trim(coalesce(tg_first_name, '') || ' ' || coalesce(tg_last_name, ''))) VIRTUAL,
    `tg_first_name` TEXT,
    `tg_last_name` TEXT,
    `is_banned_by_user` INTEGER DEFAULT 0,
    `is_banned_by_admin` INTEGER DEFAULT 0,
    `banned_reason` TEXT,
    `language` TEXT DEFAULT 'en',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
-- DOWN
DROP TABLE IF EXISTS `users`;