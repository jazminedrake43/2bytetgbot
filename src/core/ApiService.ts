import { App } from "./App";

export class ApiService<T = any> {

    public name: string = "ApiService";

    protected app!: App;

    constructor(
        public params: T = {} as T
    ) {}

    async setup(): Promise<void> {
        // Implement your API logic here
    }

    async unsetup(): Promise<void> {
        // Implement your API logic here
    }

    async run(): Promise<void> {
        // Implement your API logic here
    }

    public setApp(app: App): this {
        this.app = app;
        return this;
    }
}