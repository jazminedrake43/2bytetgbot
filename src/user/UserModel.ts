import { UserAttributes, UserServiceAttributes } from '../types';
import { UserStore } from './UserStore';

export class UserModel {
  attributes: UserAttributes;
  serviceAttributes: UserServiceAttributes = {
    lastActive: new Date(),
    lastMessageIds: [],
  };

  private userSession: UserStore | null = null;
  
  constructor(attributes: UserAttributes) {
    this.attributes = attributes;
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

  get id(): number | undefined {
    return this.attributes.id;
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

  static async register(params: { tgUsername: string; tgId: number; tgName: string; userRefid?: number }): Promise<UserModel> {
    // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
    // let resApi = await api.fetch("user/register", "post", {
    //   tg_username: params.tgUsername,
    //   tg_id: params.tgId,
    //   name: params.tgName,
    //   user_refid: params.userRefid,
    // });
    
    // return UserModel.make(resApi.data);
    
    return UserModel.make({
      tg_id: params.tgId,
      tg_username: params.tgUsername,
      tg_name: params.tgName
    });
  }

  static async findOnServer(tgUsername: string): Promise<UserModel> {
    // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
    // const user = await api.fetch("user/get/" + tgUsername);
    // return UserModel.make(user.data);
    
    return UserModel.make({
      tg_id: 0,
      tg_username: tgUsername,
      tg_name: tgUsername
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
}
