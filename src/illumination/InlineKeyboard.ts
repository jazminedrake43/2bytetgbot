import { Telegraf2byteContext } from "./Telegraf2byteContext";

export class InlineKeyboard {

    private keyboard: any[][] = [];

    static init(ctx: Telegraf2byteContext) {
        return new InlineKeyboard(ctx);
    }

    constructor(private ctx: Telegraf2byteContext) {

    }

    append(row: any[] | any[][]): InlineKeyboard {
        if (!Array.isArray(row)) {
            this.keyboard.push([row]);
        } else if (Array.isArray(row[0])) {
            this.keyboard.push(...row);
        } else {
            this.keyboard.push(row);
        }
        return this;
    }

    prepend(row: any[]): InlineKeyboard {
        if (!Array.isArray(row)) {
            this.keyboard.unshift([row]);
        } else if (Array.isArray(row[0])) {
            this.keyboard.unshift(...row);
        } else {
            this.keyboard.unshift(row);
        }
        return this;
    }

    valueOf(): any[][] {
        return this.keyboard;
    }

    [Symbol.toPrimitive]() {
        return this.valueOf();
    }
}
