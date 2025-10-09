import { type Database } from "bun:sqlite";
import mustache from "mustache";
import { Markup, Telegraf } from "telegraf";
import { App } from "../core/App";
import { MakeManualPaginateButtonsParams, RunnedSection, SectionOptions } from "../types";
import { InlineKeyboard } from "./InlineKeyboard";
import Message2byte from "./Message2Byte";
import Message2bytePool from "./Message2bytePool";
import { RunSectionRoute } from "./RunSectionRoute";
import { Telegraf2byteContext } from "./Telegraf2byteContext";

export class Section {
  static command: string;
  static description: string;
  static actionRoutes: { [key: string]: string };
  public sectionId: string = "BaseSection";
  public route: RunSectionRoute;
  protected ctx: Telegraf2byteContext;
  protected bot: Telegraf<Telegraf2byteContext>;
  protected app: App;
  protected markup: typeof Markup = Markup;
  protected btnHome = this.markup.button.callback("🏠 Лобби", "home.index");
  protected iconBack: string = "🔙";
  protected iconPlus: string = "➕";
  protected iconDelete: string = "✖️";
  protected iconOk: string = "☑️";
  protected iconInput: string = "⤵️";
  protected iconOutput: string = "⤴️";
  protected iconTime: string = "⏱";
  protected iconCheck: string = "\u{2714}";
  protected iconSet: string = "🔖";
  protected iconRefresh: string = "🔃";
  protected iconHistory: string = "🗂";
  protected iconEuro: string = "💶";
  protected iconRejected: string = "❌";
  protected labelBack: string = `${this.iconBack} Назад`;

  protected callbackParams: URLSearchParams | null = null;
  protected mustache: typeof mustache = mustache;
  protected mainMenuKeyboardArray: any[][] = [];
  protected db: Database; // Database connection

  constructor(options: SectionOptions) {
    this.ctx = options.ctx;
    this.bot = options.bot;
    this.app = options.app;
    this.mainMenuKeyboardArray = this.app.config.mainMenuKeyboard;
    this.route = options.route;
    this.db = (global as any).db as Database;
    this.callbackParams = this.parseParamsCallbackdata();
    this.cancelUserWaitingReply();
  }

  public async setup(): Promise<void> {}
  public async unsetup(): Promise<void> {}

  public async up(): Promise<void> {}
  public async down(): Promise<void> {}

  parseParamsCallbackdata(): URLSearchParams {
    let strparams = this.ctx.update?.callback_query?.data?.match(/\[(.+?)\]/);

    if (strparams !== null && strparams?.[1] !== undefined) {
      const valueToType = isFinite(Number(strparams[1])) ? +strparams[1] : strparams[1];
      return new URLSearchParams(String(valueToType));
    }

    return new URLSearchParams();
  }

  makePaginateButtons(
    metadata: any,
    callbackDataAction: string,
    paramsQuery: Record<string, any> = {}
  ): any[][] {
    if (metadata.hasOwnProperty("meta")) metadata = metadata.meta;

    if (metadata.last_page == 1) return [];

    const makeActionData = (page: number): string => {
      const params = { ...paramsQuery, page: page.toString() };
      return `${callbackDataAction}[${new URLSearchParams(
        params as Record<string, string>
      ).toString()}]`;
    };

    const layoutButtons: any[][] = [];
    const pageButtons: any[] = [];

    const makeButtonCallback = (text: string, callbackData: string): any => {
      return this.markup.button.callback(text, callbackData);
    };

    // Pair buttons the start and end
    if (metadata.last_page > 1) {
      const lineFirstNext: any[] = [];

      if (metadata.current_page > 1) {
        lineFirstNext.push(makeButtonCallback("Назад", makeActionData(metadata.current_page - 1)));
      }

      if (metadata.current_page < metadata.last_page) {
        lineFirstNext.push(makeButtonCallback("Вперед", makeActionData(metadata.current_page + 1)));
      }

      layoutButtons.push(lineFirstNext);
    }

    const generatorPageNumber = (startPage: number, lastPage: number): any[] => {
      const buttons: any[] = [];

      for (let i = startPage, c = 1; i <= lastPage && c <= 8; i++, c++) {
        let btn = makeButtonCallback(`${i}`, makeActionData(i));

        if (i == metadata.current_page) {
          btn = makeButtonCallback(`\u{2714} ${i}`, makeActionData(metadata.current_page));
        }

        buttons.push(btn);

        if (startPage + c > metadata.last_page) break;
      }

      return buttons;
    };

    // Page numbers a generator
    if (metadata.last_page > 8) {
      let startPage = 0;
      let lastPage = 0;

      if (metadata.current_page < 8) {
        startPage = 1;
        lastPage = 8;
      } else {
        startPage = metadata.current_page - 3;
        lastPage = metadata.current_page + 4;
      }

      layoutButtons.push(generatorPageNumber(startPage, lastPage));
    } else {
      layoutButtons.push(generatorPageNumber(1, metadata.last_page));
    }

    layoutButtons.push(pageButtons);

    // Pair buttons the start and end
    if (metadata.current_page > 1 && metadata.last_page > 8) {
      const lineStartLast: any[] = [];

      lineStartLast.push(makeButtonCallback("В начало", makeActionData(1)));

      if (metadata.current_page < metadata.last_page) {
        lineStartLast.push(makeButtonCallback("В конец", makeActionData(metadata.last_page)));
      }

      layoutButtons.push(lineStartLast);
    }

    return layoutButtons;
  }

  public static makeManualPaginateButtons(params: MakeManualPaginateButtonsParams): any[][] {
    let { callbackDataAction, currentPage, totalRecords, perPage, paramsQuery } = params;

    currentPage = parseInt(String(currentPage));
    const last_page = Math.ceil(totalRecords / perPage);

    if (last_page <= 1) return [];

    const makeActionData = (page: number): string => {
      const params = { ...paramsQuery, page: page.toString() };
      return `${callbackDataAction}[${new URLSearchParams(
        params as Record<string, string>
      ).toString()}]`;
    };

    const layoutButtons: any[][] = [];

    const makeButtonCallback = (text: string, callbackData: string): any => {
      return Markup.button.callback(text, callbackData);
    };

    // Pair buttons the start and end
    if (last_page > 1) {
      const lineFirstNext: any[] = [];

      if (currentPage > 1) {
        lineFirstNext.push(makeButtonCallback("⬅️ Назад", makeActionData(currentPage - 1)));
      }

      if (currentPage < last_page) {
        lineFirstNext.push(makeButtonCallback("Вперед ➡️", makeActionData(currentPage + 1)));
      }

      layoutButtons.push(lineFirstNext);
    }

    const generatorPageNumber = (startPage: number, lastPage: number): any[] => {
      const buttons: any[] = [];

      for (let i = startPage, c = 1; i <= lastPage && c <= 8; i++, c++) {
        let btn = makeButtonCallback(`${i}`, makeActionData(i));

        if (i == currentPage) {
          btn = makeButtonCallback(`\u{2714} ${i}`, makeActionData(currentPage));
        }

        buttons.push(btn);

        if (startPage + c > last_page) break;
      }

      return buttons;
    };

    // Page numbers a generator
    if (last_page > 8) {
      let startPage = 0;
      let lastPage = 0;

      if (currentPage < 8) {
        startPage = 1;
        lastPage = 8;
      } else {
        startPage = currentPage - 3;
        lastPage = currentPage + 4;
      }

      layoutButtons.push(generatorPageNumber(startPage, lastPage));
    } else {
      layoutButtons.push(generatorPageNumber(1, last_page));
    }

    // Pair buttons the start and end
    if (currentPage > 1 && last_page > 8) {
      const lineStartLast: any[] = [];

      lineStartLast.push(makeButtonCallback("В начало", makeActionData(1)));

      if (currentPage < last_page) {
        lineStartLast.push(makeButtonCallback("В конец", makeActionData(last_page)));
      }

      layoutButtons.push(lineStartLast);
    }

    return layoutButtons;
  }

  isRepeatedQuery(objParamsNeedle: Record<string, any>): boolean {
    if (!this.callbackParams) return false;

    const isEquals = Object.keys(objParamsNeedle)
      .map((key) => [key, objParamsNeedle[key]])
      .every((entry) => {
        return this.callbackParams?.get(entry[0]) == entry[1];
      });

    return isEquals;
  }

  async setupKeyboard(): Promise<void> {
    if (this.ctx.userSession.setupKeyboardDone) return;

    await this.newMessage("Welcome!")
      .keyboard({
        keyboard: this.mainMenuKeyboardArray,
        resize_keyboard: true,
        one_time_keyboard: true,
      })
      .send();

    this.ctx.userSession.setupKeyboardDone = true;
  }

  async getSetting(name: string): Promise<any> {
    try {
      const allSettings = await (global as any).settings;

      return allSettings.data[name];
    } catch (err) {
      throw err;
    }
  }

  cancelUserWaitingReply(): boolean {
    if (this.callbackParams?.has("cancel_wait")) {
      // Очищаем состояние ожидания ввода
      if (this.ctx.userSession.awaitingInput) {
        delete this.ctx.userSession.awaitingInput;
      }

      if (this.ctx.userSession.awaitingInputPromise) {
        // Отклоняем Promise с сообщением об отмене
        this.ctx.userSession.awaitingInputPromise.reject(new Error("Ввод отменен пользователем"));
        delete this.ctx.userSession.awaitingInputPromise;
      }

      return true;
    }

    return false;
  }

  backInlineButtion(data: string): any {
    return this.markup.button.callback(this.labelBack, data);
  }

  inlineButton(text: string, data: string): any {
    return this.markup.button.callback(text, data);
  }

  setCallbackParams(params: URLSearchParams): this {
    this.callbackParams = params;
    return this;
  }

  existsAnswerInput(inputKey: string): boolean {
    return this.ctx.userSession[inputKey] !== undefined;
  }

  getAnswerInput(inputKey: string): any {
    return this.ctx.userSession[inputKey];
  }

  setAnswerInput(inputKey: string, value: any): void {
    this.ctx.userSession[inputKey] = value;
  }

  makeQueryParams(...args: any[]): URLSearchParams {
    const params = new URLSearchParams();

    args.forEach((arg) => {
      if (typeof arg === "string") {
        new URLSearchParams(arg).forEach((value, key) => {
          params.set(key, value);
        });
      }
      if (arg !== null && typeof arg === "object") {
        this.app.debugLog("arg", arg);
        for (const [key, value] of Object.entries(arg)) {
          params.set(key, String(value));
        }
      }
    });

    return params;
  }

  makeInlineKeyboard(buttons: any[][]): InlineKeyboard {
    const keyboard = InlineKeyboard.init(this.ctx);
    buttons.forEach((row) => {
      keyboard.append(row);
    });
    return keyboard;
  }

  makeInlineButton(text: string, data: string): any {
    return Markup.button.callback(text, data);
  }

  message(message: string): Message2byte {
    if (this.route.runIsCallbackQuery) {
      return this.updateMessage(message);
    }
    return Message2byte.init(this.ctx, this).message(message);
  }

  newMessage(message: string): Message2byte {
    return Message2byte.init(this.ctx, this).message(message);
  }

  updateMessage(message: string): Message2byte {
    return Message2byte.init(this.ctx, this).updateMessage(message);
  }

  createPoolNewMessage(message: string): Message2bytePool {
    return Message2byte.init(this.ctx, this).createPoolMessage(message);
  }

  createUpdatePoolMessage(message: string): Message2bytePool {
    return Message2byte.init(this.ctx, this).createUpdatePoolMessage(message);
  }

  createPoolMessage(message: string): Message2bytePool {
    return this.route.runIsCallbackQuery
      ? this.createUpdatePoolMessage(message)
      : this.createPoolNewMessage(message);
  }

  getCtx(): Telegraf2byteContext {
    return this.ctx;
  }

  getCurrentSection(): RunnedSection {
    return this.app.getRunnedSection(this.ctx.user);
  }

  getPreviousSection(): RunnedSection | undefined {
    return this.ctx.userSession.previousSection;
  }

  async sleepProgressBar(messageWait: string, ms: number): Promise<void> {
      const { promise, resolve, reject } = Promise.withResolvers<void>();
      const pgIcons = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

      let pgIndex = 0;
      message += `[pg]${pgIcons[pgIndex]} ${message}`;

      const pgIntervalTimer = setInterval(() => {
        // Update progress message here
        message = message.replace(/\[pg\].*/, `[pg]${pgIcons[pgIndex]} ${messageWait}`);
        pgIndex = (pgIndex + 1) % pgIcons.length;

        this.message(message)
          .send()
          .catch((err) => {
            clearInterval(pgIntervalTimer);
            reject(err);
          });
      }, 1000);
      setTimeout(() => {
        message = message.replace(/\[pg\].*/, ``);
        clearInterval(pgIntervalTimer);
        resolve();
      }, ms);
      return promise;
    };
}
