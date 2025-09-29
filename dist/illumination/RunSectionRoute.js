"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSectionRoute = void 0;
class RunSectionRoute {
    constructor() {
        this.runParams = {
            section: null,
            method: null,
            methodArgs: null,
            callbackParams: new URLSearchParams(),
            runAsCallcackQuery: false,
            actionPath: null,
            hearsKey: null,
        };
    }
    section(sectionId) {
        this.runParams.section = sectionId;
        return this;
    }
    method(name = 'index', isRunCallbackQuery = false) {
        this.runParams.method = name;
        this.runParams.runAsCallcackQuery = isRunCallbackQuery;
        return this;
    }
    methodArgs(args) {
        this.runParams.methodArgs = args;
        return this;
    }
    callbackParams(actionPath, params) {
        this.runParams.callbackParams = new URLSearchParams(params);
        this.actionPath(actionPath);
        this.runParams.runAsCallcackQuery = true;
        return this;
    }
    actionPath(path) {
        this.runParams.actionPath = path;
        this.runParams.runAsCallcackQuery = true;
        return this;
    }
    hearsKey(key) {
        this.runParams.hearsKey = key;
        return this;
    }
    getMethod() {
        return this.runParams.method;
    }
    getSection() {
        return this.runParams.section;
    }
    getSectionId() {
        return this.runParams.section;
    }
    getCommand() {
        return this.runParams.method;
    }
    getSubCommand() {
        return this.runParams.method;
    }
    getActionPath() {
        return this.runParams.actionPath;
    }
    getCallbackParams() {
        return this.runParams.callbackParams;
    }
    getHearsKey() {
        return this.runParams.hearsKey;
    }
    get runIsCallbackQuery() {
        return this.runParams.runAsCallcackQuery;
    }
}
exports.RunSectionRoute = RunSectionRoute;
