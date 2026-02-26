import { UserModel } from './UserModel';
import { UserSession } from '../types';
import { EnvVars } from '../types';

interface ApiConfig {
  apiUrl: string;
}

interface Api {
  fetch(endpoint: string, method?: string, data?: any): Promise<any>;
}

export class UserStore {
  private usersMap: Map<string, UserModel> = new Map();
  private usersSession: Map<UserModel, UserSession> = new Map();
  private api: Api | null = null;

  constructor(envConfig?: EnvVars) {
    if (envConfig) {
      let url = envConfig.BOT_API_URL || '';
      
      // Здесь должна быть инициализация API, но мы оставим это для будущей реализации
      // this.api = new Api({
      //   apiUrl: url.endsWith('/') ? url : url + '/',
      // });
    }
  }

  async checkOrRegister(params: { tgUsername: string, tgId: number, tgName: string }): Promise<any> {
    if (!this.usersMap.has(String(params.tgId)) && this.api) {
      let userData = null;

      try {
        let resApi = await this.api.fetch('user/get/' + params.tgId);
        userData = resApi.data;
      } catch (err) {
        let resApi = await this.api.fetch('user/register', 'post', {
          tg_username: params.tgUsername,
          tg_id: params.tgId,
          name: params.tgName,
        });

        userData = resApi.data;
      }

      if (userData !== null) {
        this.add(params.tgId, userData);
      }

      return userData;
    }
    return null;
  }

  find(tgId: number): UserModel {
    return this.usersMap.get(String(tgId)) as UserModel;
  }

  findSession(userModel: UserModel): UserSession {
    return this.usersSession.get(userModel) || {};
  }

  exists(tgId: number): boolean {
    return this.usersMap.has(String(tgId));
  }

  add(tgId: number, data: UserModel | any): boolean {
    const key = String(tgId);
    if (data instanceof UserModel) {
      this.usersMap.set(key, data);
    } else {
      this.usersMap.set(key, new UserModel(data));
    }

    this.usersSession.set(this.usersMap.get(key) as UserModel, {});

    return true;
  }

  upActive(tgId: number): this {
    const user = this.usersMap.get(String(tgId));
    if (user) {
      user.upActive();
    }
    return this;
  }

  storeMessageId(tgId: number, messageId: number, limit: number): this {
    const user = this.usersMap.get(String(tgId));
    if (user) {
      user.storeMessageId(messageId, limit);
    }
    return this;
  }

  getLastMessageId(tgId: number): number | undefined {
    const user = this.usersMap.get(String(tgId));
    if (user) {
      const ids = user.lastMessageIds;
      return ids.length ? ids[ids.length - 1] : undefined;
    }
    return undefined;
  }

  autocleanup(minutes: number = 1): void {
    const getNotActiveUsers = (): [string, UserModel][] => {
      return Array.from(this.usersMap).filter(([_key, data]) => {
        return (
          data.serviceAttributes.lastActive.getTime() <= Date.now() - minutes * 60 * 1000
        );
      });
    };

    setInterval(() => {
      getNotActiveUsers().forEach(([key]) => {
        this.usersMap.delete(key);
      });
    }, 60 * 1000);
  }

  deleteByUsername(tgUsername: string): boolean {
    const entry = Array.from(this.usersMap).find(([_, user]) => user.username === tgUsername);
    if (entry) {
      const [key, user] = entry;
      this.usersSession.delete(user);
      return this.usersMap.delete(key);
    }
    return false;
  }

  deleteById(userId: number): boolean {
    const userEntry = Array.from(this.usersMap).find(([_, user]) => user.id === userId);
    if (userEntry) {
      const [key, user] = userEntry;
      this.usersSession.delete(user);
      return this.usersMap.delete(key);
    }
    return false;
  }
}
