import { Telegraf, Markup } from "telegraf";
import path from "node:path";
import { access } from "fs/promises";
import {
  Telegraf2byteContext,
  Telegraf2byteContextExtraMethods,
} from "../illumination/Telegraf2byteContext";
import { Section } from "../illumination/Section";
import { RunSectionRoute } from "../illumination/RunSectionRoute";
import { UserModel } from "../user/UserModel";
import { UserStore } from "../user/UserStore";
import {
  AppConfig,
  EnvVars,
  RunnedSection,
  SectionEntityConfig,
  SectionList,
  SectionOptions,
  UserRegistrationData,
} from "../types";
import { nameToCapitalize } from "./utils";
import { ApiServiceManager } from "./ApiServiceManager";

export class App {
  private config: AppConfig = {
    accessPublic: true,
    apiUrl: null,
    envConfig: {},
    botToken: null,
    telegrafConfigLaunch: null,
    settings: null,
    userStorage: null,
    builderPromises: [],
    sections: {},
    components: {},
    debug: false,
    devHotReloadSections: false,
    telegrafLog: false,
    mainMenuKeyboard: [],
    hears: {},
    terminateSigInt: true,
    terminateSigTerm: true,
    keepSectionInstances: false,
    botCwd: process.cwd(),
  };

  public bot!: Telegraf<Telegraf2byteContext>;
  private sectionClasses: Map<string, typeof Section> = new Map();
  private runnedSections: WeakMap<UserModel, RunnedSection[]> =
    new WeakMap();
  private middlewares: CallableFunction[] = [];
  private apiServiceManager!: ApiServiceManager;

  // Система управления фоновыми задачами
  private runningTasks: Map<
    string,
    {
      task: Promise<any>;
      cancel?: () => void;
      status: "running" | "completed" | "failed" | "cancelled";
      startTime: number;
      endTime?: number;
      error?: Error;
      ctx: Telegraf2byteContext;
      controller?: {
        signal: AbortSignal;
        sendMessage: (message: string) => Promise<void>;
        onMessage: (handler: (message: string, source: "task" | "external") => void) => void;
        receiveMessage: (message: string) => Promise<void>;
      };
      messageQueue?: Array<{ message: string; source: "task" | "external" }>;
    }
  > = new Map();

  constructor() {
    this.middlewares.push(this.mainMiddleware.bind(this));
  }

  static Builder = class {
    public app: App;

    constructor() {
      this.app = new App();
    }

    accessPublic(isPublic: boolean = true): this {
      this.app.config.accessPublic = isPublic;
      return this;
    }

    accessPrivate(isPrivate: boolean = true): this {
      this.app.config.accessPublic = !isPrivate;
      return this;
    }

    apiUrl(url: string): this {
      this.app.config.apiUrl = url;
      return this;
    }

    botToken(token: string): this {
      this.app.config.botToken = token;
      return this;
    }

    telegrafConfigLaunch(config: Record<string, any>): this {
      this.app.config.telegrafConfigLaunch = config;
      return this;
    }

    settings(settings: Record<string, any>): this {
      this.app.config.settings = settings;
      return this;
    }

    userStorage(storage: UserStore): this {
      this.app.config.userStorage = storage;
      return this;
    }

    debug(isDebug: boolean = true): this {
      this.app.config.debug = isDebug;
      return this;
    }

    devHotReloadSections(isReload: boolean = true): this {
      this.app.config.devHotReloadSections = isReload;
      return this;
    }

    telegrafLog(isLog: boolean = true): this {
      this.app.config.telegrafLog = isLog;
      return this;
    }

    mainMenuKeyboard(keyboard: any[][]): this {
      this.app.config.mainMenuKeyboard = keyboard;
      return this;
    }

    hears(hearsMap: Record<string, string>): this {
      this.app.config.hears = hearsMap;
      return this;
    }

    terminateSigInt(isTerminate: boolean = true): this {
      this.app.config.terminateSigInt = isTerminate;
      return this;
    }

    terminateSigTerm(isTerminate: boolean = true): this {
      this.app.config.terminateSigTerm = isTerminate;
      return this;
    }

    sections(sectionsList: SectionList): this {
      this.app.config.sections = sectionsList;
      return this;
    }

    /**
     *
     * @param keep Whether to keep section instances in memory after they are run.
     * If true, sections will not be reloaded on each request, improving performance for frequently accessed sections.
     * If false, sections will be reloaded each time they are accessed, ensuring the latest version is used.
     * Default is true.
     * @returns
     */
    keepSectionInstances(keep: boolean = true): this {
      this.app.config.keepSectionInstances = keep;
      return this;
    }

    envConfig(config: EnvVars): this {
      this.app.config.envConfig = config;
      return this;
    }

    botCwd(cwdPath: string): this {
      this.app.config.botCwd = cwdPath;
      return this;
    }

    build(): App {
      return this.app;
    }
  };

  async init(): Promise<this> {
    if (!this.config.botToken) {
      throw new Error("Bot token is not set");
    }

    this.bot = new Telegraf<Telegraf2byteContext>(this.config.botToken);

    if (this.config.telegrafLog) {
      this.bot.use(Telegraf.log());
    }

    this.debugLog("AppConfig", this.config);

    await this.registerSections();

    this.middlewares.forEach((middleware: CallableFunction) => {
      middleware();
    });

    this.registerActionForCallbackQuery();
    this.registerHears();
    this.registerCommands();
    this.registerMessageHandlers();
    await this.registerServices();

    return this;
  }

  async launch(): Promise<this> {
    if (!this.bot) {
      throw new Error("Bot is not initialized");
    }

    this.bot.catch((err) => {
      this.debugLog("Error in bot:", err);
      if (this.config.debug && err instanceof Error) {
        this.debugLog("Stack trace:", err.stack);
      }
    });

    await this.bot.launch(this.config.telegrafConfigLaunch || {});

    if (this.config.terminateSigInt) {
      process.once("SIGINT", () => {
        this.bot?.stop("SIGINT");
      });
    }

    if (this.config.terminateSigTerm) {
      process.once("SIGTERM", () => {
        this.bot?.stop("SIGTERM");
      });
    }

    return this;
  }

  async mainMiddleware() {
    this.bot.use(async (ctx: Telegraf2byteContext, next: () => Promise<void>) => {
      const tgUsername = this.getTgUsername(ctx);

      if (!tgUsername) {
        return ctx.reply("Username is not set");
      }

      if (!this.config.userStorage) {
        throw new Error("User storage is not set");
      }

      let startPayload: string | null = null;
      let accessKey: string | null = null;

      if (ctx?.message?.text?.startsWith("/start")) {
        startPayload = ctx?.message?.text?.split(" ")[1] || null;
        accessKey =
          startPayload && startPayload.includes("key=")
            ? startPayload.split("key=")[1] || null
            : null;
      }

      // Check access by username and register user if not exists
      if (!this.config.userStorage.exists(tgUsername)) {
        const isAuthByUsername = !this.config.accessPublic && !accessKey;

        // check access by username for private bots
        if (isAuthByUsername) {
          const requestUsername = this.getTgUsername(ctx);
          this.debugLog("Private access mode. Checking username:", requestUsername);
          const checkAccess =
            this.config.envConfig.ACCESS_USERNAMES &&
            this.config.envConfig.ACCESS_USERNAMES.split(",").map((name) => name.trim());
          if (
            checkAccess &&
            checkAccess.every((name) => name.toLowerCase() !== requestUsername.toLowerCase())
          ) {
            return ctx.reply("Access denied. Your username is not in the access list.");
          }
          this.debugLog("Username access granted.");
        }

        // check access keys for private bots
        if (!isAuthByUsername && accessKey) {
          this.debugLog("Private access mode. Checking access key in start payload.");
          const accessKeys =
            this.config.envConfig.BOT_ACCESS_KEYS &&
            this.config.envConfig.BOT_ACCESS_KEYS.split(",").map((key) => key.trim());
          if (
            accessKeys &&
            accessKeys.every((key) => key.toLowerCase() !== accessKey?.toLowerCase())
          ) {
            return ctx.reply("Access denied. Your access key is not valid.");
          }
          this.debugLog("Access key granted.");
        }

        if (!ctx.from) {
          return ctx.reply("User information is not available");
        }

        const userRefIdFromStart = startPayload ? parseInt(startPayload) : 0;

        await this.registerUser({
          user_refid: userRefIdFromStart,
          tg_id: ctx.from.id,
          tg_username: tgUsername,
          tg_first_name: ctx.from.first_name || tgUsername,
          tg_last_name: ctx.from.last_name || "",
          role: "user",
          language: ctx.from.language_code || "en",
        });
      }

      ctx.user = this.config.userStorage.find(tgUsername);
      ctx.userStorage = this.config.userStorage;
      ctx.userSession = this.config.userStorage.findSession(ctx.user);
      Object.assign(ctx, Telegraf2byteContextExtraMethods);

      this.config.userStorage.upActive(tgUsername);

      if (ctx.msgId) {
        this.config.userStorage.storeMessageId(tgUsername, ctx.msgId, 10);
      }

      return next();
    });
  }

  async registerActionForCallbackQuery() {
    // Register actions
    this.bot.action(/(.+)/, async (ctx: Telegraf2byteContext) => {
      let actionPath = (ctx as any).match?.[1];
      const actionParamsString = actionPath.match(/\[(.+)\]/);
      let actionParams: URLSearchParams = new URLSearchParams();

      if (actionParamsString && actionParamsString[1]) {
        actionParams = new URLSearchParams(actionParamsString[1]);

        actionPath = actionPath.split("[")[0];
      }

      this.debugLog(
        `Run action ${actionPath} with params ${actionParams.toString()} for user ${
          ctx.user.username
        }`
      );

      if (!actionPath) return;

      // Assuming SectionData is a class to parse actionPath, but it's missing, so we will parse manually here
      const actionPathParts = actionPath.split(".");

      if (actionPathParts.length >= 2) {
        const sectionId = actionPathParts[0];

        let sectionClass = this.sectionClasses.get(sectionId);

        if (!sectionClass) {
          throw new Error(`Section class not found for sectionId ${sectionId}`);
        }

        const method = sectionClass.actionRoutes[actionPath];

        if (!method) {
          throw new Error(
            `Action ${actionPath} method ${method} not found in section ${sectionId}`
          );
        }

        const sectionRoute = new RunSectionRoute()
          .section(sectionId)
          .method(method)
          .actionPath(actionPath);

        this.runSection(ctx, sectionRoute).catch((err) => {
          this.debugLog("Error running section:", err);
        });
      }
    });
  }

  registerHears() {
    // Register hears
    Object.entries(this.config.hears).forEach(([key, sectionMethod]) => {
      this.bot.hears(key, async (ctx: Telegraf2byteContext) => {
        const [sectionId, method] = sectionMethod.split(".");
        const sectionRoute = new RunSectionRoute().section(sectionId).method(method).hearsKey(key);

        this.debugLog(`Hears matched: ${key}, running section ${sectionId}, method ${method}`);

        this.runSection(ctx, sectionRoute).catch((err) => {
          this.debugLog("Error running section:", err);
        });
      });
    });
  }

  registerMessageHandlers() {
    // Register message handler for text messages
    this.bot.on("text", async (ctx: Telegraf2byteContext) => {
      this.debugLog("Received text message:", (ctx.update as any).message?.text);
      const messageText = (ctx.update as any).message?.text;
      if (!messageText) return;

      await this.handleUserInput(ctx, messageText, "text");
    });

    // Register message handler for documents/files
    this.bot.on("document", async (ctx: Telegraf2byteContext) => {
      const document = (ctx.update as any).message?.document;
      if (!document) return;

      await this.handleUserInput(ctx, document, "file");
    });

    // Register message handler for photos
    this.bot.on("photo", async (ctx: Telegraf2byteContext) => {
      const photo = (ctx.update as any).message?.photo;
      if (!photo || !photo.length) return;

      // Берем фото с наибольшим разрешением
      const largestPhoto = photo[photo.length - 1];
      await this.handleUserInput(ctx, largestPhoto, "photo");
    });
  }

  private async registerServices() {
    this.apiServiceManager = ApiServiceManager.init(this);

    const registerServices = async (pathDirectory: string) => {
      try {
        await this.apiServiceManager.loadServicesFromDirectory(pathDirectory);
      } catch (error) {
        this.debugLog("Error loading services:", error);
        throw error;
      }

      this.debugLog(
        "Registered API services:%s in dir: %s",
        Array.from(this.apiServiceManager.getAll().keys()),
        pathDirectory
      );

      for (const [name, service] of this.apiServiceManager.getAll()) {
        await service.setup();
        this.debugLog(`Service ${name} setup completed`);
        await service.run();
        this.debugLog(`Service ${name} run completed`);
      }
    };

    // Register services from bot directory
    await registerServices(this.config.botCwd + "/workflow/services");
    // Register services from framework directory
    await registerServices(path.resolve(__dirname, "../workflow/services"));
  }

  private async unregisterServices() {
    this.apiServiceManager = ApiServiceManager.init(this);

    try {
      this.apiServiceManager.unsetupAllServices();
    } catch (error) {
      this.debugLog("Error unsetting up services:", error);
      throw error;
    }
  }

  private async handleUserInput(
    ctx: Telegraf2byteContext,
    inputValue: any,
    inputType: "text" | "file" | "photo"
  ) {
    // Обработка awaitingInputPromise (для requestInputWithAwait)
    if (ctx.userSession.awaitingInputPromise) {
      this.debugLog("Handling input for awaitingInputPromise");
      const awaitingPromise = ctx.userSession.awaitingInputPromise;
      const {
        key,
        validator,
        errorMessage,
        allowCancel,
        retryCount = 0,
        resolve,
        reject,
      } = awaitingPromise;

      try {
        const isValid = await this.validateUserInput(
          inputValue,
          validator,
          inputType,
          awaitingPromise.fileValidation
        );

        this.debugLog(`Input validation result for key ${key}:`, isValid);

        if (isValid) {
          // Сохраняем ответ в сессии
          ctx.userSession[key] = inputValue;
          // Очищаем состояние ожидания
          delete ctx.userSession.awaitingInputPromise;
          // Разрешаем Promise
          resolve(inputValue);
          ctx.deleteLastMessage();
        } else {
          // Увеличиваем счетчик попыток
          awaitingPromise.retryCount = retryCount + 1;

          // Отправляем сообщение об ошибке
          let errorMsg = errorMessage;
          if (awaitingPromise.retryCount > 1) {
            errorMsg += ` (попытка ${awaitingPromise.retryCount})`;
          }

          if (allowCancel) {
            errorMsg += '\n\nИспользуйте кнопку "Отмена" для отмены ввода.';
          }

          await ctx.reply(errorMsg, {
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "Отмена",
                  ctx?.userSession?.previousSection?.route?.getActionPath() ?? "home.index"
                ),
              ],
            ]),
          });

          // НЕ очищаем состояние ожидания - пользователь остается в режиме ввода
          // Состояние будет очищено только при успешном вводе или отмене
        }
      } catch (error) {
        await ctx.reply(`Ошибка валидации: ${error}`);
        if (allowCancel) {
          await ctx.reply('Используйте кнопку "Отмена" для отмены ввода.');
        }
      }
      return;
    }

    // Обработка awaitingInput (для requestInput с callback)
    if (ctx.userSession.awaitingInput) {
      const awaitingInput = ctx.userSession.awaitingInput;
      const {
        key,
        validator,
        errorMessage,
        allowCancel,
        retryCount = 0,
        runSection,
      } = awaitingInput;

      try {
        const isValid = await this.validateUserInput(
          inputValue,
          validator,
          inputType,
          awaitingInput.fileValidation
        );

        if (isValid) {
          // Сохраняем ответ в сессии
          ctx.userSession[key] = inputValue;
          // Очищаем состояние ожидания
          delete ctx.userSession.awaitingInput;

          // Если указан runSection, выполняем его
          if (runSection) {
            await this.runSection(ctx, runSection);
          }
        } else {
          // Увеличиваем счетчик попыток
          awaitingInput.retryCount = retryCount + 1;

          // Отправляем сообщение об ошибке
          let errorMsg = errorMessage;
          if (awaitingInput.retryCount > 1) {
            errorMsg += ` (попытка ${awaitingInput.retryCount})`;
          }
          if (allowCancel) {
            errorMsg += '\n\nИспользуйте кнопку "Отмена" для отмены ввода.';
          }

          await ctx.reply(errorMsg, {
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "Отмена",
                  ctx?.userSession?.previousSection?.route?.getActionPath() ?? "home.index"
                ),
              ],
            ]),
          });

          // НЕ очищаем состояние ожидания - пользователь остается в режиме ввода
        }
      } catch (error) {
        await ctx.reply(`Ошибка валидации: ${error}`);
        if (allowCancel) {
          await ctx.reply('Используйте кнопку "Отмена" для отмены ввода.');
        }
      }
      return;
    }
  }

  private async validateUserInput(
    value: any,
    validator?: "number" | "phone" | "code" | "file" | ((value: any) => boolean | Promise<boolean>),
    inputType?: "text" | "file" | "photo",
    fileValidation?: { allowedTypes?: string[]; maxSize?: number; minSize?: number }
  ): Promise<boolean> {
    if (!validator) return true;

    if (typeof validator === "function") {
      const result = validator(value);
      return result instanceof Promise ? await result : result;
    }

    switch (validator) {
      case "number":
        if (inputType !== "text") return false;
        return !isNaN(Number(value)) && value.trim() !== "";

      case "phone":
        if (inputType !== "text") return false;
        // Remove all non-digit characters
        const cleanNumber = value.replace(/\D/g, "");
        // Check international phone number format:
        // - Optional '+' at start
        // - May start with country code (1-3 digits)
        // - Followed by 6-12 digits
        // This covers most international formats including:
        // - Russian format (7xxxxxxxxxx)
        // - US/Canada format (1xxxxxxxxxx)
        // - European formats
        // - Asian formats
        const phoneRegex = /^(\+?\d{1,3})?[0-9]{6,12}$/;
        return phoneRegex.test(cleanNumber);

      case "code":
        if (inputType !== "text") return false;
        // Проверяем код подтверждения (обычно 5-6 цифр)
        const codeRegex = /^[0-9]{5,6}$/;
        return codeRegex.test(value);

      case "file":
        if (inputType !== "file" && inputType !== "photo") return false;

        // Валидация файла
        if (fileValidation) {
          // Проверка типа файла
          if (fileValidation.allowedTypes && fileValidation.allowedTypes.length > 0) {
            const mimeType = value.mime_type || "";
            if (!fileValidation.allowedTypes.includes(mimeType)) {
              throw new Error(
                `Неподдерживаемый тип файла. Разрешены: ${fileValidation.allowedTypes.join(", ")}`
              );
            }
          }

          // Проверка размера файла
          const fileSize = value.file_size || 0;
          if (fileValidation.maxSize && fileSize > fileValidation.maxSize) {
            throw new Error(
              `Файл слишком большой. Максимальный размер: ${Math.round(
                fileValidation.maxSize / 1024 / 1024
              )} МБ`
            );
          }

          if (fileValidation.minSize && fileSize < fileValidation.minSize) {
            throw new Error(
              `Файл слишком маленький. Минимальный размер: ${Math.round(
                fileValidation.minSize / 1024
              )} КБ`
            );
          }
        }

        return true;

      default:
        return true;
    }
  }

  registerCommands() {
    // Register command handlers
    // Register commands according to sections, each section class has static command method
    Array.from(this.sectionClasses.entries()).forEach(([sectionId, sectionClass]) => {
      const command = (sectionClass as any).command;
      this.debugLog(`Register command ${command} for section ${sectionId}`);
      if (command) {
        this.bot.command(command, async (ctx: Telegraf2byteContext) => {
          const sectionRoute = new RunSectionRoute().section(sectionId).method("index");
          await this.runSection(ctx, sectionRoute);
        });
      }
    });
  }

  async loadSection(sectionId: string, freshVersion: boolean = false): Promise<typeof Section> {
    const sectionParams = Object.entries(this.config.sections).find(
      ([sectionId]) => sectionId === sectionId
    )?.[1] as SectionEntityConfig;

    if (!sectionParams) {
      throw new Error(`Section ${sectionId} not found`);
    }

    let pathSectionModule =
      sectionParams.pathModule ??
      path.join(process.cwd(), "./sections/" + nameToCapitalize(sectionId) + "Section");

    this.debugLog("Path to section module: ", pathSectionModule);

    // Check if file exists
    try {
      await access(pathSectionModule + ".ts");
    } catch {
      throw new Error(`Section ${sectionId} not found at path ${pathSectionModule}.ts`);
    }

    // For bypassing cache in Bun, we need to clear the module cache
    if (freshVersion && typeof Bun !== 'undefined') {
      // Clear Bun's module cache for this specific module
      const modulePath = pathSectionModule + ".ts";
      this.debugLog('Clearing cache for fresh version of section:', modulePath);
      
      // In Bun, we can use dynamic import with a unique query to bypass cache
      // But we need to resolve the absolute path first
      const absolutePath = path.resolve(modulePath);
      
      // Try to delete from require cache if it exists
      if (require.cache && require.cache[absolutePath]) {
        delete require.cache[absolutePath];
      }
    }
    
    const sectionClass = (await import(pathSectionModule)).default as typeof Section;
    this.debugLog("Loaded section", sectionId);

    return sectionClass;
  }

  async registerSections() {
    // Register sections routes
    for (const sectionId of Object.keys(this.config.sections)) {
      this.debugLog("Registration section: " + sectionId);

      try {
        this.sectionClasses.set(sectionId, await this.loadSection(sectionId));
      } catch (err) {
        this.debugLog("Error stack:", err instanceof Error ? err.stack : "No stack available");
        throw new Error(
          `Failed to load section ${sectionId}: ${err instanceof Error ? err.message : err}`
        );
      }
    }
  }

  async runSection(ctx: Telegraf2byteContext, sectionRoute: RunSectionRoute): Promise<void> {
    const sectionId = sectionRoute.getSection();
    const method = sectionRoute.getMethod();

    this.debugLog(`Run section ${sectionId} method ${method}`);

    if (!sectionId || !method) {
      throw new Error("Section or method is not set");
    }

    let sectionClass: typeof Section;

    if (this.config.devHotReloadSections) {
      sectionClass = await this.loadSection(sectionId, true);
    } else {
      if (!this.sectionClasses.has(sectionId)) {
        throw new Error(`Section ${sectionId} not found`);
      }
      sectionClass = this.sectionClasses.get(sectionId) as typeof Section;
    }
    this.debugLog("Using section class:", sectionClass);

    let sectionInstance: Section | undefined;

    const createSectionInstance = (sectionClass: typeof Section) => {
      return new sectionClass({
        ctx,
        bot: this.bot,
        app: this,
        route: sectionRoute,
      } as SectionOptions);
    };

    const createRunnedSection = (instance: Section, route: RunSectionRoute): RunnedSection => {
      return {
        instance,
        route,
      };
    };

    const findRunnedSection = () => {
      const userRunnedSections = this.runnedSections.get(ctx.user);
      if (userRunnedSections && Array.isArray(userRunnedSections)) {
        return userRunnedSections.find((section) => section.route.getSection() === sectionId);
      }
      return undefined;
    };

    let isRestoredSection = false;
    let runnedSection : RunnedSection | undefined = undefined;
    let sectionInstalled = false;
    let createdNewSectionInstance = false;

    if (this.config.keepSectionInstances) {
      runnedSection = findRunnedSection();
      if (runnedSection) {
        isRestoredSection = true;
      } else {
        createdNewSectionInstance = true;
      }
    } else {
      createdNewSectionInstance = true;
    }

    if (isRestoredSection) {
      this.debugLog(`Restored a runned section for user ${ctx.user.username}:`, runnedSection);
    }

    if (createdNewSectionInstance) {
      this.debugLog(`Creating new section instance for user ${ctx.user.username}`);
      runnedSection = createRunnedSection(createSectionInstance(sectionClass), sectionRoute);

      if (this.config.keepSectionInstances) {
        if (!this.runnedSections.has(ctx.user)) {
          this.runnedSections.set(ctx.user, []);
        }
        (this.runnedSections.get(ctx.user) as RunnedSection[]).push(runnedSection);
      }
    }

    if (runnedSection) {
      sectionInstance = runnedSection.instance;
    } else {
      throw new Error(`Failed to create or retrieve runned section for ${sectionId}`);
    }

    if (!(sectionInstance as any)[method]) {
      throw new Error(`Method ${method} not found in section ${sectionId}`);
    }

    /**
     * Run section methods in the following order:
     * 1. setup (if section is installed)
     * 2. up
     * 3. method (action)
     * 4. down (if section is installed)
     * 5. unsetup (if section is installed and previous section is different)
     */

    const setupMethod = sectionInstance.setup;
    const upMethod = sectionInstance.up;
    const downMethod = sectionInstance.down;
    const unsetupMethod = sectionInstance.unsetup;

    // Run setup if section is installed
    if (sectionInstalled && setupMethod && typeof setupMethod === "function") {
      if (sectionInstalled) {
        this.debugLog(`[Setup] Section ${sectionId} install for user ${ctx.user.username}`);
        await sectionInstance.setup();
        this.debugLog(
          `[Setup finish] Section ${sectionId} installed for user ${ctx.user.username}`
        );
      }
    }

    // Run up method
    if (upMethod && typeof upMethod === "function") {
      this.debugLog(`[Up] Section ${sectionId} up for user ${ctx.user.username}`);
      await sectionInstance.up();
      this.debugLog(`[Up finish] Section ${sectionId} up for user ${ctx.user.username}`);
    }

    try {
      await (sectionInstance as any)[method]();
    } catch (error) {
      this.debugLog(`[Error] Section ${sectionId} error for user ${ctx.user.username}:`, error);
    }

    // Run down method if section is installed
    const previousSection = (ctx.userSession.previousSection = runnedSection as RunnedSection);

    if (downMethod && typeof downMethod === "function") {
      this.debugLog(`[Down] Section ${sectionId} down for user ${ctx.user.username}`);
      await sectionInstance.down();
      this.debugLog(`[Down finish] Section ${sectionId} down for user ${ctx.user.username}`);
    }

    // Run unsetup method if section is installed and previous section is different
    if (previousSection && previousSection.constructor.name !== sectionInstance.constructor.name) {
      this.debugLog(
        `Previous section ${previousSection.constructor.name} is different from current section ${sectionInstance.constructor.name}`
      );

      if (unsetupMethod && typeof unsetupMethod === "function") {
        this.debugLog(
          `[Unsetup] Section ${previousSection.instance.constructor.name} unsetup for user ${ctx.user.username}`
        );
        await previousSection.instance.unsetup();
        this.debugLog(
          `[Unsetup finish] Section ${previousSection.instance.constructor.name} unsetup for user ${ctx.user.username}`
        );
      }
    }
  }

  getRunnedSection(user: UserModel): RunnedSection | Map<string, RunnedSection> {
    const section = this.runnedSections.get(user);

    if (!section) {
      throw new Error("Section not found");
    }

    return section;
  }

  async registerUser(data: UserRegistrationData): Promise<UserModel | null> {
    try {
      const user = await UserModel.register(data);

      if (this.config.userStorage) {
        this.config.userStorage.add(data.tg_username, user);
        this.debugLog("User added to storage:", data.tg_username);
      }

      return user;
    } catch (error) {
      console.error("User registration error:", error);
      return null;
    }
  }

  /**
   * Runs a task with bidirectional communication support
   * @param ctx Telegram context
   * @param task Function that performs the task with message handlers
   * @param options Configuration options for the task
   * @returns Task controller object with methods for communication and control
   */
  runTask(
    ctx: Telegraf2byteContext,
    task: (controller: {
      signal: AbortSignal;
      sendMessage: (message: string) => Promise<void>;
      onMessage: (handler: (message: string, source: "task" | "external") => void) => void;
    }) => Promise<any>,
    options: {
      taskId?: string;
      notifyStart?: boolean;
      notifyComplete?: boolean;
      startMessage?: string;
      completeMessage?: string;
      errorMessage?: string;
      silent?: boolean;
    } = {}
  ) {
    const {
      taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notifyStart = true,
      notifyComplete = true,
      startMessage = "Задача запущена и будет выполняться в фоновом режиме.",
      completeMessage = "Задача успешно завершена!",
      errorMessage = "Произошла ошибка при выполнении задачи.",
      silent = false,
    } = options;

    // Create abort controller for task cancellation
    const abortController = new AbortController();

    // Message handling setup
    const messageHandlers: ((message: string, source: "task" | "external") => void)[] = [];
    const messageQueue: Array<{ message: string; source: "task" | "external" }> = [];

    // Create task controller interface
    const taskController = {
      signal: abortController.signal,
      // Send message from task to handlers
      sendMessage: async (message: string) => {
        if (!silent) {
          await ctx.reply(`[Задача ${taskId}]: ${message}`).catch(console.error);
        }
        messageQueue.push({ message, source: "task" });
        messageHandlers.forEach((handler) => handler(message, "task"));
      },
      // Handle incoming messages to task
      onMessage: (handler: (message: string, source: "task" | "external") => void) => {
        messageHandlers.push(handler);
        // Process any queued messages
        messageQueue.forEach(({ message, source }) => handler(message, source));
      },
      // Receive message from external source
      receiveMessage: async (message: string) => {
        messageQueue.push({ message, source: "external" });
        messageHandlers.forEach((handler) => handler(message, "external"));
        if (!silent) {
          await ctx
            .reply(`[Внешнее сообщение для задачи ${taskId}]: ${message}`)
            .catch(console.error);
        }
      },
    };

    // Send start notification if enabled
    if (notifyStart && !silent) {
      ctx.reply(startMessage).catch(console.error);
    }

    // Create and run task promise
    const taskPromise = Promise.resolve().then(() => {
      return task(taskController);
    });

    // Save task information
    this.runningTasks.set(taskId, {
      task: taskPromise,
      cancel: () => abortController.abort(),
      status: "running",
      startTime: Date.now(),
      ctx,
      controller: taskController,
      messageQueue,
    });

    // Handle task completion and errors
    taskPromise
      .then((result) => {
        const taskInfo = this.runningTasks.get(taskId);
        if (taskInfo) {
          taskInfo.status = "completed";
          taskInfo.endTime = Date.now();
          if (notifyComplete && !silent) {
            ctx.reply(completeMessage).catch(console.error);
          }
        }
        return result;
      })
      .catch((error) => {
        const taskInfo = this.runningTasks.get(taskId);
        if (taskInfo) {
          taskInfo.status = error.name === "AbortError" ? "cancelled" : "failed";
          taskInfo.endTime = Date.now();
          taskInfo.error = error;

          if (error.name !== "AbortError" && !silent) {
            console.error("Task error:", error);
            ctx.reply(`${errorMessage}\nОшибка: ${error.message}`).catch(console.error);
          }
        }
      });

    return taskId;
  }

  /**
   * Get information about a running task
   * @param taskId The ID of the task to check
   */
  getTaskInfo(taskId: string) {
    return this.runningTasks.get(taskId);
  }

  /**
   * Cancel a running task
   * @param taskId The ID of the task to cancel
   * @returns true if the task was cancelled, false if it couldn't be cancelled
   */
  cancelTask(taskId: string): boolean {
    const taskInfo = this.runningTasks.get(taskId);
    if (taskInfo && taskInfo.cancel && taskInfo.status === "running") {
      taskInfo.cancel();
      return true;
    }
    return false;
  }

  /**
   * Send a message to a running task
   * @param taskId The ID of the task to send the message to
   * @param message The message to send
   * @returns true if the message was sent, false if the task wasn't found or isn't running
   */
  async sendMessageToTask(taskId: string, message: string): Promise<boolean> {
    const taskInfo = this.runningTasks.get(taskId);
    if (taskInfo && taskInfo.controller && taskInfo.status === "running") {
      await taskInfo.controller.receiveMessage(message);
      return true;
    }
    return false;
  }

  /**
   * Get all tasks for a specific user
   * @param userId Telegram user ID
   */
  getUserTasks(
    userId: number
  ): Array<{ taskId: string; status: string; startTime: number; endTime?: number }> {
    const tasks: Array<{ taskId: string; status: string; startTime: number; endTime?: number }> =
      [];

    for (const [taskId, taskInfo] of this.runningTasks) {
      if (taskInfo.ctx.from?.id === userId) {
        tasks.push({
          taskId,
          status: taskInfo.status,
          startTime: taskInfo.startTime,
          endTime: taskInfo.endTime,
        });
      }
    }

    return tasks;
  }

  /**
   * Clean up completed/failed/cancelled tasks older than the specified age
   * @param maxAge Maximum age in milliseconds (default: 1 hour)
   */
  cleanupOldTasks(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [taskId, taskInfo] of this.runningTasks) {
      if (taskInfo.status !== "running" && taskInfo.endTime && now - taskInfo.endTime > maxAge) {
        this.runningTasks.delete(taskId);
      }
    }
  }

  private getTgUsername(ctx: Telegraf2byteContext): string {
    return ctx.from?.username || "";
  }

  private getTgName(ctx: Telegraf2byteContext): string {
    return ctx.from?.first_name || "";
  }

  private getTgId(ctx: Telegraf2byteContext): number {
    return ctx.from?.id || 0;
  }

  debugLog(...args: any[]): void {
    if (this.config.debug) {
      console.log(...args);
    }
  }

  get sections(): SectionList {
    return this.config.sections;
  }

  get configApp(): AppConfig {
    return this.config;
  }
}
