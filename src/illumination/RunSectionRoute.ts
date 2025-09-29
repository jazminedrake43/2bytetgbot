import { RunSectionRouteParams } from '../types';

export class RunSectionRoute {
  private runParams: RunSectionRouteParams = {
    section: null,
    method: null,
    methodArgs: null,
    callbackParams: new URLSearchParams(),
    runAsCallcackQuery: false,
    actionPath: null,
    hearsKey: null,
  };

  constructor() {}

  section(sectionId: string): this {
    this.runParams.section = sectionId;
    return this;
  }

  method(name: string = 'index', isRunCallbackQuery: boolean = false): this {
    this.runParams.method = name;
    this.runParams.runAsCallcackQuery = isRunCallbackQuery;
    return this;
  }

  methodArgs(args: any[] | null): this {
    this.runParams.methodArgs = args;
    return this;
  }

  callbackParams(actionPath: string, params: string | Record<string, string>): this {
    this.runParams.callbackParams = new URLSearchParams(params);
    this.actionPath(actionPath);
    this.runParams.runAsCallcackQuery = true;
    return this;
  }

  actionPath(path: string): this {
    this.runParams.actionPath = path;
    this.runParams.runAsCallcackQuery = true;
    return this;
  }

  hearsKey(key: string): this {
    this.runParams.hearsKey = key;
    return this;
  }

  getMethod(): string | null {
    return this.runParams.method;
  }

  getSection(): string | null {
    return this.runParams.section;
  }

  getSectionId(): string | null {
    return this.runParams.section;
  }

  getCommand(): string | null {
    return this.runParams.method;
  }

  getSubCommand(): string | null {
    return this.runParams.method;
  }

  getActionPath(): string | null {
    return this.runParams.actionPath;
  }

  getCallbackParams(): URLSearchParams {
    return this.runParams.callbackParams;
  }

  getHearsKey(): string | null {
    return this.runParams.hearsKey;
  }

  get runIsCallbackQuery(): boolean {
    return this.runParams.runAsCallcackQuery;
  }
}
