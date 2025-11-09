import {
  TelegramManagerCredentialsDB,
  TelegramAccountRemote,
} from "../libs/TelegramAccountControl";
import { Model } from "../models/Model";
import Input from "input";

export const manualAdderTgAccount = async () => {
  const credentialsManager = new TelegramManagerCredentialsDB(Model.getConnection());

  const tgAccountControl = TelegramAccountRemote.init({
    appId: process.env.TG_APP_ID!,
    appHash: process.env.TG_APP_HASH!,
    credetialsManager: credentialsManager,
  });

  const phone = await Input.text("Введите номер телефона (с кодом страны, например, 79614416445):");
  
  await credentialsManager.addCredential({
    phone,
  });

  const credentials = await credentialsManager.getCredential(
    phone
  );

  if (!credentials) {
    console.log("Учётная запись с таким номером телефона не найдена.");
    return;
  }
  
  await tgAccountControl.login(
    credentials,
    async () => {
      console.log("Требуется код подтверждения");
      return await Input.text("Введите код подтверждения:");
    },
    async () => {
      console.log("Требуется пароль");
      return await Input.password("Введите пароль:");
    },
    async (err: any) => {
      console.log("Ошибка логина:", err);
      tgAccountControl.disconnect();
      throw new Error(err);
    }
  );

  tgAccountControl.disconnect();
};
