import { Section, SectionOptions, InlineKeyboard } from "@2byte/tgbot-framework";

export default class HomeSection extends Section {
  static command = "home";
  static description = "{{className}} Bot Home section";
  static actionRoutes = {
    "home.index": "index",
    "home.help": "help",
  };
  
  public sectionId = "home";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard([
      [this.makeInlineButton("ℹ️ Помощь", "home.help")],
    ]);
  }

  public async up(): Promise<void> {}
  public async down(): Promise<void> {}
  public async setup(): Promise<void> {}
  public async unsetup(): Promise<void> {}

  async index() {
    const message = `
🏠 **{{className}} Bot**

Добро пожаловать в {{className}} бот!
Это стартовая секция, созданная с помощью 2byte framework.

Выберите действие:
    `;

    await this.message(message)
      .inlineKeyboard(this.mainInlineKeyboard)
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

    await this.message(message)
      .inlineKeyboard([
        [this.makeInlineButton("🏠 На главную", "home.index")],
      ])
      .send();
  }
}