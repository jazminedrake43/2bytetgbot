#!/usr/bin/env node

const { Command } = require('commander');
const { CreateBotCommand } = require('../dist/cli/CreateBotCommand');
const { InitCommand } = require('../dist/cli/InitCommand');
const { GenerateCommand } = require('../dist/cli/GenerateCommand');
const chalk = require('chalk');

const program = new Command();

program
  .name('2byte')
  .description('CLI for 2byte Telegram Bot Framework')
  .version('1.0.0');

// Create Bot command
program
  .command('create-bot <name>')
  .description('Create a new telegram bot with sections-based architecture')
  .option('-p, --path [path]', 'Target directory path', process.cwd())
  .option('--no-database', 'Skip database setup')
  .action(async (name, options) => {
    try {
      const command = new CreateBotCommand();
      await command.execute(name, options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize 2byte bot in current directory')
  .option('-f, --force', 'Override existing files')
  .action(async (options) => {
    try {
      const command = new InitCommand();
      await command.execute(options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate commands
const generate = program
  .command('generate')
  .alias('g')
  .description('Generate various bot components');

generate
  .command('section <name>')
  .description('Generate a new section')
  .action(async (name) => {
    try {
      const command = new GenerateCommand();
      await command.generateSection(name);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

generate
  .command('migration <name>')
  .description('Generate a new migration')
  .action(async (name) => {
    try {
      const command = new GenerateCommand();
      await command.generateMigration(name);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}