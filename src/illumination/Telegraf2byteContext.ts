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
  // msgId?: number;
}

export const Telegraf2byteContextExtraMethods = {
  async deleteLastMessage(this: Telegraf2byteContext): Promise<void> {
    const lastMessageId = this.user.lastMessageId;
    if (lastMessageId) {
      try {

        console.log('Deleting last message with ID:', lastMessageId);

        await this.deleteMessage(lastMessageId);
        
        this.user.removeMessageId(lastMessageId);
      } catch (error) {
        console.error('Failed to delete last message:', error)
        };
    }
  },
};