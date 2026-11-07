declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    prepare(source: string): {
      get(...args: unknown[]): unknown;
    };
    close(): void;
  }
}
