"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStore = void 0;
const UserModel_1 = require("./UserModel");
class UserStore {
    constructor(envConfig) {
        this.usersMap = new Map();
        this.usersSession = new Map();
        this.api = null;
        if (envConfig) {
            let url = envConfig.BOT_API_URL || '';
            // Здесь должна быть инициализация API, но мы оставим это для будущей реализации
            // this.api = new Api({
            //   apiUrl: url.endsWith('/') ? url : url + '/',
            // });
        }
    }
    async checkOrRegister(params) {
        if (!this.usersMap.has(params.tgUsername) && this.api) {
            let userData = null;
            try {
                let resApi = await this.api.fetch('user/get/' + params.tgUsername);
                userData = resApi.data;
            }
            catch (err) {
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
    find(tgUsername) {
        return this.usersMap.get(tgUsername);
    }
    findSession(userModel) {
        return this.usersSession.get(userModel) || {};
    }
    exists(tgUsername) {
        return this.usersMap.has(tgUsername);
    }
    add(tgUsername, data) {
        if (data instanceof UserModel_1.UserModel) {
            this.usersMap.set(tgUsername, data);
        }
        else {
            this.usersMap.set(tgUsername, new UserModel_1.UserModel(data));
        }
        this.usersSession.set(this.usersMap.get(tgUsername), {});
        return true;
    }
    upActive(tgUsername) {
        const user = this.usersMap.get(tgUsername);
        if (user) {
            user.upActive();
        }
        return this;
    }
    storeMessageId(tgUsername, messageId, limit) {
        const user = this.usersMap.get(tgUsername);
        if (user) {
            user.storeMessageId(messageId, limit);
        }
        return this;
    }
    getLastMessageId(tgUsername) {
        const user = this.usersMap.get(tgUsername);
        if (user) {
            const ids = user.lastMessageIds;
            return ids.length ? ids[ids.length - 1] : undefined;
        }
        return undefined;
    }
    autocleanup(minutes = 1) {
        const getNotActiveUsers = () => {
            return Array.from(this.usersMap).filter(([tgUsername, data]) => {
                return (data.serviceAttributes.lastActive.getTime() <= Date.now() - minutes * 60 * 1000);
            });
        };
        setInterval(() => {
            getNotActiveUsers().forEach(([tgUsername]) => {
                this.usersMap.delete(tgUsername);
            });
        }, 60 * 1000);
    }
}
exports.UserStore = UserStore;
