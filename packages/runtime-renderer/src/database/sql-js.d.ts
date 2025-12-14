/**
 * sql.js 类型声明
 * 
 * sql.js 是 SQLite 编译到 WebAssembly 的版本
 */

export interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => Database;
}

export interface Database {
  run(sql: string, params?: unknown[]): Database;
  exec(sql: string): QueryExecResult[];
  each(sql: string, params: unknown[], callback: (row: unknown) => void, done: () => void): Database;
  prepare(sql: string): Statement;
  export(): Uint8Array;
  close(): void;
  getRowsModified(): number;
}

export interface Statement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getAsObject(params?: unknown): Record<string, unknown>;
  get(params?: unknown[]): unknown[];
  getColumnNames(): string[];
  free(): boolean;
  run(params?: unknown[]): void;
  reset(): void;
}

export interface QueryExecResult {
  columns: string[];
  values: unknown[][];
}

export interface SqlJsConfig {
  locateFile?: (file: string) => string;
}

