"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
class UserModel {
    constructor(attributes) {
        this.serviceAttributes = {
            lastActive: new Date(),
            lastMessageIds: [],
        };
        this.userSession = null;
        this.attributes = attributes;
    }
    setSessionStorage(storage) {
        this.userSession = storage;
        return this;
    }
    upActive() {
        this.serviceAttributes.lastActive = new Date();
    }
    storeMessageId(messageId, limit) {
        if (this.serviceAttributes.lastMessageIds.indexOf(messageId) === -1) {
            this.serviceAttributes.lastMessageIds.push(messageId);
        }
        if (this.serviceAttributes.lastMessageIds.length > limit) {
            this.serviceAttributes.lastMessageIds.shift();
        }
        return this;
    }
    getAttributes() {
        return this.attributes;
    }
    get id() {
        return this.attributes.id;
    }
    get lastMessageIds() {
        return this.serviceAttributes.lastMessageIds;
    }
    get lastMessageId() {
        const ids = this.serviceAttributes.lastMessageIds;
        return ids.length ? ids[ids.length - 1] : undefined;
    }
    removeMessageId(messageId) {
        const index = this.serviceAttributes.lastMessageIds.indexOf(messageId);
        if (index !== -1) {
            this.serviceAttributes.lastMessageIds.splice(index, 1);
        }
        return this;
    }
    static async existsOnServer(tgUsername, tgId) {
        // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
        // const user = await api.fetch("user/get/" + tgUsername + "/" + tgId);
        // return !user.error;
        return false;
    }
    static async register(params) {
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
    static async findOnServer(tgUsername) {
        // Здесь должен быть запрос к API, но мы оставим это для будущей реализации
        // const user = await api.fetch("user/get/" + tgUsername);
        // return UserModel.make(user.data);
        return UserModel.make({
            tg_id: 0,
            tg_username: tgUsername,
            tg_name: tgUsername
        });
    }
    async refresh() {
        if (this.userSession) {
            return this.userSession.add(this.attributes.tg_username, await UserModel.findOnServer(this.attributes.tg_username));
        }
        return false;
    }
    async refreshAttributes() {
        this.attributes = (await UserModel.findOnServer(this.attributes.tg_username)).attributes;
        return this;
    }
    static make(attributes) {
        return new UserModel(attributes);
    }
    static errorHandler(error, metaInfo) {
        if (error instanceof Error) {
            if (metaInfo) {
                console.error("Error addons:", metaInfo);
            }
            throw error;
        }
    }
    get username() {
        return this.attributes.tg_username;
    }
}
exports.UserModel = UserModel;
