import { Telegraf2byteContext } from "../illumination/Telegraf2byteContext";
import { Section } from "../illumination/Section";
import { RunSectionRoute } from "../illumination/RunSectionRoute";
import { UserModel } from "../user/UserModel";
import { UserStore } from "../user/UserStore";
import { AppConfig, EnvVars, RunnedSection, SectionList, UserRegistrationData } from "../types";
export declare class App {
    private config;
    private bot;
    private sectionClasses;
    private runnedSections;
    private middlewares;
    private runningTasks;
    constructor();
    static Builder: {
        new (): {
            app: App;
            apiUrl(url: string): /*elided*/ any;
            botToken(token: string): /*elided*/ any;
            telegrafConfigLaunch(config: Record<string, any>): /*elided*/ any;
            settings(settings: Record<string, any>): /*elided*/ any;
            userStorage(storage: UserStore): /*elided*/ any;
            debug(isDebug?: boolean): /*elided*/ any;
            devHotReloadSections(isReload?: boolean): /*elided*/ any;
            telegrafLog(isLog?: boolean): /*elided*/ any;
            mainMenuKeyboard(keyboard: any[][]): /*elided*/ any;
            hears(hearsMap: Record<string, string>): /*elided*/ any;
            terminateSigInt(isTerminate?: boolean): /*elided*/ any;
            terminateSigTerm(isTerminate?: boolean): /*elided*/ any;
            sections(sectionsList: SectionList): /*elided*/ any;
            /**
             *
             * @param keep Whether to keep section instances in memory after they are run.
             * If true, sections will not be reloaded on each request, improving performance for frequently accessed sections.
             * If false, sections will be reloaded each time they are accessed, ensuring the latest version is used.
             * Default is true.
             * @returns
             */
            keepSectionInstances(keep?: boolean): /*elided*/ any;
            envConfig(config: EnvVars): /*elided*/ any;
            build(): App;
        };
    };
    init(): Promise<this>;
    launch(): Promise<this>;
    mainMiddleware(): Promise<void>;
    registerActionForCallbackQuery(): Promise<void>;
    registerHears(): void;
    registerMessageHandlers(): void;
    private handleUserInput;
    private validateUserInput;
    registerCommands(): void;
    loadSection(sectionId: string, freshVersion?: boolean): Promise<typeof Section>;
    registerSections(): Promise<void>;
    runSection(ctx: Telegraf2byteContext, sectionRoute: RunSectionRoute): Promise<void>;
    getRunnedSection(user: UserModel): RunnedSection | Map<string, RunnedSection>;
    registerUser(data: UserRegistrationData): Promise<UserModel | null>;
    /**
     * Runs a task with bidirectional communication support
     * @param ctx Telegram context
     * @param task Function that performs the task with message handlers
     * @param options Configuration options for the task
     * @returns Task controller object with methods for communication and control
     */
    runTask(ctx: Telegraf2byteContext, task: (controller: {
        signal: AbortSignal;
        sendMessage: (message: string) => Promise<void>;
        onMessage: (handler: (message: string, source: 'task' | 'external') => void) => void;
    }) => Promise<any>, options?: {
        taskId?: string;
        notifyStart?: boolean;
        notifyComplete?: boolean;
        startMessage?: string;
        completeMessage?: string;
        errorMessage?: string;
        silent?: boolean;
    }): string;
    /**
     * Get information about a running task
     * @param taskId The ID of the task to check
     */
    getTaskInfo(taskId: string): {
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
        messageQueue?: Array<{
            message: string;
            source: "task" | "external";
        }>;
    } | undefined;
    /**
     * Cancel a running task
     * @param taskId The ID of the task to cancel
     * @returns true if the task was cancelled, false if it couldn't be cancelled
     */
    cancelTask(taskId: string): boolean;
    /**
     * Send a message to a running task
     * @param taskId The ID of the task to send the message to
     * @param message The message to send
     * @returns true if the message was sent, false if the task wasn't found or isn't running
     */
    sendMessageToTask(taskId: string, message: string): Promise<boolean>;
    /**
     * Get all tasks for a specific user
     * @param userId Telegram user ID
     */
    getUserTasks(userId: number): Array<{
        taskId: string;
        status: string;
        startTime: number;
        endTime?: number;
    }>;
    /**
     * Clean up completed/failed/cancelled tasks older than the specified age
     * @param maxAge Maximum age in milliseconds (default: 1 hour)
     */
    cleanupOldTasks(maxAge?: number): void;
    private getTgUsername;
    private getTgName;
    private getTgId;
    debugLog(...args: any[]): void;
    get sections(): SectionList;
    get config(): AppConfig;
}
