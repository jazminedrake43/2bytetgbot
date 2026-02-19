import { Section } from "@2byte/tgbot-framework";
import { SectionOptions } from "@2byte/tgbot-framework";
import { InlineKeyboard } from "@2byte/tgbot-framework";

export default class TemplateSection extends Section {
  static override command = "${commandName}";
  static override description = "${name} section";
  static override actionRoutes = {
    "${name}.index": "index",
  };
  
  public override sectionId = "${name}";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard().addFootFixedButtons(
      this.makeInlineButton("🏠 На главную", "home.index")
    );
  }

  public override async up(): Promise<void> {}
  public override async down(): Promise<void> {}
  public override async setup(): Promise<void> {}
  public override async unsetup(): Promise<void> {}

  async index() {
    const message = `
      👋 Welcome to ${this.ctx.user.attributes.tg_username} Section
    `;

    await this.message(message)
      .inlineKeyboard(this.mainInlineKeyboard)
      .send();
  }
}