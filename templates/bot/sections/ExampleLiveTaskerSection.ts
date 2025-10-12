import { Section } from "@2byte/tgbot-framework";
import { SectionOptions } from "@2byte/tgbot-framework";
import { InlineKeyboard } from "@2byte/tgbot-framework";

export default class ExampleLiveTaskerSection extends Section {
  static command = "examplelivetasker";
  static description = "ExampleLiveTasker section";
  static actionRoutes = {
    "exampleLiveTasker.index": "index",
    "exampleLiveTasker.runTasker": "runTasker",
  };
  
  public sectionId = "ExampleLiveTasker";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard().addFootFixedButtons(this.btnHome);
  }

  public async up(): Promise<void> {}
  public async down(): Promise<void> {}
  public async setup(): Promise<void> {}
  public async unsetup(): Promise<void> {}

  async index() {
    const message = `
      👋 Welcome to ExampleLiveTasker Section
    `;

    await this.message(message)
      .inlineKeyboard(this.mainInlineKeyboard.append(
        this.makeInlineButton('➕ Example Live Tasker', 'exampleLiveTasker.runTasker')
      ))
      .send();
  }

  async runTasker() {
    const msgPool = this.createUpdatePoolMessage("Starting tasker...");

    await msgPool.send();

    const msgProgressive = msgPool.liveProgressive();

    await msgProgressive.setBaseMessage("Tasker in progress:").send();

    for (let i = 1; i <= 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a task taking time
      await msgProgressive.appendItem(i, `Task ${i} running`).send();
      await msgProgressive.sleepProgressBar(2000).send();
      await msgProgressive.changeItem(i, `Task ${i} changed`).send();
      await msgProgressive.setItemStatusCompleted(i).send();
    }

    await msgProgressive.stopSleepProgress();
    const res = await msgPool.append("\n\nAll tasks completed!").send();
    console.log("Final message sent:", res);
  }
}
