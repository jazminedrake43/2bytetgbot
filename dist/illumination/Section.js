"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = void 0;
const mustache_1 = __importDefault(require("mustache"));
const telegraf_1 = require("telegraf");
const InlineKeyboard_1 = require("./InlineKeyboard");
const Message2Byte_1 = __importDefault(require("./Message2Byte"));
class Section {
    constructor(options) {
        this.sectionId = "BaseSection";
        this.markup = telegraf_1.Markup;
        this.btnHome = this.markup.button.callback("🏠 Лобби", "home.index");
        this.iconBack = "🔙";
        this.iconPlus = "➕";
        this.iconDelete = "✖️";
        this.iconOk = "☑️";
        this.iconInput = "⤵️";
        this.iconOutput = "⤴️";
        this.iconTime = "⏱";
        this.iconCheck = "\u{2714}";
        this.iconSet = "🔖";
        this.iconRefresh = "🔃";
        this.iconHistory = "🗂";
        this.iconEuro = "💶";
        this.iconRejected = "❌";
        this.labelBack = `${this.iconBack} Назад`;
        this.callbackParams = null;
        this.mustache = mustache_1.default;
        this.mainMenuKeyboardArray = [];
        this.ctx = options.ctx;
        this.bot = options.bot;
        this.app = options.app;
        this.mainMenuKeyboardArray = this.app.config.mainMenuKeyboard;
        this.route = options.route;
        this.db = global.db;
        this.callbackParams = this.parseParamsCallbackdata();
        this.cancelUserWaitingReply();
    }
    async setup() { }
    async unsetup() { }
    async up() { }
    async down() { }
    parseParamsCallbackdata() {
        let strparams = this.ctx.update?.callback_query?.data?.match(/\[(.+?)\]/);
        if (strparams !== null && strparams?.[1] !== undefined) {
            const valueToType = isFinite(Number(strparams[1])) ? +strparams[1] : strparams[1];
            return new URLSearchParams(String(valueToType));
        }
        return new URLSearchParams();
    }
    makePaginateButtons(metadata, callbackDataAction, paramsQuery = {}) {
        if (metadata.hasOwnProperty("meta"))
            metadata = metadata.meta;
        if (metadata.last_page == 1)
            return [];
        const makeActionData = (page) => {
            const params = { ...paramsQuery, page: page.toString() };
            return `${callbackDataAction}[${new URLSearchParams(params).toString()}]`;
        };
        const layoutButtons = [];
        const pageButtons = [];
        const makeButtonCallback = (text, callbackData) => {
            return this.markup.button.callback(text, callbackData);
        };
        // Pair buttons the start and end
        if (metadata.last_page > 1) {
            const lineFirstNext = [];
            if (metadata.current_page > 1) {
                lineFirstNext.push(makeButtonCallback("Назад", makeActionData(metadata.current_page - 1)));
            }
            if (metadata.current_page < metadata.last_page) {
                lineFirstNext.push(makeButtonCallback("Вперед", makeActionData(metadata.current_page + 1)));
            }
            layoutButtons.push(lineFirstNext);
        }
        const generatorPageNumber = (startPage, lastPage) => {
            const buttons = [];
            for (let i = startPage, c = 1; i <= lastPage && c <= 8; i++, c++) {
                let btn = makeButtonCallback(`${i}`, makeActionData(i));
                if (i == metadata.current_page) {
                    btn = makeButtonCallback(`\u{2714} ${i}`, makeActionData(metadata.current_page));
                }
                buttons.push(btn);
                if (startPage + c > metadata.last_page)
                    break;
            }
            return buttons;
        };
        // Page numbers a generator
        if (metadata.last_page > 8) {
            let startPage = 0;
            let lastPage = 0;
            if (metadata.current_page < 8) {
                startPage = 1;
                lastPage = 8;
            }
            else {
                startPage = metadata.current_page - 3;
                lastPage = metadata.current_page + 4;
            }
            layoutButtons.push(generatorPageNumber(startPage, lastPage));
        }
        else {
            layoutButtons.push(generatorPageNumber(1, metadata.last_page));
        }
        layoutButtons.push(pageButtons);
        // Pair buttons the start and end
        if (metadata.current_page > 1 && metadata.last_page > 8) {
            const lineStartLast = [];
            lineStartLast.push(makeButtonCallback("В начало", makeActionData(1)));
            if (metadata.current_page < metadata.last_page) {
                lineStartLast.push(makeButtonCallback("В конец", makeActionData(metadata.last_page)));
            }
            layoutButtons.push(lineStartLast);
        }
        return layoutButtons;
    }
    static makeManualPaginateButtons(params) {
        let { callbackDataAction, currentPage, totalRecords, perPage, paramsQuery } = params;
        currentPage = parseInt(String(currentPage));
        const last_page = Math.ceil(totalRecords / perPage);
        if (last_page <= 1)
            return [];
        const makeActionData = (page) => {
            const params = { ...paramsQuery, page: page.toString() };
            return `${callbackDataAction}[${new URLSearchParams(params).toString()}]`;
        };
        const layoutButtons = [];
        const makeButtonCallback = (text, callbackData) => {
            return telegraf_1.Markup.button.callback(text, callbackData);
        };
        // Pair buttons the start and end
        if (last_page > 1) {
            const lineFirstNext = [];
            if (currentPage > 1) {
                lineFirstNext.push(makeButtonCallback("⬅️ Назад", makeActionData(currentPage - 1)));
            }
            if (currentPage < last_page) {
                lineFirstNext.push(makeButtonCallback("Вперед ➡️", makeActionData(currentPage + 1)));
            }
            layoutButtons.push(lineFirstNext);
        }
        const generatorPageNumber = (startPage, lastPage) => {
            const buttons = [];
            for (let i = startPage, c = 1; i <= lastPage && c <= 8; i++, c++) {
                let btn = makeButtonCallback(`${i}`, makeActionData(i));
                if (i == currentPage) {
                    btn = makeButtonCallback(`\u{2714} ${i}`, makeActionData(currentPage));
                }
                buttons.push(btn);
                if (startPage + c > last_page)
                    break;
            }
            return buttons;
        };
        // Page numbers a generator
        if (last_page > 8) {
            let startPage = 0;
            let lastPage = 0;
            if (currentPage < 8) {
                startPage = 1;
                lastPage = 8;
            }
            else {
                startPage = currentPage - 3;
                lastPage = currentPage + 4;
            }
            layoutButtons.push(generatorPageNumber(startPage, lastPage));
        }
        else {
            layoutButtons.push(generatorPageNumber(1, last_page));
        }
        // Pair buttons the start and end
        if (currentPage > 1 && last_page > 8) {
            const lineStartLast = [];
            lineStartLast.push(makeButtonCallback("В начало", makeActionData(1)));
            if (currentPage < last_page) {
                lineStartLast.push(makeButtonCallback("В конец", makeActionData(last_page)));
            }
            layoutButtons.push(lineStartLast);
        }
        return layoutButtons;
    }
    isRepeatedQuery(objParamsNeedle) {
        if (!this.callbackParams)
            return false;
        const isEquals = Object.keys(objParamsNeedle)
            .map((key) => [key, objParamsNeedle[key]])
            .every((entry) => {
            return this.callbackParams?.get(entry[0]) == entry[1];
        });
        return isEquals;
    }
    async setupKeyboard() {
        if (this.ctx.userSession.setupKeyboardDone)
            return;
        await this.newMessage("Welcome!")
            .keyboard({
            keyboard: this.mainMenuKeyboardArray,
            resize_keyboard: true,
            one_time_keyboard: true,
        })
            .send();
        this.ctx.userSession.setupKeyboardDone = true;
    }
    async getSetting(name) {
        try {
            const allSettings = await global.settings;
            return allSettings.data[name];
        }
        catch (err) {
            throw err;
        }
    }
    cancelUserWaitingReply() {
        if (this.callbackParams?.has("cancel_wait")) {
            // Очищаем состояние ожидания ввода
            if (this.ctx.userSession.awaitingInput) {
                delete this.ctx.userSession.awaitingInput;
            }
            if (this.ctx.userSession.awaitingInputPromise) {
                // Отклоняем Promise с сообщением об отмене
                this.ctx.userSession.awaitingInputPromise.reject(new Error("Ввод отменен пользователем"));
                delete this.ctx.userSession.awaitingInputPromise;
            }
            return true;
        }
        return false;
    }
    backInlineButtion(data) {
        return this.markup.button.callback(this.labelBack, data);
    }
    inlineButton(text, data) {
        return this.markup.button.callback(text, data);
    }
    setCallbackParams(params) {
        this.callbackParams = params;
        return this;
    }
    existsAnswerInput(inputKey) {
        return this.ctx.userSession[inputKey] !== undefined;
    }
    getAnswerInput(inputKey) {
        return this.ctx.userSession[inputKey];
    }
    setAnswerInput(inputKey, value) {
        this.ctx.userSession[inputKey] = value;
    }
    makeQueryParams(...args) {
        const params = new URLSearchParams();
        args.forEach((arg) => {
            if (typeof arg === "string") {
                new URLSearchParams(arg).forEach((value, key) => {
                    params.set(key, value);
                });
            }
            if (arg !== null && typeof arg === "object") {
                this.app.debugLog("arg", arg);
                for (const [key, value] of Object.entries(arg)) {
                    params.set(key, String(value));
                }
            }
        });
        return params;
    }
    makeInlineKeyboard(buttons) {
        const keyboard = InlineKeyboard_1.InlineKeyboard.init(this.ctx);
        buttons.forEach((row) => {
            keyboard.append(row);
        });
        return keyboard;
    }
    makeInlineButton(text, data) {
        return telegraf_1.Markup.button.callback(text, data);
    }
    message(message) {
        if (this.route.runIsCallbackQuery) {
            return this.updateMessage(message);
        }
        return Message2Byte_1.default.init(this.ctx, this).message(message);
    }
    newMessage(message) {
        return Message2Byte_1.default.init(this.ctx, this).message(message);
    }
    updateMessage(message) {
        return Message2Byte_1.default.init(this.ctx, this).updateMessage(message);
    }
    createPoolNewMessage(message) {
        return Message2Byte_1.default.init(this.ctx, this).createPoolMessage(message);
    }
    createUpdatePoolMessage(message) {
        return Message2Byte_1.default.init(this.ctx, this).createUpdatePoolMessage(message);
    }
    createPoolMessage(message) {
        return this.route.runIsCallbackQuery
            ? this.createUpdatePoolMessage(message)
            : this.createPoolNewMessage(message);
    }
    getCtx() {
        return this.ctx;
    }
    getCurrentSection() {
        return this.app.getRunnedSection(this.ctx.user);
    }
    getPreviousSection() {
        return this.ctx.userSession.previousSection;
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
exports.Section = Section;
