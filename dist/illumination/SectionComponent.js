"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionComponent = void 0;
class SectionComponent {
    constructor(options) {
        this._type = SectionComponent.TYPE_SYNC;
        this._status = SectionComponent.STATUS_PROCESSED;
        this._name = 'SectionComponent';
        this._actions = {};
        this._isCallbackQuery = true;
        this._ctx = options.ctx;
        this._app = options.app;
        this._section = options.section;
    }
    static init(options) {
        return new this(options);
    }
    async default() {
        return { text: 'Section component' };
    }
    async run() {
        // this._app.registerComponent(this);
        switch (this._type) {
            case SectionComponent.TYPE_PENDINGS:
                break;
            default:
                return this.default();
        }
        return this;
    }
    get name() {
        return this._name;
    }
    get actions() {
        return this._actions;
    }
    get type() {
        return this._type;
    }
    get status() {
        return this._status;
    }
}
exports.SectionComponent = SectionComponent;
SectionComponent.TYPE_SYNC = 'sync';
SectionComponent.TYPE_PENDINGS = 'pendings';
SectionComponent.STATUS_PROCESSED = 'processed';
SectionComponent.STATUS_PENDING = 'pending';
