import { Model } from "./Model";

export interface AccountData {
  /** PRIMARY KEY */
  id?: number;
  /** UNIQUE */
  phone: string;
  session?: string | null;
  password?: string | null;
  country?: string | null;
  proxy_id?: number | null; // Foreign key to proxy table
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export enum TgAccountStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  BANNED = 2,
}

export class TgAccount extends Model {
  static tableName = 'tg_accounts';

  /**
   * Создать новый аккаунт
   */
  static async create(data: AccountData): Promise<void> {
    const {
      phone,
      session = null,
      password = null,
      country = null,
      proxy_id = null,
      status = 0,
    } = data;

    await this.execute(
      `INSERT INTO ${this.tableName} 
       (phone, session, password, country, proxy_id, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [phone, session, password, country, proxy_id, status]
    );
  }

  /**
   * Найти аккаунт по номеру телефона
   */
  static async findByPhone(phone: string): Promise<AccountData | null> {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE phone = ?`, [phone]);
  }

  /**
   * Найти аккаунт по ID
   */
  static async findById(id: number): Promise<AccountData | null> {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /**
   * Обновить сессию аккаунта
   */
  static async updateSession(phone: string, session: string): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET session = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [session, phone]
    );
  }

  /**
   * Обновить пароль аккаунта
   */
  static async updatePassword(phone: string, password: string): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET password = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [password, phone]
    );
  }

  /**
   * Обновить страну аккаунта
   */
  static async updateCountry(phone: string, country: string): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET country = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [country, phone]
    );
  }

  /**
   * Обновить прокси аккаунта
   */
  static async updateProxy(phone: string, proxy_id: number | null): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET proxy_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [proxy_id, phone]
    );
  }

  /**
   * Обновить статус аккаунта
   */
  static async updateStatus(phone: string, status: number): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [status, phone]
    );
  }

  /**
   * Универсальный метод обновления любых полей
   */
  static async update(phone: string, fields: Partial<Omit<AccountData, "phone" | "id">>): Promise<void> {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;

    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => (fields as any)[k]);

    await this.execute(
      `UPDATE ${this.tableName} 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [...values, phone]
    );
  }

  /**
   * Вставка или обновление аккаунта (upsert)
   */
  static async upsert(data: AccountData): Promise<void> {
    const {
      phone,
      session = null,
      password = null,
      country = null,
      proxy_id = null,
      status = 0,
    } = data;

    await this.execute(
      `INSERT INTO ${this.tableName} 
       (phone, session, password, country, proxy_id, status) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(phone) DO UPDATE 
       SET session = excluded.session,
           password = excluded.password,
           country = excluded.country,
           proxy_id = excluded.proxy_id,
           status = excluded.status,
           updated_at = CURRENT_TIMESTAMP`,
      [phone, session, password, country, proxy_id, status]
    );
  }

  /**
   * Получить все аккаунты
   */
  static async getAll(): Promise<AccountData[]> {
    return this.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
  }

  /**
   * Удалить аккаунт
   */
  static async delete(phone: string): Promise<void> {
    await this.execute(`DELETE FROM ${this.tableName} WHERE phone = ?`, [phone]);
  }

  /**
   * Получить количество аккаунтов
   */
  static async count(): Promise<number> {
    const result: { count: number } = await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    return result.count;
  }

  static async countActive(): Promise<number> {
    const result: { count: number } = await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = 1`);
    return result.count;
  }

  /**
   * Получить следующий свободный аккаунт
   */
  static async getNextAvailable(): Promise<AccountData | null> {
    return this.queryOne(`
      SELECT a.* FROM ${this.tableName} a
      LEFT JOIN report_tasks rt ON a.phone = rt.account_phone AND rt.status = 'pending'
      WHERE rt.id IS NULL
      LIMIT 1
    `);
  }

  /**
   * Получить аккаунты с прокси
   */
  static async getWithProxy(): Promise<AccountData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE proxy_id IS NOT NULL ORDER BY created_at DESC`);
  }

  /**
   * Получить аккаунты без прокси
   */
  static async getWithoutProxy(): Promise<AccountData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE proxy_id IS NULL ORDER BY created_at DESC`);
  }

  /**
   * Получить аккаунт с информацией о прокси (JOIN)
   */
  static async findWithProxy(phone: string): Promise<(AccountData & { proxy?: any }) | null> {
    return this.queryOne(`
      SELECT 
        a.*,
        p.ip as proxy_ip,
        p.port as proxy_port,
        p.username as proxy_username,
        p.password as proxy_password,
        p.secret as proxy_secret,
        p.socksType as proxy_socksType,
        p.MTProxy as proxy_MTProxy,
        p.status as proxy_status,
        p.source as proxy_source
      FROM ${this.tableName} a
      LEFT JOIN proxy p ON a.proxy_id = p.id
      WHERE a.phone = ?
    `, [phone]);
  }

  /**
   * Получить все аккаунты с информацией о прокси (JOIN)
   */
  static async getAllWithProxy(): Promise<(AccountData & { proxy?: any })[]> {
    return this.query(`
      SELECT 
        a.*,
        p.ip as proxy_ip,
        p.port as proxy_port,
        p.username as proxy_username,
        p.password as proxy_password,
        p.secret as proxy_secret,
        p.socksType as proxy_socksType,
        p.MTProxy as proxy_MTProxy,
        p.status as proxy_status,
        p.source as proxy_source
      FROM ${this.tableName} a
      LEFT JOIN proxy p ON a.proxy_id = p.id
      ORDER BY a.created_at DESC
    `);
  }

  /**
   * Привязать прокси к аккаунту
   */
  static async assignProxy(phone: string, proxyId: number): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET proxy_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [proxyId, phone]
    );
  }

  /**
   * Отвязать прокси от аккаунта
   */
  static async unassignProxy(phone: string): Promise<void> {
    await this.execute(
      `UPDATE ${this.tableName} 
       SET proxy_id = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE phone = ?`,
      [phone]
    );
  }

  /**
   * Получить аккаунты по статусу
   */
  static async getByStatus(status: number): Promise<AccountData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY created_at DESC`, [status]);
  }

  /**
   * Получить активные аккаунты
   */
  static async getActive(): Promise<AccountData[]> {
    return this.getByStatus(TgAccountStatus.ACTIVE);
  }

  /**
   * Получить заблокированные аккаунты
   */
  static async getBanned(): Promise<AccountData[]> {
    return this.getByStatus(TgAccountStatus.BANNED);
  }

  /**
   * Проверить существование аккаунта
   */
  static async exists(phone: string): Promise<boolean> {
    const result: { count: number } = await this.queryOne(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE phone = ?`,
      [phone]
    );
    return result.count > 0;
  }

  /**
   * Получить статистику аккаунтов
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    banned: number;
    inactive: number;
    withProxy: number;
    withoutProxy: number;
    withSession: number;
  }> {
    const total = await this.count();
    const active = (await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`, [TgAccountStatus.ACTIVE])).count;
    const banned = (await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`, [TgAccountStatus.BANNED])).count;
    const inactive = (await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`, [TgAccountStatus.INACTIVE])).count;
    const withProxy = (await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE proxy_id IS NOT NULL`)).count;
    const withoutProxy = (await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE proxy_id IS NULL`)).count;
    const withSession = (await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE session IS NOT NULL`)).count;

    return {
      total,
      active,
      banned,
      inactive,
      withProxy,
      withoutProxy,
      withSession
    };
  }

  /**
   * Получить случайный доступный аккаунт
   */
  static async getRandomAvailable(): Promise<AccountData | null> {
    return this.queryOne(`
      SELECT * FROM ${this.tableName} 
      WHERE status = ? AND session IS NOT NULL 
      ORDER BY RANDOM() 
      LIMIT 1
    `, [TgAccountStatus.ACTIVE]);
  }
}
