"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telegraf2byteContextExtraMethods = void 0;
exports.Telegraf2byteContextExtraMethods = {
    async deleteLastMessage() {
        const lastMessageId = this.user.lastMessageId;
        if (lastMessageId) {
            try {
                console.log('Deleting last message with ID:', lastMessageId);
                await this.deleteMessage(lastMessageId);
                this.user.removeMessageId(lastMessageId);
            }
            catch (error) {
                console.error('Failed to delete last message:', error);
            }
            ;
        }
    },
};
