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
exports.CreateBotCommand = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const mustache_1 = __importDefault(require("mustache"));
class CreateBotCommand {
    constructor() {
        this.templatesPath = path.join(__dirname, '../../templates');
    }
    async execute(botName, options) {
        console.log(chalk_1.default.blue(`🚀 Creating new bot: ${botName}`));
        const targetPath = path.join(options.path, botName);
        // Check if directory already exists
        if (await fs.pathExists(targetPath)) {
            const { overwrite } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `Directory ${botName} already exists. Overwrite?`,
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log(chalk_1.default.yellow('⚠️  Operation cancelled'));
                return;
            }
            await fs.remove(targetPath);
        }
        // Create directory
        await fs.ensureDir(targetPath);
        // Get bot configuration
        const config = await this.getBotConfig(botName, options);
        // Copy templates
        await this.copyTemplates(targetPath, config);
        // Install dependencies if requested
        if (config.installDeps) {
            await this.installDependencies(targetPath);
        }
        console.log(chalk_1.default.green(`✅ Bot ${botName} created successfully!`));
        console.log(chalk_1.default.blue('📋 Next steps:'));
        console.log(`   cd ${botName}`);
        console.log(`   ${config.installDeps ? '' : 'bun install'}${config.installDeps ? '' : ' # Install dependencies'}`);
        console.log('   bun run migrate        # Run migrations');
        console.log('   bun run seed           # Seed database');
        console.log('   bun run dev            # Start bot');
    }
    async getBotConfig(botName, options) {
        const questions = [
            {
                type: 'input',
                name: 'description',
                message: 'Bot description:',
                default: `A telegram bot created with 2byte framework`,
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author:',
                default: '',
            },
            {
                type: 'confirm',
                name: 'useDatabase',
                message: 'Include database setup?',
                default: !options.noDatabase,
            },
            {
                type: 'confirm',
                name: 'installDeps',
                message: 'Install dependencies now?',
                default: true,
            },
        ];
        const answers = await inquirer_1.default.prompt(questions);
        return {
            botName,
            ...answers,
            className: this.toPascalCase(botName),
            kebabName: this.toKebabCase(botName),
        };
    }
    async copyTemplates(targetPath, config) {
        const templatePath = path.join(this.templatesPath, 'bot');
        // Copy all files from template
        await this.copyTemplateFiles(templatePath, targetPath, config);
    }
    async copyTemplateFiles(sourcePath, targetPath, config) {
        const items = await fs.readdir(sourcePath);
        for (const item of items) {
            const sourceItemPath = path.join(sourcePath, item);
            const targetItemPath = path.join(targetPath, item);
            const stat = await fs.stat(sourceItemPath);
            if (stat.isDirectory()) {
                await fs.ensureDir(targetItemPath);
                await this.copyTemplateFiles(sourceItemPath, targetItemPath, config);
            }
            else {
                // Read file content
                let content = await fs.readFile(sourceItemPath, 'utf-8');
                // Process template
                content = mustache_1.default.render(content, config);
                // Write processed content
                await fs.writeFile(targetItemPath, content);
            }
        }
    }
    async installDependencies(targetPath) {
        console.log(chalk_1.default.blue('📦 Installing dependencies...'));
        const { spawn } = require('child_process');
        return new Promise((resolve, reject) => {
            const install = spawn('bun', ['install'], {
                cwd: targetPath,
                stdio: 'inherit'
            });
            install.on('close', (code) => {
                if (code === 0) {
                    resolve(void 0);
                }
                else {
                    reject(new Error(`Installation failed with code ${code}`));
                }
            });
        });
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
exports.CreateBotCommand = CreateBotCommand;
