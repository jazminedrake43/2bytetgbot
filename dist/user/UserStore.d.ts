import { UserModel } from './UserModel';
import { UserSession } from '../types';
import { EnvVars } from '../types';
export declare class UserStore {
    private usersMap;
    private usersSession;
    private api;
    constructor(envConfig?: EnvVars);
    checkOrRegister(params: {
        tgUsername: string;
        tgId: number;
        tgName: string;
    }): Promise<any>;
    find(tgUsername: string): UserModel;
    findSession(userModel: UserModel): UserSession;
    exists(tgUsername: string): boolean;
    add(tgUsername: string, data: UserModel | any): boolean;
    upActive(tgUsername: string): this;
    storeMessageId(tgUsername: string, messageId: number, limit: number): this;
    getLastMessageId(tgUsername: string): number | undefined;
    autocleanup(minutes?: number): void;
}
