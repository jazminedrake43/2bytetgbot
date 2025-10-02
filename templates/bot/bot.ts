import { App } from '@2byte/tgbot-framework';
import { UserStore } from "@2byte/tgbot-framework";
import { sectionList } from "./sectionList";
import { Database } from 'bun:sqlite';
import { EnvVars } from "@2byte/tgbot-framework";

if (import.meta.dirname === undefined) {
  throw new Error("import.meta.dirname is not defined. Ensure you are using a module environment.");
}

// check if the environment is set up correctly
const requiredEnvVars: (keyof EnvVars)[] = [
  "BOT_TOKEN",
  "BOT_API_URL",
  "BOT_HOOK_DOMAIN",
  "BOT_HOOK_PORT",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} is not set in the environment variables.`);
  }
}

declare global {
  var userStorage: UserStore;
  var db: Database;
  var settings: Record<string, any>;
}

// Initialize global variables
global.userStorage = new UserStore(process.env as EnvVars);
global.db = new Database(import.meta.dirname +'/database/database.sqlite');
global.settings = {
  paging: {
    taskListPerPage: 3, // Number items per page
  }
};

// Autoclean storage user by timeout
userStorage.autocleanup(10);

const appController = new App.Builder()
  .envConfig(process.env as EnvVars)
  .botToken(process.env.BOT_TOKEN as string)
  .telegrafConfigLaunch({
    // webhook: {
    //   // Public domain for webhook; e.g.: example.com
    //   domain: process.env.BOT_HOOK_DOMAIN,
    //   // Port to listen on; e.g.: 8080
    //   port: +process.env.BOT_HOOK_PORT,
    //   // Path to listen on nginx
    //   path: "/super-mega-tgbot",
    //   secretToken: process.env.BOT_HOOK_SECRET_TOKEN,
    // },
  })
  .apiUrl(process.env.BOT_API_URL as string)
  .settings(settings)
  .userStorage(userStorage)
  .sections(sectionList)
  .keepSectionInstances(true)
  .debug()
  //.telegrafLog()
  .devHotReloadSections(process.env.BOT_DEV_HOT_RELOAD_SECTIONS === "true")
  .mainMenuKeyboard([
    ["🏠 Лобби"],
  ])
  .hears({
    "🏠 Лобби": "home",
  })      
  .terminateSigInt()
  .terminateSigTerm()
  .build();

(await appController.init()).launch();
