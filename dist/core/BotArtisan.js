"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotArtisan = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Artisan_1 = require("../illumination/Artisan");
class BotArtisan {
    constructor(botPath, options) {
        this.options = options;
        this.artisan = new Artisan_1.Artisan(botPath);
    }
    async run() {
        const command = process.argv[2];
        const args = process.argv.slice(3);
        if (!command) {
            this.showHelp();
            return;
        }
        try {
            switch (command) {
                case 'make:section':
                    if (args.length === 0) {
                        console.error(chalk_1.default.red('❌ Error: Section name is required'));
                        console.log('Usage: artisan make:section SectionName');
                        return;
                    }
                    await this.artisan.createSection(args[0]);
                    break;
                case 'add:method':
                    if (args.length < 2) {
                        console.error(chalk_1.default.red('❌ Error: Section name and method name are required'));
                        console.log('Usage: artisan add:method SectionName methodName');
                        return;
                    }
                    await this.artisan.addMethod(args[0], args[1]);
                    break;
                case 'list:sections':
                    await this.artisan.listSections();
                    break;
                default:
                    console.error(chalk_1.default.red(`❌ Unknown command: ${command}`));
                    this.showHelp();
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(chalk_1.default.red(`❌ Error: ${error.message}`));
            }
            else {
                console.error(chalk_1.default.red('❌ An unknown error occurred'));
            }
        }
    }
    showHelp() {
        console.log(`
🔧 ${this.options.botName} Artisan CLI

Available commands:
  make:section <name>           Create a new section
  add:method <section> <name>   Add a new method to existing section
  list:sections                 List all sections

Examples:
  artisan make:section Auth     Create new AuthSection
  artisan add:method Auth login Add login method to AuthSection
  artisan list:sections        Show all available sections
`);
    }
}
exports.BotArtisan = BotArtisan;
