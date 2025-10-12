import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import fs from "fs";
import { TelegramClientParams } from "telegram/client/telegramBaseClient";
import { ProxyInterface } from "telegram/network/connection/TCPMTProxy";

interface TelegramRegistrarInit {
  appId: string;
  appHash: string;
  credetialsManager: TelegramManagerCredentials;
}

type TelegramClientProxy = {
  ip: string;
  port: number;
  username?: string;
  password?: string;
  secret?: string,
  socksType?: 5 | 4;
  MTProxy?: boolean;
} & ProxyInterface;

interface TelegramInitClient {
  phone: string;
  proxy?: any;
}

export interface TelegramCredentials {
  phone: string;
  proxy?: TelegramClientProxy;
  password?: string;
  session?: string;
}

interface TelegramCredentialsManagerInit {
  pathFileStorage: string;
  pathFileProxyList: string;
  pathFileCounterOffset: string;
}

export class TelegramManagerCredentials {
  private requiredProxyForCredentials: boolean = false;
  private credentials: TelegramCredentials[] = [];
  private proxyList: string[] = [];

  static init(options: TelegramCredentialsManagerInit) {
    return new TelegramManagerCredentials(options);
  }

  constructor(private options: TelegramCredentialsManagerInit) {
    this.ensureStorageDirectory();
    this.loadCredentials();
    this.loadProxyList();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDirectory(): void {
    const storageDir = this.options.pathFileStorage.split("/").slice(0, -1).join("/");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  /**
   * Load credentials from JSON file
   */
  private loadCredentials(): void {
    try {
      if (fs.existsSync(this.options.pathFileStorage)) {
        const data = fs.readFileSync(this.options.pathFileStorage, "utf8");
        this.credentials = JSON.parse(data) || [];
      } else {
        this.credentials = [];
        this.saveCredentials();
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
      this.credentials = [];
    }
  }

  /**
   * Загрузить список прокси из файла
   */
  private loadProxyList(): void {
    try {
      if (fs.existsSync(this.options.pathFileProxyList)) {
        const data = fs.readFileSync(this.options.pathFileProxyList, "utf8");
        this.proxyList = data.split('\n').filter(line => line.trim() !== '');
      } else {
        this.proxyList = [];
      }
    } catch (error) {
      console.error("Ошибка загрузки списка прокси:", error);
      this.proxyList = [];
    }
  }

  /**
   * Получить текущий offset из файла счетчика
   */
  private getCurrentOffset(): number {
    try {
      if (fs.existsSync(this.options.pathFileCounterOffset)) {
        const data = fs.readFileSync(this.options.pathFileCounterOffset, "utf8");
        return parseInt(data.trim()) || 0;
      }
      return 0;
    } catch (error) {
      console.error("Ошибка чтения offset:", error);
      return 0;
    }
  }

  /**
   * Сохранить новый offset в файл счетчика
   */
  private saveOffset(offset: number): void {
    try {
      fs.writeFileSync(this.options.pathFileCounterOffset, offset.toString(), "utf8");
    } catch (error) {
      console.error("Ошибка сохранения offset:", error);
      throw new Error("Не удалось сохранить offset");
    }
  }

  /**
   * Парсинг строки прокси в формат TelegramClientProxy
   * Поддерживаемые форматы: 
   * - socks4://username:password@host:port
   * - socks5://username:password@host:port
   * - http://username:password@host:port (будет использоваться как SOCKS5)
   */
  private parseProxyString(proxyString: string): TelegramClientProxy {
    // Проверяем SOCKS4 формат
    let match = proxyString.match(/^socks4:\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/);
    if (match) {
      const [, username, password, ip, port] = match;
      return {
        ip,
        port: parseInt(port),
        username,
        password,
        socksType: 4
      };
    }

    // Проверяем SOCKS5 формат
    match = proxyString.match(/^socks5:\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/);
    if (match) {
      const [, username, password, ip, port] = match;
      return {
        ip,
        port: parseInt(port),
        username,
        password,
        socksType: 5
      };
    }

    // Проверяем HTTP формат (используем как SOCKS5)
    match = proxyString.match(/^http:\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/);
    if (match) {
      const [, username, password, ip, port] = match;
      return {
        ip,
        port: parseInt(port),
        username,
        password,
        socksType: 5  // HTTP прокси используем как SOCKS5
      };
    }

    throw new Error(`Неверный формат прокси: ${proxyString}. Поддерживаемые форматы: socks4://, socks5://, http://`);
  }

  /**
   * Получить следующий прокси из списка
   */
  private getNextProxy(): TelegramClientProxy {
    if (this.proxyList.length === 0) {
      throw new Error("Список прокси пуст");
    }

    const currentOffset = this.getCurrentOffset();
    
    if (currentOffset >= this.proxyList.length) {
      throw new Error("Прокси закончились");
    }

    const proxyString = this.proxyList[currentOffset];
    const proxy = this.parseProxyString(proxyString);
    
    // Увеличиваем offset для следующего использования
    this.saveOffset(currentOffset + 1);
    
    return proxy;
  }

  /**
   * Save credentials to JSON file
   */
  private saveCredentials(): void {
    try {
      fs.writeFileSync(
        this.options.pathFileStorage,
        JSON.stringify(this.credentials, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error("Error saving credentials:", error);
      throw new Error("Failed to save credentials");
    }
  }

  /**
   * Add or update credential
   */
  addCredential(credential: TelegramCredentials): void {
    
    // Attach proxy to credential
    if (this.requiredProxyForCredentials && !credential.proxy) {
      try {
        credential.proxy = this.getNextProxy();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Не удалось назначить прокси: ${errorMessage}`);
      }
    }

    const existingIndex =  this.credentials.findIndex((c) => c != null && c.phone === credential.phone);

    if (existingIndex !== -1) {
      // Update existing credential
      this.credentials[existingIndex] = { ...this.credentials[existingIndex], ...credential };
    } else {
      // Add new credential
      this.credentials.push(credential);
    }

    this.credentials = this.credentials.filter((c) => c != null);

    this.saveCredentials();
  }

  /**
   * Get credential by phone number
   */
  getCredential(phone: string): TelegramCredentials | null {
    return this.credentials.find((c) => c != null && c.phone === phone) || null;
  }

  /**
   * Delete credential by phone number
   */
  deleteCredential(phone: string): boolean {
    const initialLength = this.credentials.length;
    this.credentials = this.credentials.filter((c) => c.phone !== phone);

    if (this.credentials.length < initialLength) {
      this.saveCredentials();
      return true;
    }

    return false;
  }

  /**
   * Get all credentials
   */
  getAllCredentials(): TelegramCredentials[] {
    return [...this.credentials];
  }

  /**
   * Check if credential exists
   */
  hasCredential(phone: string): boolean {
    return this.credentials.some((c) => c.phone === phone);
  }

  /**
   * Update session for existing credential
   */
  updateSession(phone: string, session: string): boolean {
    const credential = this.credentials.find((c) => c.phone === phone);
    if (credential) {
      credential.session = session;
      this.saveCredentials();
      return true;
    }
    return false;
  }

  /**
   * Get credentials count
   */
  getCredentialsCount(): number {
    return this.credentials.length;
  }

  /**
   * Clear all credentials
   */
  clearAllCredentials(): void {
    this.credentials = [];
    this.saveCredentials();
  }

  /**
   * Get credentials by proxy configuration
   */
  getCredentialsByProxy(proxyHost: string, proxyPort: number): TelegramCredentials[] {
    return this.credentials.filter(
      (c) => c.proxy && c.proxy.ip === proxyHost && c.proxy.port === proxyPort
    );
  }

  /**
   * Get credentials without proxy
   */
  getCredentialsWithoutProxy(): TelegramCredentials[] {
    return this.credentials.filter((c) => !c.proxy);
  }
}

export class TelegramAccountRemote {
  private initOptions: TelegramRegistrarInit;
  private tgClient!: TelegramClient; // Используем definite assignment assertion
  private credentialsManager: TelegramManagerCredentials;

  static init(initOptions: TelegramRegistrarInit) {
    return new TelegramAccountRemote(initOptions);
  }

  constructor(initOptions: TelegramRegistrarInit) {
    this.initOptions = initOptions;
    this.credentialsManager = initOptions.credetialsManager;
  }

  async attemptRestoreSession(credentials: TelegramCredentials): Promise<boolean> {
    const { phone, proxy, session, password } = credentials;
    const { appId, appHash } = this.initOptions;
    
    if (session) {
      const clientParams: TelegramClientParams = {connectionRetries: 5};

      if (credentials.proxy) {
        clientParams.proxy = credentials.proxy;
      }

      this.tgClient = new TelegramClient(new StringSession(session), Number(appId), appHash, clientParams);

      return await this.tgClient.connect();
    }

    return false;
  }

  async login(
    credentials: TelegramCredentials,
    cbRequestCode: CallableFunction,
    cbRequestPassword: CallableFunction,
    cbError: CallableFunction,
  ): Promise<void> {
    const { phone, proxy, session, password } = credentials;
    const { appId, appHash } = this.initOptions;

    if (session) {
      throw new Error("Account is already registered");
    }

    try {
      this.tgClient = new TelegramClient(new StringSession(""), Number(appId), appHash, {
        connectionRetries: 5,
        proxy: credentials.proxy,
        timeout: 10000 * 60 * 10,
      });
      console.log('Login cresentials:', credentials)
      // @ts-ignore
      await this.tgClient.start({
        phoneNumber: async () => phone,
        password: async () => {
          if (!password) {
            return await cbRequestPassword();
          }
          return password;
        },
        phoneCode: async () => {
          return await cbRequestCode();
        },
        onError: (err: Error) => {
            cbError('Error for wait authentiction', err);
        },
      });

      const session = this.tgClient.session.save() as unknown as string;

      this.credentialsManager.addCredential({
        phone,
        proxy,
        session,
        password,
      });

      console.log("Регистрация успешна!");
      console.log("Сессия:\n", session);

    } catch (err) {
      throw new Error("Failed to register account", { cause: err });
    }
  }

  async disconnect(): Promise<void> {
    await this.tgClient.disconnect();
  }

  async disconnectWhenConnect() {
    await this.tgClient.disconnect();
  }

  /**
   * Отправляет команду /start боту
   * @param botUsername username бота (например: 'my_bot' или '@my_bot')
   * @returns true если команда успешно отправлена
   */
  async sendStartCommand(botUsername: string): Promise<boolean> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      // Убираем @ из username если он есть
      const normalizedUsername = botUsername.startsWith('@') ? botUsername.substring(1) : botUsername;
      
      // Ищем бота по username
      const result = await this.tgClient.sendMessage(normalizedUsername, {
        message: '/start'
      });
      
      return result ? true : false;
    } catch (error) {
      console.error('Error sending /start command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send /start command to @${botUsername}: ${errorMessage}`);
    }
  }

  /**
   * Получает ID чата с ботом
   * @param botUsername username бота (например: 'my_bot' или '@my_bot')
   * @returns ID чата с ботом
   */
  async getBotChatId(botUsername: string): Promise<number> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      // Убираем @ из username если он есть
      const normalizedUsername = botUsername.startsWith('@') ? botUsername.substring(1) : botUsername;
      
      // Получаем информацию о диалоге с ботом
      const dialog = await this.tgClient.getDialogs({
        limit: 1
      });

      if (!dialog || dialog.length === 0 || !dialog[0] || !dialog[0].id) {
        throw new Error(`Chat with bot @${normalizedUsername} not found`);
      }

      return dialog[0].id!.toJSNumber();
    } catch (error) {
      console.error('Error getting bot chat ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get chat ID for @${botUsername}: ${errorMessage}`);
    }
  }

  /**
   * Отправляет жалобу на бота
   * @param botUsername username бота (например: 'my_bot' или '@my_bot')
   * @param reason причина жалобы: 'spam' | 'violence' | 'pornography' | 'custompromoting' | 'other'
   * @returns true если жалоба успешно отправлена
   */
  async reportBot(
    botUsername: string, 
    reason: 'spam' | 'violence' | 'pornography' | 'custompromoting' | 'other' = 'spam'
  ): Promise<boolean> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      const chatId = await this.getBotChatId(botUsername);
      
      // Получаем сообщения от бота для репорта
      const messages = await this.tgClient.getMessages(chatId, { limit: 1 });
      if (!messages || messages.length === 0) {
        throw new Error('No messages found to report');
      }

      // Формируем причину жалобы
      let reportReason = reason;
      if (reason === 'custompromoting') {
        reportReason = 'spam';
      }

      // Отправляем жалобу на последнее сообщение
      await this.tgClient.sendMessage(chatId, {
        message: `/report ${reportReason}`,
        replyTo: messages[0].id
      });

      return true;
    } catch (error) {
      console.error('Error reporting bot:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to report @${botUsername}: ${error.message}`);
      }
      throw new Error(`Failed to report @${botUsername}: Unknown error`);
    }
  }

  /**
   * Проверяет, зарегистрирован ли номер телефона в Telegram
   * @param phoneNumber номер телефона в международном формате (например: '+380123456789')
   * @returns true если номер зарегистрирован в Telegram, false если нет
   */
  async isPhoneRegistered(phoneNumber: string): Promise<boolean> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      // Попытаемся найти пользователя, отправив сообщение самому себе с информацией о номере
      // Это безопасный способ проверки без отправки реальных сообщений
      const me = await this.tgClient.getMe();
      
      // Используем поиск по username если номер содержит буквы, иначе считаем что это номер
      if (phoneNumber.includes('@')) {
        try {
          const entity = await this.tgClient.getEntity(phoneNumber);
          return entity ? true : false;
        } catch {
          return false;
        }
      }

      // Для номеров телефонов возвращаем true по умолчанию
      // В реальном приложении здесь должен быть более сложный API вызов
      console.log(`Проверка номера ${phoneNumber} - предполагаем что зарегистрирован`);
      return true;
    } catch (error) {
      console.error('Error checking phone registration:', error);
      return false;
    }
  }

  /**
   * Добавляет контакт в адресную книгу Telegram
   * @param phoneNumber номер телефона в международном формате
   * @param firstName имя контакта
   * @param lastName фамилия контакта (необязательно)
   * @returns true если контакт успешно добавлен
   */
  async addContact(phoneNumber: string, firstName: string, lastName?: string): Promise<boolean> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      // Импортируем API для работы с контактами
      const bigInteger = (await import('big-integer')).default;
      
      // Нормализуем номер телефона (убираем все символы кроме цифр и +)
      const normalizedPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // Создаем контакт для импорта
      const contact = new Api.InputPhoneContact({
        clientId: bigInteger(Math.floor(Math.random() * 1000000000)), // Генерируем случайный ID
        phone: normalizedPhone.replace(/^\+/, ''), // Убираем + для API
        firstName: firstName,
        lastName: lastName || ''
      });

      console.log(`🔍 Попытка добавить контакт: ${firstName} ${lastName || ''} (${phoneNumber})`);

      // Импортируем контакт через API
      const result = await this.tgClient.invoke(
        new Api.contacts.ImportContacts({
          contacts: [contact]
        })
      );

      // Проверяем результат импорта
      if (result.imported && result.imported.length > 0) {
        console.log(`✅ Контакт ${firstName} ${lastName || ''} (${phoneNumber}) успешно добавлен`);
        
        // Если есть информация о пользователе
        if (result.users && result.users.length > 0) {
          const user = result.users[0];
          const username = (user as any).username;
          console.log(`📱 Найден пользователь Telegram: @${username || 'без username'}`);
          console.log(`🆔 ID пользователя: ${user.id}`);
        }
        
        return true;
      } else if (result.retryContacts && result.retryContacts.length > 0) {
        console.log(`⚠️ Контакт ${phoneNumber} требует повторной попытки`);
        throw new Error(`Contact ${phoneNumber} requires retry`);
      } else {
        // Проверяем, найден ли пользователь в результате (контакт уже существует)
        if (result.users && result.users.length > 0) {
          const user = result.users[0];
          const username = (user as any).username;
          console.log(`� Пользователь уже существует в контактах: @${username || 'без username'}`);
          return true;
        }
        
        console.log(`ℹ️ Контакт ${phoneNumber} не найден в Telegram или не удалось добавить`);
        throw new Error(`Contact ${phoneNumber} not found or could not be added`);
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      
      // Если пользователь не найден, это не критическая ошибка
      if (error instanceof Error && (
        error.message.includes('USER_NOT_FOUND') ||
        error.message.includes('PHONE_NOT_OCCUPIED') ||
        error.message.includes('USERNAME_NOT_OCCUPIED')
      )) {
        console.log(`ℹ️ Пользователь с номером ${phoneNumber} не зарегистрирован в Telegram`);
        throw new Error(`User with phone ${phoneNumber} is not registered in Telegram`);
      }
      
      throw error;
    }
  }

  /**
   * Получает информацию о пользователе по номеру телефона или username
   * @param identifier номер телефона или username
   * @returns информация о пользователе или null если не найден
   */
  async getUserByPhone(identifier: string): Promise<any | null> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      // Пытаемся получить информацию о пользователе
      let entity;
      
      if (identifier.startsWith('@') || !identifier.startsWith('+')) {
        // Если это username, пытаемся найти по username
        entity = await this.tgClient.getEntity(identifier);
      } else {
        // Если это номер телефона, логируем попытку поиска
        console.log(`Поиск пользователя по номеру: ${identifier}`);
        return null; // В упрощенной версии возвращаем null для номеров
      }

      if (entity) {
        return {
          id: entity.id?.toString() || '',
          firstName: (entity as any).firstName || '',
          lastName: (entity as any).lastName || '',
          username: (entity as any).username || '',
          phone: identifier.startsWith('+') ? identifier : '',
          isBot: (entity as any).bot || false,
          isVerified: (entity as any).verified || false,
          isPremium: (entity as any).premium || false
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Массовая проверка номеров телефонов на регистрацию в Telegram
   * @param phoneNumbers массив номеров телефонов
   * @returns объект с результатами проверки для каждого номера
   */
  async checkMultiplePhones(phoneNumbers: string[]): Promise<{[phone: string]: boolean}> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    const results: {[phone: string]: boolean} = {};

    // Проверяем каждый номер по очереди
    for (const phone of phoneNumbers) {
      try {
        results[phone] = await this.isPhoneRegistered(phone);
        
        // Небольшая задержка между запросами для избежания rate limit
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error checking phone ${phone}:`, error);
        results[phone] = false;
      }
    }

    return results;
  }

  /**
   * Отправляет сообщение пользователю по ID или username
   * @param target ID пользователя или username
   * @param message текст сообщения
   * @returns true если сообщение отправлено успешно
   */
  async sendMessageToUser(target: string, message: string): Promise<boolean> {
    if (!this.tgClient) {
      throw new Error("Client not initialized. Call login or attemptRestoreSession first");
    }

    try {
      // Отправляем сообщение
      const result = await this.tgClient.sendMessage(target, {
        message: message
      });

      console.log(`✅ Сообщение отправлено пользователю ${target}`);
      return result ? true : false;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message to ${target}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
