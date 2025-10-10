"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const InlineKeyboard_1 = require("./InlineKeyboard");
const Message2bytePool_1 = __importDefault(require("./Message2bytePool"));
class Message2byte {
    constructor(ctx, section) {
        this.messageValue = "";
        this.messageExtra = {};
        this.isUpdate = false;
        this.imagePath = null;
        this.imageCaption = null;
        this.messageId = null;
        this.doAnswerCbQuery = true;
        this.ctx = ctx;
        this.section = section;
    }
    static init(ctx, section) {
        return new Message2byte(ctx, section);
    }
    message(message) {
        this.messageValue = message;
        return this;
    }
    createPoolMessage(message) {
        this.doAnswerCbQuery = false;
        this.messageValue = message;
        return Message2bytePool_1.default.init(this, this.ctx, this.section);
    }
    createUpdatePoolMessage(message) {
        this.isUpdate = true;
        this.messageValue = message;
        return Message2bytePool_1.default.init(this, this.ctx, this.section);
    }
    updateMessage(message) {
        var _a;
        this.messageValue = message;
        this.isUpdate = true;
        (_a = this.messageExtra).message_id && (_a.message_id = this.messageId);
        return this;
    }
    markdown() {
        this.messageExtra.parse_mode = "markdown";
        return this;
    }
    html() {
        this.messageExtra.parse_mode = "html";
        return this;
    }
    extra(extra) {
        this.messageExtra = extra;
        return this;
    }
    keyboard(keyboard) {
        this.messageExtra.reply_markup = {
            keyboard: keyboard.keyboard,
            resize_keyboard: keyboard.resize_keyboard,
            one_time_keyboard: keyboard.one_time_keyboard,
        };
        return this;
    }
    inlineKeyboard(keyboard) {
        let keyboardArray;
        if (keyboard instanceof InlineKeyboard_1.InlineKeyboard) {
            keyboardArray = keyboard.valueOf();
        }
        else {
            keyboardArray = keyboard;
        }
        Object.assign(this.messageExtra, {
            ...telegraf_1.Markup.inlineKeyboard(keyboardArray),
        });
        return this;
    }
    requestInput(inputKey, options = {}) {
        // Устанавливаем значения по умолчанию
        const allowCancel = options.allowCancel !== false; // по умолчанию true
        const cancelButtonText = options.cancelButtonText || "Отмена";
        const cancelAction = options.cancelAction || "home.index[cancel_wait=1]";
        // Если разрешена отмена, добавляем кнопку отмены к клавиатуре
        if (allowCancel && this.messageExtra && "reply_markup" in this.messageExtra) {
            const replyMarkup = this.messageExtra.reply_markup;
            if (replyMarkup && replyMarkup.inline_keyboard) {
                // Добавляем кнопку отмены в начало клавиатуры
                replyMarkup.inline_keyboard.unshift([
                    {
                        text: `❌ ${cancelButtonText}`,
                        callback_data: cancelAction,
                    },
                ]);
            }
        }
        // Сохраняем информацию о запрашиваемом вводе в сессии пользователя
        this.ctx.userSession.awaitingInput = {
            key: inputKey,
            validator: options.validator,
            errorMessage: options.errorMessage || "Неверный формат ввода",
            allowCancel,
            cancelButtonText: `❌ ${cancelButtonText}`,
            cancelAction,
            fileValidation: options.fileValidation,
            runSection: options.runSection,
            retryCount: 0,
        };
        return this;
    }
    async requestInputWithAwait(inputKey, options = {}) {
        // Устанавливаем значения по умолчанию
        const allowCancel = options.allowCancel !== false; // по умолчанию true
        const cancelButtonText = options.cancelButtonText || "Отмена";
        const cancelAction = options.cancelAction || "home.index[cancel_wait=1]";
        // Если разрешена отмена, добавляем кнопку отмены к клавиатуре
        if (allowCancel && this.messageExtra && "reply_markup" in this.messageExtra) {
            const replyMarkup = this.messageExtra.reply_markup;
            if (replyMarkup && replyMarkup.inline_keyboard) {
                // Добавляем кнопку отмены в начало клавиатуры
                replyMarkup.inline_keyboard.unshift([
                    {
                        text: `❌ ${cancelButtonText}`,
                        callback_data: cancelAction,
                    },
                ]);
            }
        }
        // Отправляем сообщение
        await this.send();
        // Возвращаем Promise, который будет разрешен когда пользователь введет данные
        return new Promise((resolve, reject) => {
            this.ctx.userSession.awaitingInputPromise = {
                key: inputKey,
                validator: options.validator,
                errorMessage: options.errorMessage || "Неверный формат ввода",
                allowCancel,
                cancelButtonText: `❌ ${cancelButtonText}`,
                cancelAction,
                fileValidation: options.fileValidation,
                retryCount: 0,
                resolve,
                reject,
            };
        });
    }
    image(pathImage) {
        this.imagePath = pathImage;
        this.imageCaption = this.messageValue;
        this.messageExtra.caption = this.imageCaption;
        return this;
    }
    editMessageCaption(message, extra = {}) {
        return this.ctx.editMessageCaption(message, extra);
    }
    editMessageText(message, extra = {}) {
        return this.ctx.editMessageText(message, extra);
    }
    async send() {
        if (this.isUpdate) {
            if (this.section.route.runIsCallbackQuery) {
                await this.ctx.answerCbQuery();
            }
            const message = this.ctx.callbackQuery?.message;
            if (message) {
                if ('media_group_id' in message || 'caption' in message) {
                    const editMessageCaption = this.editMessageCaption(this.messageValue, this.messageExtra);
                    if (editMessageCaption && 'message_id' in editMessageCaption) {
                        this.messageId = editMessageCaption.message_id;
                    }
                    return editMessageCaption;
                }
                else {
                    const editedText = this.editMessageText(this.messageValue, this.messageExtra);
                    if (editedText && 'message_id' in editedText) {
                        this.messageId = editedText.message_id;
                    }
                    return editedText;
                }
            }
            else {
                this.messageExtra.message_id = this.messageId;
                const messageEntity = await this.editMessageText(this.messageValue, this.messageExtra);
                if (typeof messageEntity === "object" && 'message_id' in messageEntity) {
                    this.messageId = messageEntity.message_id;
                }
                return messageEntity;
            }
        }
        if (this.imagePath) {
            return this.ctx.replyWithPhoto(telegraf_1.Input.fromLocalFile(this.imagePath), this.messageExtra);
        }
        const replyEntity = this.ctx.reply(this.messageValue, this.messageExtra);
        this.messageId = (await replyEntity).message_id;
        return replyEntity;
    }
    sendReturnThis() {
        this.send();
        return this;
    }
    setMessageId(messageId) {
        this.messageId = messageId;
        this.messageExtra.message_id = messageId;
        return this;
    }
}
exports.default = Message2byte;
