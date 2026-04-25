import { App } from "@2byte/tgbot-framework";
import { Telegraf2byteContext } from "@2byte/tgbot-framework";

export class BaseMessageHandler {

  constructor(protected app: App) {}

  async handle(ctx: Telegraf2byteContext): Promise<void> {
    // This is where you can implement any global message handling logic if needed
    // For example, you can check if the user is in a section and delegate the message to that section's handler
  }

  public setApp(app: App): this {
    this.app = app;
    return this;
  }
}