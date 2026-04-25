import { BaseMessageHandler } from "@2byte/tgbot-framework";
import { Telegraf2byteContext } from "@2byte/tgbot-framework";

export class MainMessageHandler extends BaseMessageHandler {
  // You can override the handle method to implement your main message handling logic
  async handle(ctx: Telegraf2byteContext): Promise<void> {
    // For example, you can check if the user is in a section and delegate the message to that section's handler
    // Or you can implement any global message handling logic here
  }
}