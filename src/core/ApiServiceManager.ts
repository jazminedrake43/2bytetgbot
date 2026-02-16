import { App } from "./App";
import { ApiService } from "./ApiService";
import { readdirSync } from "fs";

export class ApiServiceManager {
  private services: Map<string, ApiService> = new Map();

  constructor(private app: App) {}

  static init(app: App): ApiServiceManager {
    return new ApiServiceManager(app);
  }

  async loadServicesFromDirectory(pathDirectory: string): Promise<void> {
    for (const entry of readdirSync(pathDirectory, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".ts")) {
        const serviceModule = await import(`${pathDirectory}/${entry.name}`);
        const ServiceClass = serviceModule.default;
        const serviceInstance = new ServiceClass(this.app);
        this.registerService(entry.name.replace(".ts", ""), serviceInstance);
      }
    }
  }

  public registerService(name: string, service: ApiService): void {
    this.services.set(name, service);
  }

  public getService(name: string): ApiService | undefined {
    return this.services.get(name);
  }

  public async setupService(name: string): Promise<void> {
    const service = this.getService(name);
    if (service) {
      await service.setup();
    }
  }

  public async unsetupService(name: string): Promise<void> {
    const service = this.getService(name);
    if (service) {
      await service.unsetup();
    }
  }

  public async runService(name: string): Promise<void> {
    const service = this.getService(name);
    if (service) {
      await service.run();
    }
  }

  public async runAllServices(): Promise<void> {
    for (const [name, service] of this.services) {
      this.app.debugLog(`Running API service: ${name}`);
      await service.run();
      this.app.debugLog(`API service run completed: ${name}`);
    }
  }

  public getAll(): Map<string, ApiService> {
    return this.services;
  }

  public async setupAllServices(): Promise<void> {
    for (const [name, service] of this.services) {
      this.app.debugLog(`Setting up API service: ${name}`);
      await this.setupService(name);
      this.app.debugLog(`API service setup completed: ${name}`);
    }
  }

  public async unsetupAllServices(): Promise<void> {
    for (const [name, service] of this.services) {
      await this.unsetupService(name);
    }
  }
}
