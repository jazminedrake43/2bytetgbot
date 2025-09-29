"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateCommand = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class GenerateCommand {
    async generateSection(name) {
        console.log(chalk_1.default.blue(`🎯 Generating section: ${name}`));
        const currentDir = process.cwd();
        const sectionsDir = path.join(currentDir, 'sections');
        const sectionName = this.formatSectionName(name);
        const sectionPath = path.join(sectionsDir, `${sectionName}Section.ts`);
        // Ensure sections directory exists
        await fs.ensureDir(sectionsDir);
        // Check if section already exists
        if (await fs.pathExists(sectionPath)) {
            console.log(chalk_1.default.red(`❌ Section ${sectionName} already exists at ${sectionPath}`));
            return;
        }
        // Generate section content
        const template = this.getSectionTemplate(sectionName);
        await fs.writeFile(sectionPath, template);
        console.log(chalk_1.default.green(`✅ Created section ${sectionName} at ${sectionPath}`));
    }
    async generateMigration(name) {
        console.log(chalk_1.default.blue(`🗃️  Generating migration: ${name}`));
        const currentDir = process.cwd();
        const migrationsDir = path.join(currentDir, 'database', 'migrations');
        // Ensure migrations directory exists
        await fs.ensureDir(migrationsDir);
        // Get next migration ID
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter(file => file.endsWith('.sql'))
            .map(file => parseInt(file.split('_')[0]))
            .filter(id => !isNaN(id));
        const nextId = (Math.max(0, ...migrationFiles) + 1).toString().padStart(3, '0');
        const fileName = `${nextId}_${name}.sql`;
        const filePath = path.join(migrationsDir, fileName);
        const template = this.getMigrationTemplate(name);
        await fs.writeFile(filePath, template);
        console.log(chalk_1.default.green(`✅ Created migration: ${fileName}`));
    }
    formatSectionName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    getSectionTemplate(name) {
        return `import { Section } from "2bytetgbot";
import { SectionOptions } from "2bytetgbot";
import { InlineKeyboard } from "2bytetgbot";

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
    getMigrationTemplate(name) {
        return `-- UP
CREATE TABLE IF NOT EXISTS ${name} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS ${name};
`;
    }
}
exports.GenerateCommand = GenerateCommand;
