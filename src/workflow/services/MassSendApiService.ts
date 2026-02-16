import { ExtraReplyMessage } from "telegraf/typings/telegram-types";
import { ApiService } from "../../core/ApiService";
import { UserModel } from "../../user/UserModel";

export type MassSendApiParams = {
    port?: number;
};

export class MassSendApiService extends ApiService<MassSendApiParams> {
  public override name = "MassSendApiService";
  private bunServerInstance: any;

  public async setup(): Promise<void> {
    return Promise.resolve();
  }

  public async unsetup(): Promise<void> {
    return Promise.resolve();
  }

  public async run(): Promise<void> {
    this.bunServerInstance = Bun.serve({
      port: this.params.port || this.app.configApp.envConfig.BOT_APP_API_PORT || 3033,
      routes: {
        "/": async (req) => {
          const receivedData = (await req.json()) as {
            userIds?: number[];
            message?: string;
            extra?: ExtraReplyMessage;
          };
          this.app.debugLog("Received data for mass message:", receivedData);

          let userIds: number[] = [];
          let message: string = "Hello from MassSendApiService";

          if (receivedData && typeof receivedData == "object") {
            userIds = receivedData?.userIds || [];
            message = receivedData?.message || "Hello from MassSendApiService";
          
            this.sendMassMessage(userIds, message, receivedData.extra);
          }

          return Response.json({ status: 200, body: "Mass message sending initiated." });
        },
      },
    });

    this.app.debugLog(
      `MassSendApiService Bun server running at http://localhost:${this.bunServerInstance.port}/`
    );

    return Promise.resolve();
  }

  private async sendMassMessage(
    userIds: number[] = [],
    message: string,
    extra?: ExtraReplyMessage
  ): Promise<void> {
    if (userIds.length === 0) {
      if (!db) {
        throw new Error("Database connection is not established.");
      }

      UserModel.setDatabase(db);

      this.app.debugLog("Fetching all users for mass message...");
      const users = UserModel.getAll();

      this.app.debugLog("Fetched users for mass message:", users);

      if (users && users.length > 0) {
        for (const user of users) {
          this.app.debugLog(`Sending message to user ID: ${user.tgId} username: ${user.username}`);

          try {
            const extraOptions = extra || {};
            await this.app.bot.telegram.sendMessage(user.tgId, message, extraOptions);
            this.app.debugLog(`Message sent to user ID: ${user.tgId} username: ${user.username}`);
          } catch (error) {
            this.app.debugLog(
              `Sending message ${message} to user ID: ${user.tgId} username: ${user.username} failed`,
              error
            );
            this.app.debugLog(
              `Failed to send message to user ID: ${user.tgId} username: ${user.username}`,
              error
            );
          }
        }
      }
    }
  }
}
