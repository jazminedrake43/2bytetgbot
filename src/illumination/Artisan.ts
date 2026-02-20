import fs from 'fs';
import path from 'path';
import type { Database } from 'bun:sqlite';

export type ArtisanOptions = {
  db?: Database;
};

export class Artisan {
  private basePath: string;
  private options: ArtisanOptions = {};

  constructor(basePath: string, options: ArtisanOptions) {
    this.basePath = basePath;
    this.options = options;
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
    console.log('To enable the section, add key  it to the sections array in ' + process.cwd() + '/sectionList.ts');
  }

  /**
   * Форматирует имя секции (первая буква заглавная, остальные строчные)
   */
  private formatSectionName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Возвращает шаблон для новой секции
   */
  private getSectionTemplate(name: string): string {
    const filePath = path.join(__dirname, '../../templates', 'TemplateSection.ts');
    let template = fs.readFileSync(filePath, 'utf-8');
    const nameCamelCase = name.charAt(0).toLowerCase() + name.slice(1);

    template = template.replace(/\$\{name\}/g, nameCamelCase);
    template = template.replace(/\$\{commandName\}/g, name.toLowerCase());
    template = template.replace(/TemplateSection/g, `${name}Section`);
    return template;
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
