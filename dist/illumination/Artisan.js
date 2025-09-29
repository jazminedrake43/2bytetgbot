"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artisan = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Artisan {
    constructor(basePath) {
        this.basePath = basePath;
    }
    /**
     * Создает новую секцию
     * @param name Имя секции (например: Home, Auth, Settings)
     */
    async createSection(name) {
        const sectionName = this.formatSectionName(name);
        const sectionsDir = path_1.default.join(this.basePath, 'sections');
        // Создаем директорию sections если её нет
        if (!fs_1.default.existsSync(sectionsDir)) {
            fs_1.default.mkdirSync(sectionsDir, { recursive: true });
        }
        const sectionPath = path_1.default.join(sectionsDir, `${sectionName}Section.ts`);
        // Проверяем, не существует ли уже такая секция
        if (fs_1.default.existsSync(sectionPath)) {
            throw new Error(`Section ${sectionName} already exists at ${sectionPath}`);
        }
        const template = this.getSectionTemplate(sectionName);
        // Создаем файл секции
        fs_1.default.writeFileSync(sectionPath, template);
        console.log(`✅ Created section ${sectionName} at ${sectionPath}`);
    }
    /**
     * Форматирует имя секции (первая буква заглавная, остальные строчные)
     */
    formatSectionName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    /**
     * Возвращает шаблон для новой секции
     */
    getSectionTemplate(name) {
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
    async addMethod(sectionName, methodName) {
        const formattedSectionName = this.formatSectionName(sectionName);
        const sectionPath = path_1.default.join(this.basePath, 'sections', `${formattedSectionName}Section.ts`);
        if (!fs_1.default.existsSync(sectionPath)) {
            throw new Error(`Section ${formattedSectionName} does not exist at ${sectionPath}`);
        }
        let content = fs_1.default.readFileSync(sectionPath, 'utf-8');
        // Добавляем новый route в actionRoutes
        const routeEntry = `"${sectionName.toLowerCase()}.${methodName}": "${methodName}",`;
        content = content.replace(/static actionRoutes = {([^}]*)}/, (match, routes) => `static actionRoutes = {${routes}    ${routeEntry}\n  }`);
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
        fs_1.default.writeFileSync(sectionPath, content);
        console.log(`✅ Added method ${methodName} to section ${formattedSectionName}`);
    }
    /**
     * Выводит список всех секций
     */
    async listSections() {
        const sectionsDir = path_1.default.join(this.basePath, 'sections');
        if (!fs_1.default.existsSync(sectionsDir)) {
            console.log('No sections found');
            return;
        }
        const sections = fs_1.default.readdirSync(sectionsDir)
            .filter(file => file.endsWith('Section.ts'))
            .map(file => file.replace('Section.ts', ''));
        console.log('\n📁 Available sections:');
        sections.forEach(section => {
            console.log(`  - ${section}`);
        });
    }
}
exports.Artisan = Artisan;
