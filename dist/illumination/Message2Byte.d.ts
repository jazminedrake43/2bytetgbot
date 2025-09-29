import { Telegraf2byteContext } from "./Telegraf2byteContext";
import { InlineKeyboard } from "./InlineKeyboard";
import { RequestInputOptions } from "../types";
import { Message } from "telegraf/types";
export default class Message2byte {
    messageValue: string;
    messageExtra: any;
    isUpdate: boolean;
    private ctx;
    private imagePath;
    private imageCaption;
    constructor(ctx: Telegraf2byteContext);
    static init(ctx: Telegraf2byteContext): Message2byte;
    message(message: string): this;
    updateMessage(message: string): this;
    markdown(): this;
    html(): this;
    extra(extra: Object): this;
    inlineKeyboard(keyboard: [][] | InlineKeyboard): this;
    requestInput(inputKey: string, options?: RequestInputOptions): this;
    requestInputWithAwait(inputKey: string, options?: RequestInputOptions): Promise<string | any>;
    image(pathImage: string): this;
    send(): Promise<true | Message.TextMessage | Message.PhotoMessage | (import("telegraf/types").Update.Edited & Message.CaptionableMessage)>;
}
