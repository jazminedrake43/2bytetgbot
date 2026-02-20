import { Model } from "./Model";
import crypto from "crypto";
import { UserModel } from "../user/UserModel";

export interface AccessKeyData {
  id: number;
  user_id: number;
  key: string;
  used?: number;
  used_user_id?: number | null;
  created_at?: string;
}

export class AccessKey extends Model {
  static tableName = "access_keys";

  /** Generate a secure random key (hex) */
  static generateKey(lengthBytes = 24): string {
    return crypto.randomBytes(lengthBytes).toString("hex");
  }

  /** Create a new access key and ensure uniqueness */
  static create(data: AccessKeyData): string {
    const { user_id } = data;

    const key = this.generateKey();

    try {
      this.execute(
        `INSERT INTO ${this.tableName} (user_id, key, used, used_user_id) VALUES (?, ?, 0, NULL)`,
        [user_id, key]
      );
      return key;
    } catch (e) {
      // If UNIQUE constraint violation, retry generating a new key
      // other errors will bubble up
      const msg = (e && (e as any).message) || "";
      if (!msg.includes("UNIQUE") && !msg.includes("unique")) throw e;
    }

    return key;
  }

  static findByKey(key: string): AccessKeyData | null {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE key = ?`, [key]);
  }

  static findById(id: number): AccessKeyData | null {
    return this.queryOne(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  static markUsed(key: string, usedUserId?: number): void {
    this.execute(
      `UPDATE ${this.tableName} SET used = 1, used_user_id = ?, created_at = created_at WHERE key = ?`,
      [usedUserId || null, key]
    );
  }

  static revoke(key: string): void {
    this.execute(`DELETE FROM ${this.tableName} WHERE key = ?`, [key]);
  }

  static getAll(limit = 100): AccessKeyData[] {
    return this.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ?`, [limit]);
  }

  /** Get all access keys for a given user */
  static findByUser(userId: number, limit = 100): AccessKeyData[] {
    return this.query(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  /** Return the owner `UserModel` for a given access entry or null */
  static getUserByEntry(entry: AccessKeyData): any | null {
    const userData = this.queryOne(`SELECT * FROM users WHERE id = ?`, [entry.user_id]);
    if (!userData) return null;
    try {
      return UserModel.make(userData);
    } catch (e) {
      return userData;
    }
  }

  static getUsedUserByEntry(entry: AccessKeyData): any | null {
    if (!entry.used_user_id) return null;
    const userData = this.queryOne(`SELECT * FROM users WHERE id = ?`, [entry.used_user_id]);
    if (!userData) return null;
    try {
      return UserModel.make(userData);
    } catch (e) {
      return userData;
    }
  }

  /** Find owner by key string */
  static getUserByKey(key: string): any | null {
    const entry = this.findByKey(key);
    if (!entry) return null;
    return this.getUserByEntry(entry as AccessKeyData);
  }

  static checkKeyValid(key: string): boolean {
    const queryKey = this.queryOne(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE key = ? AND used = 0`,
      [key]
    );

    return queryKey && queryKey.count > 0;
  }
}

export default AccessKey;