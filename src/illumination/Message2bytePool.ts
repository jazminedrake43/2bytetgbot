import type { Section, Telegraf2byteContext } from "@2byte/tgbot-framework";
import Message2byte from "./Message2Byte";
import Message2ByteLiveProgressive from "./Message2ByteLiveProgressive";

export default class Message2bytePool {
    private message2byte: Message2byte;
    private ctx: Telegraf2byteContext;
    private messageValue: string = "";
    private section: Section;

    static init(message2byte: Message2byte, ctx: Telegraf2byteContext, section: Section) {
        return new Message2bytePool(message2byte, ctx, section);
    }

    constructor(message2byte: Message2byte, ctx: Telegraf2byteContext, section: Section) {
        this.message2byte = message2byte;
        this.ctx = ctx;
        this.section = section;
    }

    message(message: string): this {
        this.messageValue = message;
        if (this.section.route.runIsCallbackQuery) {
            this.message2byte.updateMessage(message);
        } else {
            this.message2byte.message(message);
        }
        return this;
    }

    update(message: string): this {
        this.messageValue = message;
        this.message2byte.updateMessage(message);
        return this;
    }

    append(message: string): this {
        this.messageValue += message;
        this.message2byte.updateMessage(this.messageValue);
        return this;
    }

    prepend(message: string): this {
        this.messageValue = message + this.messageValue;
        this.message2byte.updateMessage(this.messageValue);
        return this;
    }

    liveProgressive(): Message2ByteLiveProgressive {
        return Message2ByteLiveProgressive.init(this.message2byte, this);
    }

    async send() {

        const entity = await this.message2byte.send();

        // if (typeof entity === "object" && entity.message_id) {
        //     this.messageId = entity.message_id;
        //     console.log("Pool message sent with ID:", this.messageId);
        // }

        return entity;
    }

    async sendReturnThis(): Promise<this> {
        await this.send();
        return this;
    }

    async sleepProgressBar(messageWait: string, ms: number): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const pgIcons = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  
        let pgIndex = 0;
        let currentMessage = this.messageValue + `[pg]${pgIcons[pgIndex]} ${messageWait}`;
  
        const pgIntervalTimer = setInterval(() => {
          // Update progress message here
          currentMessage = this.messageValue + `[pg]${pgIcons[pgIndex]} ${messageWait}`;
          pgIndex = (pgIndex + 1) % pgIcons.length;
  
          this.message(currentMessage)
            .send()
            .catch((err) => {
              clearInterval(pgIntervalTimer);
              reject(err);
            });
        }, 1000);
        
        setTimeout(() => {
          clearInterval(pgIntervalTimer);
          this.message(this.messageValue);
          resolve();
        }, ms);
      });
    }
}