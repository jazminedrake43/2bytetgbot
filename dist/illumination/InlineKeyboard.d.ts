import { Telegraf2byteContext } from "./Telegraf2byteContext";
export declare class InlineKeyboard {
    private ctx;
    private keyboard;
    static init(ctx: Telegraf2byteContext): InlineKeyboard;
    constructor(ctx: Telegraf2byteContext);
    append(row: any[] | any[][]): InlineKeyboard;
    prepend(row: any[]): InlineKeyboard;
    valueOf(): any[][];
    [Symbol.toPrimitive](): any[][];
}
