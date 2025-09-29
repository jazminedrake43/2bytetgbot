"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineKeyboard = void 0;
class InlineKeyboard {
    static init(ctx) {
        return new InlineKeyboard(ctx);
    }
    constructor(ctx) {
        this.ctx = ctx;
        this.keyboard = [];
    }
    append(row) {
        if (!Array.isArray(row)) {
            this.keyboard.push([row]);
        }
        else if (Array.isArray(row[0])) {
            this.keyboard.push(...row);
        }
        else {
            this.keyboard.push(row);
        }
        return this;
    }
    prepend(row) {
        if (!Array.isArray(row)) {
            this.keyboard.unshift([row]);
        }
        else if (Array.isArray(row[0])) {
            this.keyboard.unshift(...row);
        }
        else {
            this.keyboard.unshift(row);
        }
        return this;
    }
    valueOf() {
        return this.keyboard;
    }
    [Symbol.toPrimitive]() {
        return this.valueOf();
    }
}
exports.InlineKeyboard = InlineKeyboard;
