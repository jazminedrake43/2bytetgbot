import { TelegrafContextCustom } from './Telegraf2byteContext';
import { Section } from './Section';
import { ComponentOptions } from '../types';
export declare class SectionComponent {
    static readonly TYPE_SYNC = "sync";
    static readonly TYPE_PENDINGS = "pendings";
    static readonly STATUS_PROCESSED = "processed";
    static readonly STATUS_PENDING = "pending";
    protected _ctx: TelegrafContextCustom;
    protected _app: any;
    protected _section: Section;
    protected _type: string;
    protected _status: string;
    protected _name: string;
    protected _actions: Record<string, string>;
    protected _isCallbackQuery: boolean;
    constructor(options: ComponentOptions);
    static init(options: ComponentOptions): SectionComponent;
    default(): Promise<{
        text: string;
        [key: string]: any;
    }>;
    run(): Promise<any>;
    get name(): string;
    get actions(): Record<string, string>;
    get type(): string;
    get status(): string;
}
