import { App } from "./App";

export abstract class ApiService {

    constructor(
        protected app: App,
        public name: string
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
}