import { Model } from "./Model";

export interface ProxyData {
  /** PRIMARY KEY */
  id?: number;
  ip: string;
  port: number;
  username?: string | null;
  password?: string | null;
  secret?: string | null;
  socksType?: number | null; // 4 or 5
  MTProxy?: number; // 0 or 1
  status?: number; // 0 = inactive, 1 = active
  source?: string | null; // Note: keeping original typo from migration
  last_check?: string | null;
  created_at?: string;
  updated_at?: string;
}

export enum ProxyStatus {
  INACTIVE = 0,
  ACTIVE = 1
}

export enum ProxySocksType {
  SOCKS4 = 4,
  SOCKS5 = 5
}

export class Proxy extends Model {
  static tableName = 'proxy';

  /**
   * Создать новый прокси
   */
  static async create(data: ProxyData): Promise<number> {
    const {
      ip,
      port,
      username = null,
      password = null,
      secret = null,
      socksType = null,
      MTProxy = 0,
      status = ProxyStatus.INACTIVE,
      source: souurce = null,
      last_check = null,
    } = data;

    const stmt = this.db.prepare(
      `INSERT INTO ${this.tableName} 
       (ip, port, username, password, secret, socksType, MTProxy, status, souurce, last_check) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    const result = stmt.run(ip, port, username, password, secret, socksType, MTProxy, status, souurce, last_check);
    return result.lastInsertRowid as number;
  }

  /**
   * Найти прокси по ID
   */
  static async findById(id: number): Promise<ProxyData | null> {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /**
   * Найти прокси по IP и порту
   */
  static async findByIpPort(ip: string, port: number): Promise<ProxyData | null> {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE ip = ? AND port = ?`, [ip, port]);
  }

  /**
   * Получить все активные прокси
   */
  static async getActive(): Promise<ProxyData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY last_check DESC`, [ProxyStatus.ACTIVE]);
  }

  /**
   * Получить все прокси
   */
  static async getAll(): Promise<ProxyData[]> {
    return this.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
  }

  /**
   * Получить прокси по типу SOCKS
   */
  static async getBySocksType(socksType: ProxySocksType): Promise<ProxyData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE socksType = ? AND status = ? ORDER BY last_check DESC`, 
      [socksType, ProxyStatus.ACTIVE]);
  }

  /**
   * Получить MTProxy прокси
   */
  static async getMTProxies(): Promise<ProxyData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE MTProxy = 1 AND status = ? ORDER BY last_check DESC`, 
      [ProxyStatus.ACTIVE]);
  }

  /**
   * Обновить статус прокси
   */
  static async updateStatus(id: number, status: ProxyStatus): Promise<void> {
    this.execute(`UPDATE ${this.tableName} SET status = ? WHERE id = ?`, [status, id]);
  }

  /**
   * Обновить время последней проверки
   */
  static async updateLastCheck(id: number, lastCheck: string = new Date().toISOString()): Promise<void> {
    this.execute(`UPDATE ${this.tableName} SET last_check = ? WHERE id = ?`, [lastCheck, id]);
  }

  /**
   * Обновить данные прокси
   */
  static async update(id: number, data: Partial<ProxyData>): Promise<void> {
    const fields = Object.keys(data).filter(key => key !== 'id');
    const values = fields.map(field => data[field as keyof ProxyData]);
    
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    this.execute(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  /**
   * Удалить прокси
   */
  static async delete(id: number): Promise<void> {
    this.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /**
   * Проверить, существует ли прокси
   */
  static async exists(ip: string, port: number): Promise<boolean> {
    const result = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE ip = ? AND port = ?`, [ip, port]);
    return result.count > 0;
  }

  /**
   * Получить количество прокси по статусу
   */
  static async getCountByStatus(status: ProxyStatus): Promise<number> {
    const result = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`, [status]);
    return result.count;
  }

  /**
   * Получить случайный активный прокси
   */
  static async getRandomActive(): Promise<ProxyData | null> {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY RANDOM() LIMIT 1`, [ProxyStatus.ACTIVE]);
  }

  /**
   * Массовое добавление прокси
   */
  static async bulkCreate(proxies: ProxyData[]): Promise<number[]> {
    const ids: number[] = [];
    
    this.transaction(() => {
      for (const proxy of proxies) {
        const id = this.create(proxy);
        ids.push(id as any);
      }
    });

    return ids;
  }

  /**
   * Деактивировать все прокси
   */
  static async deactivateAll(): Promise<void> {
    this.execute(`UPDATE ${this.tableName} SET status = ?`, [ProxyStatus.INACTIVE]);
  }

  /**
   * Поиск прокси по источнику
   */
  static async findBySource(source: string): Promise<ProxyData[]> {
    return this.query(`SELECT * FROM ${this.tableName} WHERE souurce = ? ORDER BY created_at DESC`, [source]);
  }

  /**
   * Получить статистику по прокси
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    socks4: number;
    socks5: number;
    mtproxy: number;
  }> {
    const total = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName}`).count;
    const active = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`, [ProxyStatus.ACTIVE]).count;
    const inactive = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`, [ProxyStatus.INACTIVE]).count;
    const socks4 = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE socksType = ?`, [ProxySocksType.SOCKS4]).count;
    const socks5 = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE socksType = ?`, [ProxySocksType.SOCKS5]).count;
    const mtproxy = this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE MTProxy = 1`).count;

    return {
      total,
      active,
      inactive,
      socks4,
      socks5,
      mtproxy
    };
  }
}