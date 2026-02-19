import { Model } from '../core/Model';
import { UserAttributes, UserRegistrationData, UserServiceAttributes } from '../types';
import { UserStore } from './UserStore';

export class UserModel extends Model {
  static tableName = 'users';
  attributes: UserAttributes;
  serviceAttributes: UserServiceAttributes = {
    lastActive: new Date(),
    lastMessageIds: [],
  };

  private userSession: UserStore | null = null;
  
  constructor(attributes: UserAttributes) {
    super();
    this.attributes = attributes;
  }

  static getAll(): UserModel[] {
    const usersData = this.query(`SELECT * FROM ${this.tableName}`);
    return usersData.map((data: any) => UserModel.make(data));
  }

  setSessionStorage(storage: UserStore): this {
    this.userSession = storage;
    return this;
  }

  upActive(): void {
    this.serviceAttributes.lastActive = new Date();
  }

  storeMessageId(messageId: number, limit: number): this {
    if (this.serviceAttributes.lastMessageIds.indexOf(messageId) === -1) {
      this.serviceAttributes.lastMessageIds.push(messageId);
    }

    if (this.serviceAttributes.lastMessageIds.length > limit) {
      this.serviceAttributes.lastMessageIds.shift();
    }

    return this;
  }

  getAttributes(): UserAttributes {
    return this.attributes;
  }

  get id(): number {
    return this.attributes.id;
  }

  get tgUsername(): string {
    return this.attributes.tg_username;
  }

  get tgName(): string {
    return this.attributes.tg_first_name + (this.attributes.tg_last_name ? " " + this.attributes.tg_last_name : "");
  }

  get lastMessageIds(): number[] {
    return this.serviceAttributes.lastMessageIds;
  }

  get lastMessageId(): number | undefined {
    const ids = this.serviceAttributes.lastMessageIds;
    return ids.length ? ids[ids.length - 1] : undefined;
  }

  removeMessageId(messageId: number): this {
    const index = this.serviceAttributes.lastMessageIds.indexOf(messageId);
    if (index !== -1) {
      this.serviceAttributes.lastMessageIds.splice(index, 1);
    }
    return this;
  }

  static async existsOnServer(tgUsername: string, tgId: number): Promise<boolean> {
    // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
    // const user = await api.fetch("user/get/" + tgUsername + "/" + tgId);
    // return !user.error;
    return false;
  }

  static async register(params: UserRegistrationData): Promise<UserModel> {
    // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
    // let resApi = await api.fetch("user/register", "post", {
    //   tg_username: params.tgUsername,
    //   tg_id: params.tgId,
    //   tg_first_name: params.tgFirstName,
    //   tg_last_name: params.tgLastName,
    //   user_refid: params.userRefid,
    //   role: params.role || 'user',
    //   language: params.language || 'en'
    // });
    
    // return UserModel.make(resApi.data);
    this.resolveDb();
    
    if (this.db && !this.exists('WHERE tg_id = ?', [params.tg_id])) {
      const result = this.run(
        `INSERT INTO ${this.tableName} (tg_id, tg_username, tg_first_name, tg_last_name, user_refid, role, language) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          params.tg_id,
          params.tg_username,
          params.tg_first_name,
          params.tg_last_name || null,
          params.user_refid || null,
          params.role || 'user',
          params.language || 'en',
        ]
      );

      if (!result || !result.lastInsertRowid) {
        throw new Error("Failed to register user in the database.");
      }

      return UserModel.make({
        id: result.lastInsertRowid as number,
        tg_id: params.tg_id,
        tg_username: params.tg_username,
        tg_first_name: params.tg_first_name,
        tg_last_name: params.tg_last_name,
        user_refid: params.user_refid,
        role: params.role || 'user',
        language: params.language || 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const user = this.findByUsername(params.tg_username);

    if (user) {
      return user;
    }

    throw new Error("Error not found user params:" + JSON.stringify(params));
  }

  static findByUsername(tgUsername: string): UserModel | undefined {
    if (this.db) {
      const userData = this.queryOne(`SELECT * FROM ${this.tableName} WHERE tg_username = ?`, [tgUsername]);
      
      if (userData) {
        return UserModel.make(userData);
      }
    } else {
      throw new Error("Database connection is not set.");
    }

    return undefined;
  }

  static async findOnServer(tgUsername: string): Promise<UserModel> {
    // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
    // const user = await api.fetch("user/get/" + tgUsername);
    // return UserModel.make(user.data);
    
    const now = new Date().toISOString();
    return UserModel.make({
      id: 0,
      tg_id: 0,
      tg_username: tgUsername,
      tg_first_name: tgUsername,
      role: 'user',
      language: 'en',
      created_at: now,
      updated_at: now
    });
  }

  async refresh(): Promise<boolean> {
    if (this.userSession) {
      return this.userSession.add(
        this.attributes.tg_username,
        await UserModel.findOnServer(this.attributes.tg_username)
      );
    }
    return false;
  }

  async refreshAttributes(): Promise<this> {
    this.attributes = (await UserModel.findOnServer(this.attributes.tg_username)).attributes;
    return this;
  }

  static make(attributes: UserAttributes): UserModel {
    return new UserModel(attributes);
  }

  static errorHandler(error: any, metaInfo?: any): void {
    if (error instanceof Error) {
      if (metaInfo) {
        console.error("Error addons:", metaInfo);
      }

      throw error;
    }
  }

  get username(): string {
    return this.attributes.tg_username;
  }

  get tgId(): number {
    return this.attributes.tg_id;
  }

  get firstName(): string {
    return this.attributes.tg_first_name;
  }

  get lastName(): string | undefined {
    return this.attributes.tg_last_name;
  }

  get fullName(): string {
    const firstName = this.attributes.tg_first_name || '';
    const lastName = this.attributes.tg_last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  get role(): 'user' | 'admin' {
    return this.attributes.role;
  }

  get roleIsAdmin(): boolean {
    return this.attributes.role === 'admin';
  }

  get language(): string {
    return this.attributes.language;
  }

  get isBannedByUser(): boolean {
    return this.attributes.is_banned_by_user || false;
  }

  get isBannedByAdmin(): boolean {
    return this.attributes.is_banned_by_admin || false;
  }

  get bannedReason(): string | undefined {
    return this.attributes.bunned_reason;
  }

  get userRefId(): number | undefined {
    return this.attributes.user_refid;
  }

  get createdAt(): string {
    return this.attributes.created_at;
  }

  get updatedAt(): string {
    return this.attributes.updated_at;
  }

  setRole(role: 'user' | 'admin'): this {
    this.attributes.role = role;
    return this;
  }

  setLanguage(language: string): this {
    this.attributes.language = language;
    return this;
  }

  banByAdmin(reason?: string): this {
    this.attributes.is_banned_by_admin = true;
    if (reason) {
      this.attributes.bunned_reason = reason;
    }
    return this;
  }

  unbanByAdmin(): this {
    this.attributes.is_banned_by_admin = false;
    this.attributes.bunned_reason = undefined;
    return this;
  }

  banByUser(): this {
    this.attributes.is_banned_by_user = true;
    return this;
  }

  unbanByUser(): this {
    this.attributes.is_banned_by_user = false;
    return this;
  }

  updateFirstName(firstName: string): this {
    this.attributes.tg_first_name = firstName;
    return this;
  }

  updateLastName(lastName: string): this {
    this.attributes.tg_last_name = lastName;
    return this;
  }

  updateUsername(username: string): this {
    this.attributes.tg_username = username;
    return this;
  }
}
