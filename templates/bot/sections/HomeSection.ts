import { Section, InlineKeyboard } from "@2byte/tgbot-framework";
import type { SectionOptions } from "@2byte/tgbot-framework";

export default class HomeSection extends Section {
  static override command = "start";
  static override description = "Example Bot Home section";
  static override actionRoutes = {
    "home.index": "index",
    "home.help": "help",
  };

  public override sectionId = "home";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard().addFootFixedButtons(this.btnHome);
  }

  public override async up(): Promise<void> {}
  public override async down(): Promise<void> {}
  public override async setup(): Promise<void> {}
  public override async unsetup(): Promise<void> {}

  async index() {
    const message = `
🏠 **Example Bot**

Добро пожаловать в Example бот!
Это стартовая секция, созданная с помощью 2byte framework.

Выберите действие:
    `;

    await this.message(message)
      .markdown()
      .inlineKeyboard(
        this.mainInlineKeyboard
          .append(this.makeInlineButton("ℹ️ Помощь", "home.help"))
          .append(this.makeInlineButton("➕ Example Input", "exampleInput.index"))
          .append(this.makeInlineButton("🚀 Example Live Tasker", "exampleLiveTasker.index"))
      )
      .send();
  }

  async help() {
    const message = `
ℹ️ **Помощь**

Это бот, созданный с помощью 2byte Telegram Bot Framework.

Доступные команды:
• /start - Главное меню

Для разработчиков:
• bun run artisan make:section <name> - Создать секцию
• bun run migrate - Выполнить миграции
• bun run seed - Заполнить данными
    `;

    await this.message(message).inlineKeyboard(this.mainInlineKeyboard).markdown().send();
  }
}