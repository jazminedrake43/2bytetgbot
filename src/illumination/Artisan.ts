import fs from 'fs';
import path from 'path';

export class Artisan {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Создает новую секцию
   * @param name Имя секции (например: Home, Auth, Settings)
   */
  async createSection(name: string): Promise<void> {
    const sectionName = this.formatSectionName(name);
    const sectionsDir = path.join(this.basePath, 'sections');
    
    // Создаем директорию sections если её нет
    if (!fs.existsSync(sectionsDir)) {
      fs.mkdirSync(sectionsDir, { recursive: true });
    }

    const sectionPath = path.join(sectionsDir, `${sectionName}Section.ts`);
    
    // Проверяем, не существует ли уже такая секция
    if (fs.existsSync(sectionPath)) {
      throw new Error(`Section ${sectionName} already exists at ${sectionPath}`);
    }

    const template = this.getSectionTemplate(sectionName);
    
    // Создаем файл секции
    fs.writeFileSync(sectionPath, template);
    console.log(`✅ Created section ${sectionName} at ${sectionPath}`);
  }

  /**
   * Форматирует имя секции (первая буква заглавная, остальные строчные)
   */
  private formatSectionName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  /**
   * Возвращает шаблон для новой секции
   */
  private getSectionTemplate(name: string): string {
    return `import { Section } from "../../src/illumination/Section";
import { SectionOptions } from "../../src/types";
import { InlineKeyboard } from "../../src/illumination/InlineKeyboard";

export default class ${name}Section extends Section {
  static command = "${name.toLowerCase()}";
  static description = "${name} section";
  static actionRoutes = {
    "${name.toLowerCase()}.index": "index",
  };
  
  public sectionId = "${name.toLowerCase()}";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard([
      [this.makeInlineButton("🏠 На главную", "home.index")],
    ]);
  }

  public async up(): Promise<void> {}
  public async down(): Promise<void> {}
  public async setup(): Promise<void> {}
  public async unsetup(): Promise<void> {}

  async index() {
    const message = \`
      👋 Welcome to ${name} Section
    \`;

    await this.message(message)
      .inlineKeyboard(this.mainInlineKeyboard)
      .send();
  }
}
`;
  }

  /**
   * Добавляет новый метод в существующую секцию
   */
  async addMethod(sectionName: string, methodName: string): Promise<void> {
    const formattedSectionName = this.formatSectionName(sectionName);
    const sectionPath = path.join(this.basePath, 'sections', `${formattedSectionName}Section.ts`);

    if (!fs.existsSync(sectionPath)) {
      throw new Error(`Section ${formattedSectionName} does not exist at ${sectionPath}`);
    }

    let content = fs.readFileSync(sectionPath, 'utf-8');

    // Добавляем новый route в actionRoutes
    const routeEntry = `"${sectionName.toLowerCase()}.${methodName}": "${methodName}",`;
    content = content.replace(
      /static actionRoutes = {([^}]*)}/,
      (match, routes) => `static actionRoutes = {${routes}    ${routeEntry}\n  }`
    );

    // Добавляем новый метод
    const methodTemplate = `
  async ${methodName}() {
    const message = \`
      // Добавьте ваше сообщение здесь
    \`;

    await this.message(message)
      .inlineKeyboard(this.mainInlineKeyboard)
      .send();
  }
`;

    // Вставляем метод перед последней закрывающей скобкой
    content = content.replace(/}$/, `${methodTemplate}}`);

    fs.writeFileSync(sectionPath, content);
    console.log(`✅ Added method ${methodName} to section ${formattedSectionName}`);
  }

  /**
   * Выводит список всех секций
   */
  async listSections(): Promise<void> {
    const sectionsDir = path.join(this.basePath, 'sections');
    
    if (!fs.existsSync(sectionsDir)) {
      console.log('No sections found');
      return;
    }

    const sections = fs.readdirSync(sectionsDir)
      .filter(file => file.endsWith('Section.ts'))
      .map(file => file.replace('Section.ts', ''));

    console.log('\n📁 Available sections:');
    sections.forEach(section => {
      console.log(`  - ${section}`);
    });
  }
}
