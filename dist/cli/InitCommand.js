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
exports.InitCommand = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class InitCommand {
    async execute(options) {
        const currentDir = process.cwd();
        const packageJsonPath = path.join(currentDir, 'package.json');
        console.log(chalk_1.default.blue('🔧 Initializing 2byte bot in current directory...'));
        // Check if already a 2byte bot
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            if (packageJson.dependencies && packageJson.dependencies['2bytetgbot']) {
                if (!options.force) {
                    console.log(chalk_1.default.yellow('⚠️  This directory already contains a 2byte bot.'));
                    console.log(chalk_1.default.yellow('   Use --force to override existing files.'));
                    return;
                }
            }
        }
        // Create basic bot structure
        await this.createBotStructure(currentDir, options);
        console.log(chalk_1.default.green('✅ 2byte bot initialized successfully!'));
        console.log(chalk_1.default.blue('📋 Next steps:'));
        console.log('   bun install           # Install dependencies');
        console.log('   bun run migrate        # Run migrations');
        console.log('   bun run seed           # Seed database');
        console.log('   bun run dev            # Start bot');
    }
    async createBotStructure(targetPath, options) {
        const templatesPath = path.join(__dirname, '../../templates/bot');
        // Copy essential files
        const essentialFiles = [
            'package.json',
            'artisan.ts',
            'bot.ts',
            'sections.ts',
            '.env.example',
            'database/migrate.ts',
            'database/seed.ts',
        ];
        for (const file of essentialFiles) {
            const sourcePath = path.join(templatesPath, file);
            const targetFilePath = path.join(targetPath, file);
            if (await fs.pathExists(sourcePath)) {
                if (!options.force && await fs.pathExists(targetFilePath)) {
                    console.log(chalk_1.default.yellow(`⚠️  Skipping ${file} (already exists)`));
                    continue;
                }
                await fs.ensureDir(path.dirname(targetFilePath));
                // Read and process template
                let content = await fs.readFile(sourcePath, 'utf-8');
                // For now, use current directory name as bot name
                const botName = path.basename(targetPath);
                const config = {
                    botName,
                    className: this.toPascalCase(botName),
                    kebabName: this.toKebabCase(botName),
                    description: `A telegram bot created with 2byte framework`,
                    author: '',
                    useDatabase: true,
                };
                // Simple template replacement
                content = this.processTemplate(content, config);
                await fs.writeFile(targetFilePath, content);
                console.log(chalk_1.default.green(`✅ Created ${file}`));
            }
        }
    }
    processTemplate(content, config) {
        // Simple mustache-style replacement
        return content
            .replace(/\{\{botName\}\}/g, config.botName)
            .replace(/\{\{className\}\}/g, config.className)
            .replace(/\{\{kebabName\}\}/g, config.kebabName)
            .replace(/\{\{description\}\}/g, config.description)
            .replace(/\{\{author\}\}/g, config.author);
    }
    toPascalCase(str) {
        return str
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
}
exports.InitCommand = InitCommand;
