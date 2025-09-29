export declare class RunSectionRoute {
    private runParams;
    constructor();
    section(sectionId: string): this;
    method(name?: string, isRunCallbackQuery?: boolean): this;
    methodArgs(args: any[] | null): this;
    callbackParams(actionPath: string, params: string | Record<string, string>): this;
    actionPath(path: string): this;
    hearsKey(key: string): this;
    getMethod(): string | null;
    getSection(): string | null;
    getSectionId(): string | null;
    getCommand(): string | null;
    getSubCommand(): string | null;
    getActionPath(): string | null;
    getCallbackParams(): URLSearchParams;
    getHearsKey(): string | null;
    get runIsCallbackQuery(): boolean;
}
