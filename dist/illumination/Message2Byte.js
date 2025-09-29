"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const InlineKeyboard_1 = require("./InlineKeyboard");
class Message2byte {
    constructor(ctx) {
        this.messageValue = "";
        this.messageExtra = {};
        this.isUpdate = false;
        this.imagePath = null;
        this.imageCaption = null;
        this.ctx = ctx;
    }
    static init(ctx) {
        return new Message2byte(ctx);
    }
    message(message) {
        this.messageValue = message;
        return this;
    }
    updateMessage(message) {
        this.messageValue = message;
        this.isUpdate = true;
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
    async send() {
        if (this.isUpdate) {
            await this.ctx.answerCbQuery();
            const message = this.ctx.callbackQuery?.message;
            if (message) {
                if ('media_group_id' in message || 'caption' in message) {
                    return this.ctx.editMessageCaption(this.messageValue, this.messageExtra);
                }
                else {
                    return this.ctx.editMessageText(this.messageValue, this.messageExtra);
                }
            }
        }
        if (this.imagePath) {
            return this.ctx.replyWithPhoto(telegraf_1.Input.fromLocalFile(this.imagePath), this.messageExtra);
        }
        return this.ctx.reply(this.messageValue, this.messageExtra);
    }
}
exports.default = Message2byte;
