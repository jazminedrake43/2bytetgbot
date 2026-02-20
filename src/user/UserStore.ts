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
    if (!this.usersMap.has(params.tgUsername) && this.api) {
      let userData = null;

      try {
        let resApi = await this.api.fetch('user/get/' + params.tgUsername);
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
        this.add(params.tgUsername, userData);
      }

      return userData;
    }
    return null;
  }

  find(tgUsername: string): UserModel {
    return this.usersMap.get(tgUsername) as UserModel;
  }

  findSession(userModel: UserModel): UserSession {
    return this.usersSession.get(userModel) || {};
  }

  exists(tgUsername: string): boolean {
    return this.usersMap.has(tgUsername);
  }

  add(tgUsername: string, data: UserModel | any): boolean {
    if (data instanceof UserModel) {
      this.usersMap.set(tgUsername, data);
    } else {
      this.usersMap.set(tgUsername, new UserModel(data));
    }
    
    this.usersSession.set(this.usersMap.get(tgUsername) as UserModel, {});

    return true;
  }

  upActive(tgUsername: string): this {
    const user = this.usersMap.get(tgUsername);
    if (user) {
      user.upActive();
    }
    return this;
  }

  storeMessageId(tgUsername: string, messageId: number, limit: number): this {
    const user = this.usersMap.get(tgUsername);
    if (user) {
      user.storeMessageId(messageId, limit);
    }
    return this;
  }

  getLastMessageId(tgUsername: string): number | undefined {
    const user = this.usersMap.get(tgUsername);
    if (user) {
      const ids = user.lastMessageIds;
      return ids.length ? ids[ids.length - 1] : undefined;
    }
    return undefined;
  }

  autocleanup(minutes: number = 1): void {
    const getNotActiveUsers = (): [string, UserModel][] => {
      return Array.from(this.usersMap).filter(([tgUsername, data]) => {
        return (
          data.serviceAttributes.lastActive.getTime() <= Date.now() - minutes * 60 * 1000
        );
      });
    };

    setInterval(() => {
      getNotActiveUsers().forEach(([tgUsername]) => {
        this.usersMap.delete(tgUsername);
      });
    }, 60 * 1000);
  }

  deleteByUsername(tgUsername: string): boolean {
    const user = this.usersMap.get(tgUsername);
    if (user) {
      this.usersSession.delete(user);
      return this.usersMap.delete(tgUsername);
    }
    return false;
  }

  deleteById(userId: number): boolean {
    const userEntry = Array.from(this.usersMap).find(([_, user]) => user.id === userId);
    if (userEntry) {
      const [tgUsername, user] = userEntry;
      this.usersSession.delete(user);
      return this.usersMap.delete(tgUsername);
    }
    return false;
  }
}
