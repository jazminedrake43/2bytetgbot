import { TelegrafContextCustom } from './Telegraf2byteContext';
import { Section } from './Section';
import { ComponentOptions } from '../types';

export class SectionComponent {
  static readonly TYPE_SYNC = 'sync';
  static readonly TYPE_PENDINGS = 'pendings';
  static readonly STATUS_PROCESSED = 'processed';
  static readonly STATUS_PENDING = 'pending';

  protected _ctx: TelegrafContextCustom;
  protected _app: any; // App instance
  protected _section: Section;

  protected _type: string = SectionComponent.TYPE_SYNC;
  protected _status: string = SectionComponent.STATUS_PROCESSED;

  protected _name: string = 'SectionComponent';
  protected _actions: Record<string, string> = {};
  protected _isCallbackQuery: boolean = true;

  constructor(options: ComponentOptions) {
    this._ctx = options.ctx;
    this._app = options.app;
    this._section = options.section;
  }

  static init(options: ComponentOptions): SectionComponent {
    return new this(options);
  }

  async default(): Promise<{ text: string, [key: string]: any }> {
    return { text: 'Section component' };
  }

  async run(): Promise<any> {
    // this._app.registerComponent(this);

    switch (this._type) {
      case SectionComponent.TYPE_PENDINGS:
        break;

      default: 
        return this.default();
    }
    return this;
  }

  get name(): string {
    return this._name;
  }

  get actions(): Record<string, string> {
    return this._actions;
  }

  get type(): string {
    return this._type;
  }

  get status(): string {
    return this._status;
  }
}
