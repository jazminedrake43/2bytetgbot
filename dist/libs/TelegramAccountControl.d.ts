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
    secret?: string;
    socksType?: 5 | 4;
    MTProxy?: boolean;
} & ProxyInterface;
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
export declare class TelegramManagerCredentials {
    private options;
    private requiredProxyForCredentials;
    private credentials;
    private proxyList;
    static init(options: TelegramCredentialsManagerInit): TelegramManagerCredentials;
    constructor(options: TelegramCredentialsManagerInit);
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory;
    /**
     * Load credentials from JSON file
     */
    private loadCredentials;
    /**
     * Загрузить список прокси из файла
     */
    private loadProxyList;
    /**
     * Получить текущий offset из файла счетчика
     */
    private getCurrentOffset;
    /**
     * Сохранить новый offset в файл счетчика
     */
    private saveOffset;
    /**
     * Парсинг строки прокси в формат TelegramClientProxy
     * Поддерживаемые форматы:
     * - socks4://username:password@host:port
     * - socks5://username:password@host:port
     * - http://username:password@host:port (будет использоваться как SOCKS5)
     */
    private parseProxyString;
    /**
     * Получить следующий прокси из списка
     */
    private getNextProxy;
    /**
     * Save credentials to JSON file
     */
    private saveCredentials;
    /**
     * Add or update credential
     */
    addCredential(credential: TelegramCredentials): void;
    /**
     * Get credential by phone number
     */
    getCredential(phone: string): TelegramCredentials | null;
    /**
     * Delete credential by phone number
     */
    deleteCredential(phone: string): boolean;
    /**
     * Get all credentials
     */
    getAllCredentials(): TelegramCredentials[];
    /**
     * Check if credential exists
     */
    hasCredential(phone: string): boolean;
    /**
     * Update session for existing credential
     */
    updateSession(phone: string, session: string): boolean;
    /**
     * Get credentials count
     */
    getCredentialsCount(): number;
    /**
     * Clear all credentials
     */
    clearAllCredentials(): void;
    /**
     * Get credentials by proxy configuration
     */
    getCredentialsByProxy(proxyHost: string, proxyPort: number): TelegramCredentials[];
    /**
     * Get credentials without proxy
     */
    getCredentialsWithoutProxy(): TelegramCredentials[];
}
export declare class TelegramAccountRemote {
    private initOptions;
    private tgClient;
    private credentialsManager;
    static init(initOptions: TelegramRegistrarInit): TelegramAccountRemote;
    constructor(initOptions: TelegramRegistrarInit);
    attemptRestoreSession(credentials: TelegramCredentials): Promise<boolean>;
    login(credentials: TelegramCredentials, cbRequestCode: CallableFunction, cbRequestPassword: CallableFunction, cbError: CallableFunction): Promise<void>;
    disconnect(): Promise<void>;
    disconnectWhenConnect(): Promise<void>;
    /**
     * Отправляет команду /start боту
     * @param botUsername username бота (например: 'my_bot' или '@my_bot')
     * @returns true если команда успешно отправлена
     */
    sendStartCommand(botUsername: string): Promise<boolean>;
    /**
     * Получает ID чата с ботом
     * @param botUsername username бота (например: 'my_bot' или '@my_bot')
     * @returns ID чата с ботом
     */
    getBotChatId(botUsername: string): Promise<number>;
    /**
     * Отправляет жалобу на бота
     * @param botUsername username бота (например: 'my_bot' или '@my_bot')
     * @param reason причина жалобы: 'spam' | 'violence' | 'pornography' | 'custompromoting' | 'other'
     * @returns true если жалоба успешно отправлена
     */
    reportBot(botUsername: string, reason?: 'spam' | 'violence' | 'pornography' | 'custompromoting' | 'other'): Promise<boolean>;
}
export {};
