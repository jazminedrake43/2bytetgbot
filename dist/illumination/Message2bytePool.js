"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Message2ByteLiveProgressive_1 = __importDefault(require("./Message2ByteLiveProgressive"));
class Message2bytePool {
    static init(message2byte, ctx, section) {
        return new Message2bytePool(message2byte, ctx, section);
    }
    constructor(message2byte, ctx, section) {
        this.messageValue = "";
        this.message2byte = message2byte;
        this.ctx = ctx;
        this.section = section;
    }
    message(message) {
        this.messageValue = message;
        if (this.section.route.runIsCallbackQuery) {
            this.message2byte.updateMessage(message);
        }
        else {
            this.message2byte.message(message);
        }
        return this;
    }
    update(message) {
        this.messageValue = message;
        this.message2byte.updateMessage(message);
        return this;
    }
    append(message) {
        this.messageValue += message;
        this.message2byte.updateMessage(this.messageValue);
        return this;
    }
    prepend(message) {
        this.messageValue = message + this.messageValue;
        this.message2byte.updateMessage(this.messageValue);
        return this;
    }
    liveProgressive() {
        return Message2ByteLiveProgressive_1.default.init(this.message2byte, this);
    }
    async send() {
        const entity = await this.message2byte.send();
        // if (typeof entity === "object" && entity.message_id) {
        //     this.messageId = entity.message_id;
        //     console.log("Pool message sent with ID:", this.messageId);
        // }
        return entity;
    }
    async sendReturnThis() {
        await this.send();
        return this;
    }
    async sleepProgressBar(messageWait, ms) {
        const { promise, resolve, reject } = Promise.withResolvers();
        const pgIcons = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        let pgIndex = 0;
        message += `[pg]${pgIcons[pgIndex]} ${message}`;
        const pgIntervalTimer = setInterval(() => {
            // Update progress message here
            message = message.replace(/\[pg\].*/, `[pg]${pgIcons[pgIndex]} ${messageWait}`);
            pgIndex = (pgIndex + 1) % pgIcons.length;
            this.message(message)
                .send()
                .catch((err) => {
                clearInterval(pgIntervalTimer);
                reject(err);
            });
        }, 1000);
        setTimeout(() => {
            message = message.replace(/\[pg\].*/, ``);
            clearInterval(pgIntervalTimer);
            resolve();
        }, ms);
        return promise;
    }
    ;
}
exports.default = Message2bytePool;
