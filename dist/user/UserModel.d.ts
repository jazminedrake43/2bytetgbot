import { UserAttributes, UserServiceAttributes } from '../types';
import { UserStore } from './UserStore';
export declare class UserModel {
    attributes: UserAttributes;
    serviceAttributes: UserServiceAttributes;
    private userSession;
    constructor(attributes: UserAttributes);
    setSessionStorage(storage: UserStore): this;
    upActive(): void;
    storeMessageId(messageId: number, limit: number): this;
    getAttributes(): UserAttributes;
    get id(): number | undefined;
    get lastMessageIds(): number[];
    get lastMessageId(): number | undefined;
    removeMessageId(messageId: number): this;
    static existsOnServer(tgUsername: string, tgId: number): Promise<boolean>;
    static register(params: {
        tgUsername: string;
        tgId: number;
        tgName: string;
        userRefid?: number;
    }): Promise<UserModel>;
    static findOnServer(tgUsername: string): Promise<UserModel>;
    refresh(): Promise<boolean>;
    refreshAttributes(): Promise<this>;
    static make(attributes: UserAttributes): UserModel;
    static errorHandler(error: any, metaInfo?: any): void;
    get username(): string;
}
