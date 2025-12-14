import { Hooks } from '@ai-builder/dsl';

type HookHandler<T> = (context: T) => Promise<void> | void;

export class HookRegistry implements Hooks {
  private beforeHooks = new Map<string, Set<HookHandler<any>>>();
  private afterHooks = new Map<string, Set<HookHandler<any>>>();

  before<T = any>(event: string, handler: (context: T) => Promise<void> | void): void {
    if (!this.beforeHooks.has(event)) {
      this.beforeHooks.set(event, new Set());
    }
    this.beforeHooks.get(event)!.add(handler);
  }

  after<T = any>(event: string, handler: (context: T) => Promise<void> | void): void {
    if (!this.afterHooks.has(event)) {
      this.afterHooks.set(event, new Set());
    }
    this.afterHooks.get(event)!.add(handler);
  }

  async executeBefore<T>(event: string, context: T): Promise<void> {
    const handlers = this.beforeHooks.get(event);
    if (handlers) {
      for (const handler of handlers) {
        await handler(context);
      }
    }
  }

  async executeAfter<T>(event: string, context: T): Promise<void> {
    const handlers = this.afterHooks.get(event);
    if (handlers) {
      for (const handler of handlers) {
        await handler(context);
      }
    }
  }

  // Singleton instance usually, but here we provide class and instance
  static global = new HookRegistry();
}






