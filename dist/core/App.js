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
exports.App = void 0;
const telegraf_1 = require("telegraf");
const node_path_1 = __importDefault(require("node:path"));
const Telegraf2byteContext_1 = require("../illumination/Telegraf2byteContext");
const RunSectionRoute_1 = require("../illumination/RunSectionRoute");
const UserModel_1 = require("../user/UserModel");
const utils_1 = require("./utils");
class App {
    constructor() {
        this.config = {
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
        };
        this.sectionClasses = new Map();
        this.runnedSections = new WeakMap();
        this.middlewares = [];
        // Система управления фоновыми задачами
        this.runningTasks = new Map();
        this.middlewares.push(this.mainMiddleware.bind(this));
    }
    async init() {
        if (!this.config.botToken) {
            throw new Error("Bot token is not set");
        }
        this.bot = new telegraf_1.Telegraf(this.config.botToken);
        if (this.config.telegrafLog) {
            this.bot.use(telegraf_1.Telegraf.log());
        }
        this.debugLog("AppConfig", this.config);
        await this.registerSections();
        this.middlewares.forEach((middleware) => {
            middleware();
        });
        this.registerActionForCallbackQuery();
        // this.registerHears();
        this.registerCommands();
        this.registerMessageHandlers();
        return this;
    }
    async launch() {
        if (!this.bot) {
            throw new Error("Bot is not initialized");
        }
        this.bot.catch((err) => {
            console.error("Error in bot:", err);
            if (this.config.debug && err instanceof Error) {
                console.error("Stack trace:", err.stack);
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
        this.bot.use(async (ctx, next) => {
            const tgUsername = this.getTgUsername(ctx);
            if (!tgUsername) {
                return ctx.reply("Username is not set");
            }
            if (!this.config.userStorage) {
                throw new Error("User storage is not set");
            }
            if (!this.config.userStorage.exists(tgUsername)) {
                const userData = await this.registerUser({
                    tgUsername,
                    tgName: this.getTgName(ctx),
                    tgId: this.getTgId(ctx),
                });
                if (!userData) {
                    throw new Error("User registration failed");
                }
            }
            ctx.user = this.config.userStorage.find(tgUsername);
            ctx.userStorage = this.config.userStorage;
            ctx.userSession = this.config.userStorage.findSession(ctx.user);
            Object.assign(ctx, Telegraf2byteContext_1.Telegraf2byteContextExtraMethods);
            this.config.userStorage.upActive(tgUsername);
            if (ctx.msgId) {
                this.config.userStorage.storeMessageId(tgUsername, ctx.msgId, 10);
            }
            return next();
        });
    }
    async registerActionForCallbackQuery() {
        // Register actions
        this.bot.action(/(.+)/, async (ctx) => {
            let actionPath = ctx.match?.[1];
            const actionParamsString = actionPath.match(/\[(.+)\]/);
            let actionParams = new URLSearchParams();
            if (actionParamsString && actionParamsString[1]) {
                actionParams = new URLSearchParams(actionParamsString[1]);
                actionPath = actionPath.split("[")[0];
            }
            this.debugLog(`Run action ${actionPath} with params ${actionParams.toString()} for user ${ctx.user.username}`);
            if (!actionPath)
                return;
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
                    throw new Error(`Method ${actionPath} not found in section ${sectionId}`);
                }
                const sectionRoute = new RunSectionRoute_1.RunSectionRoute()
                    .section(sectionId)
                    .method(method)
                    .actionPath(actionPath);
                this.runSection(ctx, sectionRoute);
            }
        });
    }
    registerHears() {
        // Register hears
        Object.entries(this.config.hears).forEach(([key, sectionMethod]) => {
            this.bot.hears(key, async (ctx) => {
                const user = ctx.user;
                const [sectionId, method] = sectionMethod.split(".");
                const sectionRoute = new RunSectionRoute_1.RunSectionRoute().section(sectionId).method(method).hearsKey(key);
                await this.runSection(ctx, sectionRoute);
            });
        });
    }
    registerMessageHandlers() {
        // Register message handler for text messages
        this.bot.on("text", async (ctx) => {
            this.debugLog("Received text message:", ctx.update.message?.text);
            const messageText = ctx.update.message?.text;
            if (!messageText)
                return;
            await this.handleUserInput(ctx, messageText, "text");
        });
        // Register message handler for documents/files
        this.bot.on("document", async (ctx) => {
            const document = ctx.update.message?.document;
            if (!document)
                return;
            await this.handleUserInput(ctx, document, "file");
        });
        // Register message handler for photos
        this.bot.on("photo", async (ctx) => {
            const photo = ctx.update.message?.photo;
            if (!photo || !photo.length)
                return;
            // Берем фото с наибольшим разрешением
            const largestPhoto = photo[photo.length - 1];
            await this.handleUserInput(ctx, largestPhoto, "photo");
        });
    }
    async handleUserInput(ctx, inputValue, inputType) {
        // Обработка awaitingInputPromise (для requestInputWithAwait)
        if (ctx.userSession.awaitingInputPromise) {
            this.debugLog("Handling input for awaitingInputPromise");
            const awaitingPromise = ctx.userSession.awaitingInputPromise;
            const { key, validator, errorMessage, allowCancel, retryCount = 0, resolve, reject, } = awaitingPromise;
            try {
                const isValid = await this.validateUserInput(inputValue, validator, inputType, awaitingPromise.fileValidation);
                this.debugLog(`Input validation result for key ${key}:`, isValid);
                if (isValid) {
                    // Сохраняем ответ в сессии
                    ctx.userSession[key] = inputValue;
                    // Очищаем состояние ожидания
                    delete ctx.userSession.awaitingInputPromise;
                    // Разрешаем Promise
                    resolve(inputValue);
                }
                else {
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
                        ...telegraf_1.Markup.inlineKeyboard([
                            [
                                telegraf_1.Markup.button.callback("Отмена", ctx?.userSession?.previousSection?.route?.getActionPath() ?? "home.index"),
                            ],
                        ]),
                    });
                    // НЕ очищаем состояние ожидания - пользователь остается в режиме ввода
                    // Состояние будет очищено только при успешном вводе или отмене
                }
            }
            catch (error) {
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
            const { key, validator, errorMessage, allowCancel, retryCount = 0, runSection, } = awaitingInput;
            try {
                const isValid = await this.validateUserInput(inputValue, validator, inputType, awaitingInput.fileValidation);
                if (isValid) {
                    // Сохраняем ответ в сессии
                    ctx.userSession[key] = inputValue;
                    // Очищаем состояние ожидания
                    delete ctx.userSession.awaitingInput;
                    // Если указан runSection, выполняем его
                    if (runSection) {
                        await this.runSection(ctx, runSection);
                    }
                }
                else {
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
                        ...telegraf_1.Markup.inlineKeyboard([
                            [
                                telegraf_1.Markup.button.callback("Отмена", ctx?.userSession?.previousSection?.route?.getActionPath() ?? "home.index"),
                            ],
                        ]),
                    });
                    // НЕ очищаем состояние ожидания - пользователь остается в режиме ввода
                }
            }
            catch (error) {
                await ctx.reply(`Ошибка валидации: ${error}`);
                if (allowCancel) {
                    await ctx.reply('Используйте кнопку "Отмена" для отмены ввода.');
                }
            }
            return;
        }
    }
    async validateUserInput(value, validator, inputType, fileValidation) {
        if (!validator)
            return true;
        if (typeof validator === "function") {
            const result = validator(value);
            return result instanceof Promise ? await result : result;
        }
        switch (validator) {
            case "number":
                if (inputType !== "text")
                    return false;
                return !isNaN(Number(value)) && value.trim() !== "";
            case "phone":
                if (inputType !== "text")
                    return false;
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
                if (inputType !== "text")
                    return false;
                // Проверяем код подтверждения (обычно 5-6 цифр)
                const codeRegex = /^[0-9]{5,6}$/;
                return codeRegex.test(value);
            case "file":
                if (inputType !== "file" && inputType !== "photo")
                    return false;
                // Валидация файла
                if (fileValidation) {
                    // Проверка типа файла
                    if (fileValidation.allowedTypes && fileValidation.allowedTypes.length > 0) {
                        const mimeType = value.mime_type || "";
                        if (!fileValidation.allowedTypes.includes(mimeType)) {
                            throw new Error(`Неподдерживаемый тип файла. Разрешены: ${fileValidation.allowedTypes.join(", ")}`);
                        }
                    }
                    // Проверка размера файла
                    const fileSize = value.file_size || 0;
                    if (fileValidation.maxSize && fileSize > fileValidation.maxSize) {
                        throw new Error(`Файл слишком большой. Максимальный размер: ${Math.round(fileValidation.maxSize / 1024 / 1024)} МБ`);
                    }
                    if (fileValidation.minSize && fileSize < fileValidation.minSize) {
                        throw new Error(`Файл слишком маленький. Минимальный размер: ${Math.round(fileValidation.minSize / 1024)} КБ`);
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
            const command = sectionClass.command;
            this.debugLog(`Register command ${command} for section ${sectionId}`);
            if (command) {
                this.bot.command(command, async (ctx) => {
                    const sectionRoute = new RunSectionRoute_1.RunSectionRoute().section(sectionId).method("index");
                    await this.runSection(ctx, sectionRoute);
                });
            }
        });
    }
    async loadSection(sectionId, freshVersion = false) {
        const sectionParams = Object.entries(this.config.sections).find(([sectionId]) => sectionId === sectionId)?.[1];
        if (!sectionParams) {
            throw new Error(`Section ${sectionId} not found`);
        }
        let pathSectionModule = sectionParams.pathModule ??
            node_path_1.default.join(process.cwd(), "./sections/" + (0, utils_1.nameToCapitalize)(sectionId) + "Section");
        this.debugLog('Path to section module: ', pathSectionModule);
        if (freshVersion) {
            pathSectionModule += "?update=" + Date.now();
        }
        const sectionClass = (await Promise.resolve(`${pathSectionModule}`).then(s => __importStar(require(s)))).default;
        this.debugLog("Loaded section", sectionId);
        return sectionClass;
    }
    async registerSections() {
        // Register sections routes
        for (const sectionId of Object.keys(this.config.sections)) {
            this.debugLog("Registration section: " + sectionId);
            try {
                this.sectionClasses.set(sectionId, await this.loadSection(sectionId));
            }
            catch (err) {
                this.debugLog('Error stack:', err instanceof Error ? err.stack : 'No stack available');
                throw new Error(`Failed to load section ${sectionId}: ${err instanceof Error ? err.message : err}`);
            }
        }
    }
    async runSection(ctx, sectionRoute) {
        const sectionId = sectionRoute.getSection();
        const method = sectionRoute.getMethod();
        this.debugLog(`Run section ${sectionId} method ${method}`);
        if (!sectionId || !method) {
            throw new Error("Section or method is not set");
        }
        let sectionClass;
        if (this.config.devHotReloadSections) {
            sectionClass = await this.loadSection(sectionId, true);
        }
        else {
            if (!this.sectionClasses.has(sectionId)) {
                throw new Error(`Section ${sectionId} not found`);
            }
            sectionClass = this.sectionClasses.get(sectionId);
        }
        const sectionInstance = new sectionClass({
            ctx,
            bot: this.bot,
            app: this,
            route: sectionRoute,
        });
        let runnedSection;
        let userRunnedSections;
        let sectionInstalled = false;
        if (this.config.keepSectionInstances) {
            userRunnedSections = this.runnedSections.get(ctx.user);
            if (userRunnedSections instanceof Map) {
                runnedSection && (runnedSection = userRunnedSections.get(sectionId));
            }
        }
        else {
            runnedSection && (runnedSection = this.runnedSections.get(ctx.user));
        }
        if (runnedSection) {
            this.debugLog(`Restored a runned section for user ${ctx.user.username}:`, runnedSection);
        }
        if (!runnedSection && this.config.keepSectionInstances) {
            if (userRunnedSections instanceof Map) {
                userRunnedSections.set(sectionId, {
                    instance: sectionInstance,
                    route: sectionRoute,
                });
                sectionInstalled = true;
            }
            else if (userRunnedSections === undefined) {
                userRunnedSections = new Map([
                    [
                        sectionId,
                        {
                            instance: sectionInstance,
                            route: sectionRoute,
                        },
                    ],
                ]);
                sectionInstalled = true;
            }
        }
        if (!runnedSection && !this.config.keepSectionInstances) {
            this.runnedSections.set(ctx.user, {
                instance: sectionInstance,
                route: sectionRoute,
            });
            sectionInstalled = true;
        }
        if (!sectionInstance[method]) {
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
                this.debugLog(`[Setup finish] Section ${sectionId} installed for user ${ctx.user.username}`);
            }
        }
        // Run up method
        if (upMethod && typeof upMethod === "function") {
            this.debugLog(`[Up] Section ${sectionId} up for user ${ctx.user.username}`);
            await sectionInstance.up();
            this.debugLog(`[Up finish] Section ${sectionId} up for user ${ctx.user.username}`);
        }
        await sectionInstance[method]();
        // Run down method if section is installed
        const previousSection = (ctx.userSession.previousSection = runnedSection);
        if (downMethod && typeof downMethod === "function") {
            this.debugLog(`[Down] Section ${sectionId} down for user ${ctx.user.username}`);
            await sectionInstance.down();
            this.debugLog(`[Down finish] Section ${sectionId} down for user ${ctx.user.username}`);
        }
        // Run unsetup method if section is installed and previous section is different
        if (previousSection && previousSection.constructor.name !== sectionInstance.constructor.name) {
            this.debugLog(`Previous section ${previousSection.constructor.name} is different from current section ${sectionInstance.constructor.name}`);
            if (unsetupMethod && typeof unsetupMethod === "function") {
                this.debugLog(`[Unsetup] Section ${previousSection.instance.constructor.name} unsetup for user ${ctx.user.username}`);
                await previousSection.instance.unsetup();
                this.debugLog(`[Unsetup finish] Section ${previousSection.instance.constructor.name} unsetup for user ${ctx.user.username}`);
            }
        }
    }
    getRunnedSection(user) {
        const section = this.runnedSections.get(user);
        if (!section) {
            throw new Error("Section not found");
        }
        return section;
    }
    async registerUser(data) {
        try {
            const user = await UserModel_1.UserModel.register(data);
            if (this.config.userStorage) {
                this.config.userStorage.add(data.tgUsername, user);
            }
            return user;
        }
        catch (error) {
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
    runTask(ctx, task, options = {}) {
        const { taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, notifyStart = true, notifyComplete = true, startMessage = "Задача запущена и будет выполняться в фоновом режиме.", completeMessage = "Задача успешно завершена!", errorMessage = "Произошла ошибка при выполнении задачи.", silent = false, } = options;
        // Create abort controller for task cancellation
        const abortController = new AbortController();
        // Message handling setup
        const messageHandlers = [];
        const messageQueue = [];
        // Create task controller interface
        const taskController = {
            signal: abortController.signal,
            // Send message from task to handlers
            sendMessage: async (message) => {
                if (!silent) {
                    await ctx.reply(`[Задача ${taskId}]: ${message}`).catch(console.error);
                }
                messageQueue.push({ message, source: 'task' });
                messageHandlers.forEach(handler => handler(message, 'task'));
            },
            // Handle incoming messages to task
            onMessage: (handler) => {
                messageHandlers.push(handler);
                // Process any queued messages
                messageQueue.forEach(({ message, source }) => handler(message, source));
            },
            // Receive message from external source
            receiveMessage: async (message) => {
                messageQueue.push({ message, source: 'external' });
                messageHandlers.forEach(handler => handler(message, 'external'));
                if (!silent) {
                    await ctx.reply(`[Внешнее сообщение для задачи ${taskId}]: ${message}`).catch(console.error);
                }
            }
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
            messageQueue
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
    getTaskInfo(taskId) {
        return this.runningTasks.get(taskId);
    }
    /**
     * Cancel a running task
     * @param taskId The ID of the task to cancel
     * @returns true if the task was cancelled, false if it couldn't be cancelled
     */
    cancelTask(taskId) {
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
    async sendMessageToTask(taskId, message) {
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
    getUserTasks(userId) {
        const tasks = [];
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
    cleanupOldTasks(maxAge = 3600000) {
        const now = Date.now();
        for (const [taskId, taskInfo] of this.runningTasks) {
            if (taskInfo.status !== "running" && taskInfo.endTime && now - taskInfo.endTime > maxAge) {
                this.runningTasks.delete(taskId);
            }
        }
    }
    getTgUsername(ctx) {
        return ctx.from?.username || "";
    }
    getTgName(ctx) {
        return ctx.from?.first_name || "";
    }
    getTgId(ctx) {
        return ctx.from?.id || 0;
    }
    debugLog(...args) {
        if (this.config.debug) {
            console.log(...args);
        }
    }
    get sections() {
        return this.config.sections;
    }
    get components() {
        return this.config.components;
    }
}
exports.App = App;
App.Builder = class {
    constructor() {
        this.app = new App();
    }
    apiUrl(url) {
        this.app.config.apiUrl = url;
        return this;
    }
    botToken(token) {
        this.app.config.botToken = token;
        return this;
    }
    telegrafConfigLaunch(config) {
        this.app.config.telegrafConfigLaunch = config;
        return this;
    }
    settings(settings) {
        this.app.config.settings = settings;
        return this;
    }
    userStorage(storage) {
        this.app.config.userStorage = storage;
        return this;
    }
    debug(isDebug = true) {
        this.app.config.debug = isDebug;
        return this;
    }
    devHotReloadSections(isReload = true) {
        this.app.config.devHotReloadSections = isReload;
        return this;
    }
    telegrafLog(isLog = true) {
        this.app.config.telegrafLog = isLog;
        return this;
    }
    mainMenuKeyboard(keyboard) {
        this.app.config.mainMenuKeyboard = keyboard;
        return this;
    }
    hears(hearsMap) {
        this.app.config.hears = hearsMap;
        return this;
    }
    terminateSigInt(isTerminate = true) {
        this.app.config.terminateSigInt = isTerminate;
        return this;
    }
    terminateSigTerm(isTerminate = true) {
        this.app.config.terminateSigTerm = isTerminate;
        return this;
    }
    sections(sectionsList) {
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
    keepSectionInstances(keep = true) {
        this.app.config.keepSectionInstances = keep;
        return this;
    }
    envConfig(config) {
        this.app.config.envConfig = config;
        return this;
    }
    build() {
        return this.app;
    }
};
