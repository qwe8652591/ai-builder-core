/**
 * 钩子上下文
 */
export interface HookContext<T = any> {
  entity?: T;
  action: 'create' | 'update' | 'delete' | 'read';
  [key: string]: any;
}

/**
 * 钩子系统接口
 */
export interface Hooks {
  before(action: string, handler: (ctx: HookContext) => Promise<void> | void): void;
  after(action: string, handler: (ctx: HookContext) => Promise<void> | void): void;
}

export declare const Hooks: Hooks;






