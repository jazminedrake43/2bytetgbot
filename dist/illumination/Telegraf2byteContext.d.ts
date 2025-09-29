import { Context } from 'telegraf';
import { UserModel } from '../user/UserModel';
import { UserStore } from '../user/UserStore';
import { UserSession } from '../types';
export interface ITelegraf2byteContextExtraMethods {
    deleteLastMessage(): Promise<void>;
}
export interface Telegraf2byteContext extends Context, ITelegraf2byteContextExtraMethods {
    user: UserModel;
    userStorage: UserStore;
    userSession: UserSession;
}
export declare const Telegraf2byteContextExtraMethods: {
    deleteLastMessage(this: Telegraf2byteContext): Promise<void>;
};
