"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Migration {
    constructor(db, migrationsPath) {
        this.db = db;
        this.migrationsPath = migrationsPath;
        this.initMigrationsTable();
    }
    /**
     * Инициализация таблицы миграций
     */
    initMigrationsTable() {
        this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        batch INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    }
    /**
     * Получение списка файлов миграций
     */
    getMigrationFiles() {
        const files = fs_1.default.readdirSync(this.migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .map(file => {
            const [id, ...nameParts] = file.replace('.sql', '').split('_');
            return {
                id: parseInt(id),
                name: nameParts.join('_'),
                path: path_1.default.join(this.migrationsPath, file)
            };
        })
            .sort((a, b) => a.id - b.id);
        return files;
    }
    /**
     * Получение списка выполненных миграций
     */
    getExecutedMigrations() {
        const result = this.db.query('SELECT name FROM migrations').all();
        return result.map(row => row.name);
    }
    /**
     * Выполнение миграции
     */
    async up() {
        const executed = this.getExecutedMigrations();
        const files = this.getMigrationFiles();
        const batch = this.getLastBatch() + 1;
        for (const file of files) {
            if (!executed.includes(file.name)) {
                try {
                    const sql = fs_1.default.readFileSync(file.path, 'utf-8');
                    this.db.transaction(() => {
                        this.db.query(sql).run();
                        this.db.query('INSERT INTO migrations (name, batch) VALUES (?, ?)')
                            .run(file.name, batch);
                    })();
                    console.log(`✅ Миграция ${file.name} выполнена успешно`);
                }
                catch (error) {
                    console.error(`❌ Ошибка при выполнении миграции ${file.name}:`, error);
                    throw error;
                }
            }
        }
    }
    /**
     * Откат миграций
     */
    async down(steps = 1) {
        const batch = this.getLastBatch();
        if (batch === 0) {
            console.log('Нет миграций для отката');
            return;
        }
        const migrations = this.db.query(`
      SELECT * FROM migrations 
      WHERE batch >= ? 
      ORDER BY batch DESC, id DESC 
      LIMIT ?
    `).all(batch - steps + 1, steps);
        for (const migration of migrations) {
            const file = this.getMigrationFiles().find(f => f.name === migration.name);
            if (file) {
                try {
                    const sql = fs_1.default.readFileSync(file.path, 'utf-8');
                    const downSql = this.extractDownSQL(sql);
                    if (downSql) {
                        this.db.transaction(() => {
                            this.db.query(downSql).run();
                            this.db.query('DELETE FROM migrations WHERE name = ?').run(migration.name);
                        })();
                        console.log(`✅ Откат миграции ${migration.name} выполнен успешно`);
                    }
                    else {
                        console.warn(`⚠️ Секция DOWN не найдена в миграции ${migration.name}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Ошибка при откате миграции ${migration.name}:`, error);
                    throw error;
                }
            }
        }
    }
    /**
     * Получение последнего номера batch
     */
    getLastBatch() {
        const result = this.db.query('SELECT MAX(batch) as max_batch FROM migrations').get();
        return result.max_batch || 0;
    }
    /**
     * Извлечение SQL для отката из файла миграции
     */
    extractDownSQL(sql) {
        const downMatch = sql.match(/-- DOWN\s+([\s\S]+?)(?=-- UP|$)/i);
        return downMatch ? downMatch[1].trim() : null;
    }
    /**
     * Создание новой миграции
     */
    static async create(name, migrationsPath) {
        const files = fs_1.default.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .map(file => parseInt(file.split('_')[0]));
        const nextId = (Math.max(0, ...files) + 1).toString().padStart(3, '0');
        const fileName = `${nextId}_${name}.sql`;
        const filePath = path_1.default.join(migrationsPath, fileName);
        const template = `-- UP
CREATE TABLE IF NOT EXISTS ${name} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS ${name};
`;
        fs_1.default.writeFileSync(filePath, template);
        console.log(`✅ Создана новая миграция: ${fileName}`);
    }
    /**
     * Статус миграций
     */
    status() {
        const executed = this.getExecutedMigrations();
        const files = this.getMigrationFiles();
        console.log('\n📊 Статус миграций:\n');
        for (const file of files) {
            const status = executed.includes(file.name) ? '✅' : '⏳';
            console.log(`${status} ${file.id}_${file.name}`);
        }
        console.log();
    }
}
exports.Migration = Migration;
