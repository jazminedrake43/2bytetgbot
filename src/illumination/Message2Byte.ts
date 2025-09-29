import { Telegraf2byteContext } from "./Telegraf2byteContext";
import { Input, Markup } from "telegraf";
import { InlineKeyboard } from "./InlineKeyboard";
import { RequestInputOptions } from "../types";
import { Message } from "telegraf/types";

export default class Message2byte {
  public messageValue: string = "";
  public messageExtra: any = {};
  public isUpdate: boolean = false;
  private ctx: Telegraf2byteContext;
  private imagePath: string | null = null;
  private imageCaption: string | null = null;

  constructor(ctx: Telegraf2byteContext) {
    this.ctx = ctx;
  }

  static init(ctx: Telegraf2byteContext) {
    return new Message2byte(ctx);
  }

  message(message: string): this {
    this.messageValue = message;
    return this;
  }

  updateMessage(message: string): this {
    this.messageValue = message;
    this.isUpdate = true;
    return this;
  }

  markdown(): this {
    this.messageExtra.parse_mode = "markdown";
    return this;
  }

  html(): this {
    this.messageExtra.parse_mode = "html";
    return this;
  }

  extra(extra: Object): this {
    this.messageExtra = extra;
    return this;
  }

  inlineKeyboard(keyboard: [][] | InlineKeyboard) {
    let keyboardArray: any[][];

    if (keyboard instanceof InlineKeyboard) {
      keyboardArray = keyboard.valueOf();
    } else {
      keyboardArray = keyboard;
    }

    Object.assign(this.messageExtra, {
      ...Markup.inlineKeyboard(keyboardArray),
    });

    return this;
  }

  requestInput(inputKey: string, options: RequestInputOptions = {}): this {
    // Устанавливаем значения по умолчанию
    const allowCancel = options.allowCancel !== false; // по умолчанию true
    const cancelButtonText = options.cancelButtonText || "Отмена";
    const cancelAction = options.cancelAction || "home.index[cancel_wait=1]";

    // Если разрешена отмена, добавляем кнопку отмены к клавиатуре
    if (allowCancel && this.messageExtra && "reply_markup" in this.messageExtra) {
      const replyMarkup = (this.messageExtra as any).reply_markup;
      if (replyMarkup && replyMarkup.inline_keyboard) {
        // Добавляем кнопку отмены в начало клавиатуры
        replyMarkup.inline_keyboard.unshift([
          {
            text: `❌ ${cancelButtonText}`,
            callback_data: cancelAction,
          },
        ]);
      }
    }

    // Сохраняем информацию о запрашиваемом вводе в сессии пользователя
    this.ctx.userSession.awaitingInput = {
      key: inputKey,
      validator: options.validator,
      errorMessage: options.errorMessage || "Неверный формат ввода",
      allowCancel,
      cancelButtonText: `❌ ${cancelButtonText}`,
      cancelAction,
      fileValidation: options.fileValidation,
      runSection: options.runSection,
      retryCount: 0,
    };

    return this;
  }

  async requestInputWithAwait(
    inputKey: string,
    options: RequestInputOptions = {}
  ): Promise<string | any> {
    // Устанавливаем значения по умолчанию
    const allowCancel = options.allowCancel !== false; // по умолчанию true
    const cancelButtonText = options.cancelButtonText || "Отмена";
    const cancelAction = options.cancelAction || "home.index[cancel_wait=1]";

    // Если разрешена отмена, добавляем кнопку отмены к клавиатуре
    if (allowCancel && this.messageExtra && "reply_markup" in this.messageExtra) {
      const replyMarkup = (this.messageExtra as any).reply_markup;
      if (replyMarkup && replyMarkup.inline_keyboard) {
        // Добавляем кнопку отмены в начало клавиатуры
        replyMarkup.inline_keyboard.unshift([
          {
            text: `❌ ${cancelButtonText}`,
            callback_data: cancelAction,
          },
        ]);
      }
    }

    // Отправляем сообщение
    await this.send();

    // Возвращаем Promise, который будет разрешен когда пользователь введет данные
    return new Promise((resolve, reject) => {
      this.ctx.userSession.awaitingInputPromise = {
        key: inputKey,
        validator: options.validator,
        errorMessage: options.errorMessage || "Неверный формат ввода",
        allowCancel,
        cancelButtonText: `❌ ${cancelButtonText}`,
        cancelAction,
        fileValidation: options.fileValidation,
        retryCount: 0,
        resolve,
        reject,
      };
    });
  }

  image(pathImage: string): this {
    this.imagePath = pathImage;
    this.imageCaption = this.messageValue;
    this.messageExtra.caption = this.imageCaption;
    return this;
  }

  async send() {
    if (this.isUpdate) {
      await this.ctx.answerCbQuery();

      const message = this.ctx.callbackQuery?.message as Message;

      if (message) {
        if ('media_group_id' in message || 'caption' in message) {
          return this.ctx.editMessageCaption(this.messageValue, this.messageExtra);
        } else {
          return this.ctx.editMessageText(this.messageValue, this.messageExtra);
        }
      }
    }

    if (this.imagePath) {
      return this.ctx.replyWithPhoto(Input.fromLocalFile(this.imagePath), this.messageExtra);
    }

    return this.ctx.reply(this.messageValue, this.messageExtra);
  }
}
