import { existsSync, readFileSync } from "fs";
import { basename } from "path";
import { ApiService } from "../../core/ApiService";
import { UserModel } from "../../user/UserModel";

export type MassSendApiParams = {
  port?: number;
};

/** Supported mass-send message types */
export type MassSendType = "text" | "photo" | "video" | "document" | "audio" | "animation" | "voice";

/** Base fields common to all mass-send requests */
export interface MassSendBasePayload {
  /** Telegram user IDs to send to. Omit or pass empty array to send to ALL users. */
  userIds?: number[];
  /** Comma-separated list of tg_usernames to send to (resolves alongside userIds). */
  usernames?: string[];
  /** Parse mode for text / caption: "HTML" | "Markdown" | "MarkdownV2" */
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  /** Milliseconds delay between each message to avoid flood limits. Default: 50ms */
  delay?: number;
}

export interface MassSendTextPayload extends MassSendBasePayload {
  type: "text";
  message: string;
}

export interface MassSendPhotoPayload extends MassSendBasePayload {
  type: "photo";
  /** file_id, URL or local path accessible from the bot */
  media: string;
  caption?: string;
}

export interface MassSendVideoPayload extends MassSendBasePayload {
  type: "video";
  media: string;
  caption?: string;
  /** Send video without sound (as animation) */
  supportsStreaming?: boolean;
}

export interface MassSendDocumentPayload extends MassSendBasePayload {
  type: "document";
  media: string;
  caption?: string;
}

export interface MassSendAudioPayload extends MassSendBasePayload {
  type: "audio";
  media: string;
  caption?: string;
  /** Duration in seconds */
  duration?: number;
  performer?: string;
  title?: string;
}

export interface MassSendAnimationPayload extends MassSendBasePayload {
  type: "animation";
  media: string;
  caption?: string;
}

export interface MassSendVoicePayload extends MassSendBasePayload {
  type: "voice";
  media: string;
  caption?: string;
  duration?: number;
}

export type MassSendPayload =
  | MassSendTextPayload
  | MassSendPhotoPayload
  | MassSendVideoPayload
  | MassSendDocumentPayload
  | MassSendAudioPayload
  | MassSendAnimationPayload
  | MassSendVoicePayload;

// ---------------------------------------------------------------------------

export class MassSendApiService extends ApiService<MassSendApiParams> {
  public override name = "MassSendApiService";
  private bunServerInstance: any;

  public async setup(): Promise<void> {
    return Promise.resolve();
  }

  public async unsetup(): Promise<void> {
    if (this.bunServerInstance) {
      this.bunServerInstance.stop();
    }
    return Promise.resolve();
  }

  public async run(): Promise<void> {
    const port =
      this.params.port || this.app.configApp.envConfig.BOT_APP_API_PORT || 3033;

    this.bunServerInstance = Bun.serve({
      port,
      routes: {
        "/send": async (req) => {
          if (req.method !== "POST") {
            return Response.json({ status: 405, error: "Method Not Allowed" }, { status: 405 });
          }
          const payload = (await req.json()) as MassSendPayload;
          this.app.debugLog("MassSendApiService received payload:", payload);

          if (!payload || !payload.type) {
            return Response.json(
              { status: 400, error: 'Missing required field "type"' },
              { status: 400 }
            );
          }

          // fire-and-forget
          this.dispatch(payload);

          return Response.json({ status: 200, message: "Mass send initiated." });
        },

        // health-check
        "/": async () => Response.json({ status: 200, service: "MassSendApiService" }),
      },
    });

    this.app.debugLog(
      `MassSendApiService Bun server running at http://localhost:${this.bunServerInstance.port}/`
    );
    return Promise.resolve();
  }

  // ---------------------------------------------------------------------------
  // Internal dispatcher
  // ---------------------------------------------------------------------------

  private async dispatch(payload: MassSendPayload): Promise<void> {
    const chatIds = await this.resolveChatIds(payload);
    const delay = payload.delay ?? 50;

    for (const chatId of chatIds) {
      try {
        await this.sendOne(chatId, payload);
      } catch (error) {
        this.app.debugLog(`Failed to send to chatId ${chatId}:`, error);
      }
      if (delay > 0) await this.sleep(delay);
    }
  }

  /**
   * If `media` is a local file path that exists on disk, returns
   * `{ source: Buffer, filename }` so Telegraf uploads it.
   * Otherwise returns the string as-is (file_id or HTTPS URL).
   */
  private resolveMedia(media: string): string | { source: Buffer; filename: string } {
    const isPath = media.startsWith("/") || media.startsWith("./") || media.startsWith("../");
    if (isPath && existsSync(media)) {
      return { source: readFileSync(media), filename: basename(media) };
    }
    return media;
  }

  private async sendOne(chatId: number, payload: MassSendPayload): Promise<void> {
    const tg = this.app.bot.telegram;
    const parseMode = payload.parseMode;

    switch (payload.type) {
      case "text":
        await tg.sendMessage(chatId, payload.message, { parse_mode: parseMode });
        break;

      case "photo":
        await tg.sendPhoto(chatId, this.resolveMedia(payload.media) as any, {
          caption: payload.caption,
          parse_mode: parseMode,
        });
        break;

      case "video":
        await tg.sendVideo(chatId, this.resolveMedia(payload.media) as any, {
          caption: payload.caption,
          parse_mode: parseMode,
          supports_streaming: (payload as MassSendVideoPayload).supportsStreaming,
        });
        break;

      case "document":
        await tg.sendDocument(chatId, this.resolveMedia(payload.media) as any, {
          caption: payload.caption,
          parse_mode: parseMode,
        });
        break;

      case "audio":
        await tg.sendAudio(chatId, this.resolveMedia(payload.media) as any, {
          caption: payload.caption,
          parse_mode: parseMode,
          duration: (payload as MassSendAudioPayload).duration,
          performer: (payload as MassSendAudioPayload).performer,
          title: (payload as MassSendAudioPayload).title,
        });
        break;

      case "animation":
        await tg.sendAnimation(chatId, this.resolveMedia(payload.media) as any, {
          caption: payload.caption,
          parse_mode: parseMode,
        });
        break;

      case "voice":
        await tg.sendVoice(chatId, this.resolveMedia(payload.media) as any, {
          caption: payload.caption,
          parse_mode: parseMode,
          duration: (payload as MassSendVoicePayload).duration,
        });
        break;

      default:
        this.app.debugLog(`Unknown message type: ${(payload as any).type}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async resolveChatIds(payload: MassSendBasePayload): Promise<number[]> {
    const explicitIds: number[] = payload.userIds ?? [];

    if (explicitIds.length > 0) {
      return explicitIds;
    }

    // Fetch from DB
    if (!db) {
      throw new Error("Database connection is not established.");
    }
    UserModel.setDatabase(db);
    this.app.debugLog("Fetching all users for mass send...");
    const users = UserModel.getAll();
    return users.map((u) => u.tgId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
