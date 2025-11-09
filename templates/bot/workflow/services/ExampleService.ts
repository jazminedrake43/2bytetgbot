import { App } from "@2byte/tgbot-framework";
import { ApiService } from "@2byte/tgbot-framework";

export default class ExampleService extends ApiService {

    constructor(
        protected app: App,
        public name: string = "ExampleService"
    ) {
        super(app, name);
    }

    public async setup(): Promise<void> {
        return Promise.resolve();
    }

    public async unsetup(): Promise<void> {
        return Promise.resolve();
    }

    public async run(): Promise<void> {
        return Promise.resolve();
    }
}