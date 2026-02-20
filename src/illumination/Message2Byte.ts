import { Telegraf2byteContext } from "./Telegraf2byteContext";
import { Input, Markup } from "telegraf";
import type { ReplyKeyboardMarkup } from "telegraf/core/types/telegram";
import { InlineKeyboard } from "./InlineKeyboard";
import { RequestInputOptions } from "../types";
import { Message } from "telegraf/types";
import Message2bytePool from "./Message2bytePool";
import { Section } from "./Section";

export default class Message2byte {
  public messageValue: string = "";
  public messageExtra: any = {};
  public isUpdate: boolean = false;
  private ctx: Telegraf2byteContext;
  private imagePath: string | null = null;
  private imageCaption: string | null = null;
  private messageId: number | null = null;
  private doAnswerCbQuery: boolean = true;
  private section: Section;

  constructor(ctx: Telegraf2byteContext, section: Section) {
    this.ctx = ctx;
    this.section = section;
  }

  static init(ctx: Telegraf2byteContext, section: Section) {
    return new Message2byte(ctx, section);
  }

  setNotAnswerCbQuery(): this {
    this.doAnswerCbQuery = false;
    return this;
  }

  message(message: string): this {
    this.messageValue = message;
    return this;
  }

  createPoolMessage(message: string): Message2bytePool {
    this.doAnswerCbQuery = false;
    this.messageValue = message;
    return Message2bytePool.init(this, this.ctx, this.section);
  }

  createUpdatePoolMessage(message: string): Message2bytePool {
    this.isUpdate = true;
    this.messageValue = message;
    return Message2bytePool.init(this, this.ctx, this.section);
  }

  updateMessage(message: string): this {
    this.messageValue = message;
    this.isUpdate = true;
    this.messageExtra.message_id &&= this.messageId;
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

  keyboard(keyboard: ReplyKeyboardMarkup): this {
    this.messageExtra.reply_markup = {
      keyboard: keyboard.keyboard,
      resize_keyboard: keyboard.resize_keyboard,
      one_time_keyboard: keyboard.one_time_keyboard,
    };
    return this;
  }

  inlineKeyboard(keyboard: any[][] | InlineKeyboard) {
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

  editMessageCaption(message: string, extra: any = {}) {
    return this.ctx.editMessageCaption(message, extra);
  }

  editMessageText(message: string, extra: any = {}) {
    return this.ctx.editMessageText(message, extra);
  }

  async send() {
    // console.log("Sending message:", this.messageValue, ' Extra:', this.messageExtra, 'IsUpdate:', this.isUpdate);
    if (this.isUpdate) {
      if (this.section.route.runIsCallbackQuery && this.doAnswerCbQuery) {
        await this.ctx.answerCbQuery();
      }

      const message = this.ctx.callbackQuery?.message as Message;

      if (message) {
        if ("media_group_id" in message || "caption" in message) {
          const editMessageCaption = this.editMessageCaption(this.messageValue, this.messageExtra);
          
          if (editMessageCaption && "message_id" in editMessageCaption) {
            this.messageId = editMessageCaption.message_id as number;
          }

          return editMessageCaption;
        } else {
          const editedText = this.editMessageText(this.messageValue, this.messageExtra);

          if (editedText && "message_id" in editedText) {
            // this.messageId = editedText.message_id as number;
          }

          return editedText;
        }
      } else {
        // this.messageExtra.message_id = this.messageId;

        try {
          const messageEntity = await this.editMessageText(this.messageValue, this.messageExtra);

          if (typeof messageEntity === "object" && "message_id" in messageEntity) {
            this.messageId = messageEntity.message_id as number;
          }

          return messageEntity;
        } catch (e) {}
      }
    }

    if (this.imagePath) {
      return this.ctx.replyWithPhoto(Input.fromLocalFile(this.imagePath), this.messageExtra);
    }

    const replyEntity = this.ctx.reply(this.messageValue, this.messageExtra);

    // this.messageId = (await replyEntity).message_id;

    return replyEntity;
  }

  sendReturnThis(): this {
    this.send();
    return this;
  }

  setMessageId(messageId: number): this {
    this.messageId = messageId;
    this.messageExtra.message_id = messageId;
    return this;
  }
}
