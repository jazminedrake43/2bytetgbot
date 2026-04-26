import { Section } from "@2byte/tgbot-framework";
import type { SectionOptions } from "@2byte/tgbot-framework";
import { InlineKeyboard, Message2Byte } from "@2byte/tgbot-framework";

export default class ExampleLiveTaskerSection extends Section {
  static command = "examplelivetasker";
  static description = "ExampleLiveTasker section";
  static actionRoutes = {
    "exampleLiveTasker.index": "index",
    "exampleLiveTasker.runTasker": "runTasker",
    "exampleLiveTasker.runTaskerMatrix": "runTaskerMatrix",
    "exampleLiveTasker.runTaskerNeo": "runTaskerNeo",
    "exampleLiveTasker.runTaskerClean": "runTaskerClean",
    "exampleLiveTasker.runTaskerWithoutSection": "runTaskerWithoutSection",
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
        this.makeInlineButton('➕ Example Live Tasker', 'exampleLiveTasker.runTasker'),
        this.makeInlineButton('🟢 Matrix Live Tasker', 'exampleLiveTasker.runTaskerMatrix'),
        this.makeInlineButton('⬡ Neo Live Tasker', 'exampleLiveTasker.runTaskerNeo'),
        this.makeInlineButton('🌟 Clean Live Tasker', 'exampleLiveTasker.runTaskerClean'),
        this.makeInlineButton('➕ Example Live Tasker without section', 'exampleLiveTasker.runTaskerWithoutSection'),
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

  async runTaskerMatrix() {
    const msgPool = this.createUpdatePoolMessage("Booting matrix tasker...");

    await msgPool.send();

    const msgProgressive = msgPool.liveProgressive().matrixStyle();

    await msgProgressive.setBaseMessage("Deep search across indexed shards").send();

    for (let i = 1; i <= 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await msgProgressive
        .appendItem(i, `Shard ${i} query queued`)
        .setItemCaption(i, `channel-${i.toString().padStart(2, '0')} awaiting signal`)
        .send();
      await msgProgressive.sleepProgressBar(1500).send();
      await msgProgressive
        .changeItem(i, `Shard ${i} query resolved`)
        .changeItemCaption(i, `matched ${(i * 13).toString().padStart(3, '0')} records in cache window`)
        .send();
      await msgProgressive.setItemStatusCompleted(i).send();
    }

    await msgProgressive.stopSleepProgress();
    await msgPool.append("\n\n[SYSTEM] Search stream completed.").send();
  }

  async runTaskerNeo() {
    const msgPool = this.createUpdatePoolMessage("Initializing neural scan...");

    await msgPool.send();

    const msgProgressive = msgPool.liveProgressive().neoStyle();

    await msgProgressive.setBaseMessage("Neural database scan").send();

    const tasks = [
      "Auth layer scan",
      "Index partition rebuild",
      "Cache warm-up",
      "Integrity check",
    ];

    for (let i = 1; i <= tasks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await msgProgressive
        .appendItem(i, tasks[i - 1])
        .setItemCaption(i, `node-${i.toString().padStart(2, '0')} · awaiting sync`)
        .send();
      await msgProgressive.sleepProgressBar(2000).send();
      await msgProgressive
        .changeItemCaption(i, `synced · ${(i * 17 + 44)} ms`)
        .send();
      await msgProgressive.setItemStatusCompleted(i).send();
    }

    await msgProgressive.stopSleepProgress();
    await msgPool.append("\n\n◈  All systems nominal.").send();
  }

  async runTaskerClean() {
    const msgPool = this.createUpdatePoolMessage("Working on it...");

    await msgPool.send();

    const msgProgressive = msgPool.liveProgressive().cleanStyle();

    await msgProgressive.setBaseMessage("Preparing your order").send();

    const tasks = [
      "Verify your account",
      "Check availability",
      "Reserve items",
      "Generate invoice",
      "Send confirmation",
    ];

    for (let i = 1; i <= tasks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await msgProgressive
        .appendItem(i, tasks[i - 1])
        .setItemCaption(i, "In progress...")
        .send();
      await msgProgressive.sleepProgressBar(1800).send();
      await msgProgressive
        .changeItemCaption(i, "Done!")
        .send();
      await msgProgressive.setItemStatusCompleted(i).send();
    }

    await msgProgressive.stopSleepProgress();
    await msgPool.append("\n\n🎉  Everything is ready!").send();
  }

  async runTaskerWithoutSection() {
    await this.ctx.answerCbQuery();
    const msgPool = Message2Byte.init(this.ctx).createUpdatePoolMessage("Starting tasker without section...");

    await msgPool.send();

    const msgProgressive = msgPool.liveProgressive();
    await msgProgressive.setBaseMessage("Tasker without section in progress:").send();

    for (let i = 1; i <= 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a task taking time
      await msgProgressive.appendItem(i, `Task ${i} running`).send();
      await msgProgressive.sleepProgressBar(2000).send();
      await msgProgressive.changeItem(i, `Task ${i} changed`).send();
      await msgProgressive.setItemStatusCompleted(i).send();
    }
  }
}