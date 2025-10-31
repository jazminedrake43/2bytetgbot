import { Telegraf, Context } from 'telegraf';
import { Section } from './illumination/Section';
import { UserStore } from './user/UserStore';
import { Telegraf2byteContext } from './illumination/Telegraf2byteContext';
import { RunSectionRoute } from './illumination/RunSectionRoute';

export interface AppConfig {
  accessPublic: boolean;
  apiUrl: string | null;
  envConfig: EnvVars;
  botToken: string | null;
  telegrafConfigLaunch: Record<string, any> | null;
  settings: Record<string, any> | null;
  userStorage: UserStore | null;
  builderPromises: Promise<any>[];
  sections: SectionList;
  components: Record<string, string>;
  debug: boolean;
  devHotReloadSections: boolean;
  telegrafLog: boolean;
  mainMenuKeyboard: any[][];
  hears: Record<string, string>;
  terminateSigInt: boolean;
  terminateSigTerm: boolean;
  keepSectionInstances: boolean;
  botCwd: string;
}

export interface SectionOptions {
  ctx: Telegraf2byteContext;
  bot: Telegraf<Telegraf2byteContext>;
  app: any; // App instance,
  route: RunSectionRoute;
}

export interface RunnedSection {
  instance: Section;
  route: RunSectionRoute;
}

export interface UserAttributes {
  id?: number;
  user_refid?: number;
  tg_id: number;
  tg_username: string;
  tg_first_name: string;
  tg_last_name?: string;
  role: 'user' | 'admin';
  is_banned_by_user?: boolean;
  is_banned_by_admin?: boolean;
  bunned_reason?: string;
  language: string;
  updated_at: string;
  created_at: string; 
  [key: string]: any;
}

export interface FileValidationOptions {
  allowedTypes?: string[]; // ['image/jpeg', 'image/png', 'application/pdf']
  maxSize?: number; // в байтах
  minSize?: number; // в байтах
}

export interface RequestInputOptions {
  validator?: 'number' | 'phone' | 'code' | 'file' | ((value: string | any) => boolean | Promise<boolean>);
  errorMessage?: string;
  allowCancel?: boolean; // по умолчанию true
  cancelButtonText?: string; // текст кнопки отмены
  cancelAction?: string; // действие при отмене
  fileValidation?: FileValidationOptions; // опции для валидации файлов
  runSection?: RunSectionRoute;
}

export interface UserSession {
  previousSection?: RunnedSection;
  awaitingInput?: {
    key: string;
    validator?: 'number' | 'phone' | 'code' | 'file' | ((value: string | any) => boolean | Promise<boolean>);
    errorMessage: string;
    allowCancel: boolean;
    cancelButtonText?: string;
    cancelAction?: string;
    fileValidation?: FileValidationOptions;
    runSection?: RunSectionRoute;
    retryCount?: number; // счетчик попыток
  };
  awaitingInputPromise?: {
    key: string;
    validator?: 'number' | 'phone' | 'code' | 'file' | ((value: string | any) => boolean | Promise<boolean>);
    errorMessage: string;
    allowCancel: boolean;
    cancelButtonText?: string;
    cancelAction?: string;
    fileValidation?: FileValidationOptions;
    retryCount?: number;
    resolve: (value: string | any) => void;
    reject: (reason?: any) => void;
  };
  [key: string]: any;
}

export interface UserRegistrationData {
  user_refid?: number;
  tg_id: number;
  tg_username: string;
  tg_first_name: string;
  tg_last_name?: string;
  role: 'user' | 'admin';
  language: string;
}

export interface ComponentOptions {
  ctx: Telegraf2byteContext;
  app: any; // App instance
  section: Section;
}

export interface UserServiceAttributes {
  lastActive: Date;
  lastMessageIds: number[];
}

export interface UserAwaitingReply {
  answer: any;
  validator: ((text: string) => Promise<boolean>) | null;
  is_rejected: boolean;
  run: [Section, string] | null;
  type?: any;
}

export interface RunSectionRouteParams {
  section: string | null;
  method: string | null;
  methodArgs: any[] | null;
  callbackParams: URLSearchParams;
  runAsCallcackQuery: boolean;
  actionPath: string | null;
  hearsKey: string | null;
}

export type SectionEnabledList = string[]

export interface SectionEntityConfig {
  pathModule?: string;
}

export interface SectionList {
  [key: string]: SectionEntityConfig;
}

export interface EnvVars {
  BOT_TOKEN?: string;
  BOT_API_URL?: string;
  BOT_HOOK_DOMAIN?: string;
  BOT_HOOK_PORT?: string;
  BOT_HOOK_SECRET_TOKEN?: string;
  BOT_DEV_HOT_RELOAD_SECTIONS?: string;
  BOT_ACCESS?: 'private' | 'public';
  ACCESS_USERNAMES?: string; // comma separated usernames
  BOT_APP_API_PORT?: number;
  [key: string]: string | number |undefined;
}

export type ModelPaginateParams = {
  route: string;
  routeParams?: Record<string, any>;
  page: number;
  limit: number;
  whereSql: string;
  whereParams?: any[];
};

export type PaginateResult = {
  items: any[];
  paginateButtons: any[][];
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  currentPage: number;
};

export type MakeManualPaginateButtonsParams = {
  callbackDataAction: string;  
  paramsQuery: Record<string, any>;
  currentPage: number | string;
  totalRecords: number;
  perPage: number;
};