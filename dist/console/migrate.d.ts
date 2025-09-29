#!/usr/bin/env bun
type setupParams = {
    pathDatabase?: string;
    pathMigrations?: string;
};
export declare const setupMigrations: (params: setupParams) => Promise<void>;
export {};
