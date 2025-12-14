import { SecurityContext } from '@ai-builder/dsl';

interface ContextData {
  userId?: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

/**
 * 浏览器兼容的 AsyncLocalStorage 替代实现
 * 在浏览器中使用简单的 stack 存储
 */
interface ContextStorage<T> {
  run<R>(context: T, callback: () => R): R;
  enterWith(context: T): void;
  getStore(): T | undefined;
}

// 检测是否在浏览器环境
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * 创建上下文存储
 * - Node.js 环境使用 AsyncLocalStorage
 * - 浏览器环境使用简单的 stack
 */
function createContextStorage<T>(): ContextStorage<T> {
  if (isBrowser) {
    // 浏览器环境：使用简单的 stack
    let currentContext: T | undefined = undefined;
    const contextStack: T[] = [];
    
    return {
      run<R>(context: T, callback: () => R): R {
        contextStack.push(context);
        currentContext = context;
        try {
          return callback();
        } finally {
          contextStack.pop();
          currentContext = contextStack[contextStack.length - 1];
        }
      },
      enterWith(context: T): void {
        contextStack.push(context);
        currentContext = context;
      },
      getStore(): T | undefined {
        return currentContext;
      }
    };
  } else {
    // Node.js 环境：动态导入 AsyncLocalStorage
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AsyncLocalStorage } = require('async_hooks') as { AsyncLocalStorage: new<T>() => ContextStorage<T> };
    return new AsyncLocalStorage();
  }
}

export class ThreadLocalSecurityContext implements SecurityContext {
  private static storage = createContextStorage<ContextData>();

  // Method to run code within context (Simulatable API)
  static run<T>(context: ContextData, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  // Method to enter context (for test setups)
  static enter(context: ContextData): void {
    this.storage.enterWith(context);
  }

  getUserId(): string {
    const store = ThreadLocalSecurityContext.storage.getStore();
    if (!store?.userId) {
      throw new Error('SecurityContext: No user logged in');
    }
    return store.userId;
  }

  getUserIdOrNull(): string | null {
    const store = ThreadLocalSecurityContext.storage.getStore();
    return store?.userId || null;
  }

  getTenantId(): string {
    const store = ThreadLocalSecurityContext.storage.getStore();
    return store?.tenantId || '';
  }

  getRoles(): string[] {
    const store = ThreadLocalSecurityContext.storage.getStore();
    return store?.roles || [];
  }

  hasPermission(permission: string): boolean {
    const store = ThreadLocalSecurityContext.storage.getStore();
    return store?.permissions?.includes(permission) || false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUser<T = any>(): T | null {
    const store = ThreadLocalSecurityContext.storage.getStore();
    return (store?.details as T) || null;
  }
}






