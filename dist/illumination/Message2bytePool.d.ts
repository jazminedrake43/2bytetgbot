import type { Section, Telegraf2byteContext } from "@2byte/tgbot-framework";
import Message2byte from "./Message2Byte";
import Message2ByteLiveProgressive from "./Message2ByteLiveProgressive";
import { Message } from "telegraf/types";
export default class Message2bytePool {
    private message2byte;
    private ctx;
    private messageValue;
    private section;
    static init(message2byte: Message2byte, ctx: Telegraf2byteContext, section: Section): Message2bytePool;
    constructor(message2byte: Message2byte, ctx: Telegraf2byteContext, section: Section);
    message(message: string): this;
    update(message: string): this;
    append(message: string): this;
    prepend(message: string): this;
    liveProgressive(): Message2ByteLiveProgressive;
    send(): Promise<true | Message.TextMessage | Message.PhotoMessage | (import("telegraf/types").Update.Edited & Message.CaptionableMessage)>;
    sendReturnThis(): Promise<this>;
    sleepProgressBar(messageWait: string, ms: number): Promise<void>;
}
