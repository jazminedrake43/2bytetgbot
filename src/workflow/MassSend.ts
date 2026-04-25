
/** -------------------------------------------------------------------------
 * MassSends — client for MassSendApiService HTTP API
 *
 * Usage:
 *   const ms = new MassSends();                     // default http://localhost:3033
 *   const ms = new MassSends("http://host:4000");   // custom base URL
 * -------------------------------------------------------------------------*/

export interface MassSendBaseOptions {
  /** Specific Telegram user IDs to send to. Omit to send to ALL bot users. */
  userIds?: number[];
  /** Parse mode for message/caption text. */
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  /** Delay in ms between each message send. Default: 50ms */
  delay?: number;
}

export interface MassSendResponse {
  status: number;
  message?: string;
  error?: string;
}

export class MassSends {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3033") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  // ---------------------------------------------------------------------------
  // Low-level
  // ---------------------------------------------------------------------------

  /** Send a raw payload to POST /send */
  async sendRaw(payload: Record<string, unknown>): Promise<MassSendResponse> {
    const res = await fetch(`${this.baseUrl}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  // ---------------------------------------------------------------------------
  // Text
  // ---------------------------------------------------------------------------

  /**
   * Send a plain-text (or HTML/Markdown) message.
   * @example
   *   ms.sendText("Hello, world!", { parseMode: "HTML" });
   */
  sendText(message: string, opts: MassSendBaseOptions = {}): Promise<MassSendResponse> {
    return this.sendRaw({ type: "text", message, ...opts });
  }

  // ---------------------------------------------------------------------------
  // Photo
  // ---------------------------------------------------------------------------

  /**
   * Send a photo (Telegram file_id, HTTPS URL, or local file path).
   * @example
   *   ms.sendPhoto("AgACAgIAAxk...", "Check this out!", { userIds: [123] });
   */
  sendPhoto(
    media: string,
    caption?: string,
    opts: MassSendBaseOptions = {}
  ): Promise<MassSendResponse> {
    return this.sendRaw({ type: "photo", media, caption, ...opts });
  }

  // ---------------------------------------------------------------------------
  // Video
  // ---------------------------------------------------------------------------

  /**
   * Send a video file.
   * @param supportsStreaming  Mark video as streaming-ready.
   */
  sendVideo(
    media: string,
    caption?: string,
    opts: MassSendBaseOptions & { supportsStreaming?: boolean } = {}
  ): Promise<MassSendResponse> {
    return this.sendRaw({ type: "video", media, caption, ...opts });
  }

  // ---------------------------------------------------------------------------
  // Document
  // ---------------------------------------------------------------------------

  /**
   * Send a document / file.
   * @example
   *   ms.sendDocument("BQACAgIAAxk...", "Q1 report");
   */
  sendDocument(
    media: string,
    caption?: string,
    opts: MassSendBaseOptions = {}
  ): Promise<MassSendResponse> {
    return this.sendRaw({ type: "document", media, caption, ...opts });
  }

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------

  /**
   * Send an audio file (displayed as music in Telegram).
   */
  sendAudio(
    media: string,
    caption?: string,
    opts: MassSendBaseOptions & {
      duration?: number;
      performer?: string;
      title?: string;
    } = {}
  ): Promise<MassSendResponse> {
    return this.sendRaw({ type: "audio", media, caption, ...opts });
  }

  // ---------------------------------------------------------------------------
  // Animation (GIF)
  // ---------------------------------------------------------------------------

  /**
   * Send an animation / GIF.
   */
  sendAnimation(
    media: string,
    caption?: string,
    opts: MassSendBaseOptions = {}
  ): Promise<MassSendResponse> {
    return this.sendRaw({ type: "animation", media, caption, ...opts });
  }

  // ---------------------------------------------------------------------------
  // Voice
  // ---------------------------------------------------------------------------

  /**
   * Send a voice message (.ogg with OPUS codec).
   */
  sendVoice(
    media: string,
    caption?: string,
    opts: MassSendBaseOptions & { duration?: number } = {}
  ): Promise<MassSendResponse> {
    return this.sendRaw({ type: "voice", media, caption, ...opts });
  }
}

// ---------------------------------------------------------------------------
// CLI entry-point (bun run workflow/MassSends.ts)
// ---------------------------------------------------------------------------
if (import.meta.main) {
  const [, , typeArg, ...rest] = process.argv;
  const ms = new MassSends();

  if (!typeArg) {
    console.log(`
MassSends CLI
Usage: bun workflow/MassSends.ts <type> [args...]

Examples:
  bun workflow/MassSends.ts text "Hello everyone!"
  bun workflow/MassSends.ts photo <file_id> "Optional caption"
  bun workflow/MassSends.ts video <file_id> "Optional caption"
  bun workflow/MassSends.ts document <file_id>
  bun workflow/MassSends.ts audio <file_id>
  bun workflow/MassSends.ts animation <file_id>
  bun workflow/MassSends.ts voice <file_id>
`);
    process.exit(0);
  }

  let result: MassSendResponse;

  switch (typeArg) {
    case "text":
      result = await ms.sendText(rest[0] ?? "");
      break;
    case "photo":
      result = await ms.sendPhoto(rest[0] ?? "", rest[1]);
      break;
    case "video":
      result = await ms.sendVideo(rest[0] ?? "", rest[1]);
      break;
    case "document":
      result = await ms.sendDocument(rest[0] ?? "", rest[1]);
      break;
    case "audio":
      result = await ms.sendAudio(rest[0] ?? "", rest[1]);
      break;
    case "animation":
      result = await ms.sendAnimation(rest[0] ?? "", rest[1]);
      break;
    case "voice":
      result = await ms.sendVoice(rest[0] ?? "", rest[1]);
      break;
    default:
      console.error(`Unknown type: ${typeArg}`);
      process.exit(1);
  }

  console.log("Response:", result);
}