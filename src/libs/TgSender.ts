import {
  TelegramAccountRemote,
  TelegramManagerCredentials,
  TelegramCredentials,
} from "./TelegramAccountControl";

interface TgSenderParams {
  tgAppId: string;
  tgAppHash: string;
  app: any;
}

export class TgSender {
  private makeInstanceTgRemoteControl: () => {
    remoteControl: TelegramAccountRemote;
    credentialsManager: TelegramManagerCredentials;
  };

  static init(params: TgSenderParams) {
    return new TgSender(params);
  }

  constructor(private params: TgSenderParams) {
    this.makeInstanceTgRemoteControl = () => {
      const credentialsManager = TelegramManagerCredentials.init({
        pathFileStorage: path.join(__dirname, "../storage/tg_credentials.json"),
        pathFileProxyList: path.join(__dirname, "../storage/tg_proxy_list.txt"),
        pathFileCounterOffset: path.join(__dirname, "../storage/tg_counter_offset.txt"),
      });

      const remoteControl = TelegramAccountRemote.init({
        appId: params.tgAppId!,
        appHash: params.tgAppHash!,
        credetialsManager: credentialsManager,
      });

      return {
        remoteControl,
        credentialsManager,
      };
    };
  }

  fromRandomAccount() {
    return this;
  }

  fromAccountCredentials(credentials: TelegramCredentials) {
    return this;
  }

  sendMessageByPhone(phone: string, message: string) {}
}
