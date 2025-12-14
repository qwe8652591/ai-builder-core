/**
 * 轻量级依赖注入容器
 * 基于 Symbol Token，兼容 TC39 装饰器
 */

// 使用 any 作为构造函数参数以支持各种依赖注入场景
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InjectionToken<T = unknown> = string | symbol | { new (...args: any[]): T };

interface Provider<T = unknown> {
  useValue?: T;
  useFactory?: () => T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useClass?: { new (...args: any[]): T };
}

/**
 * 简单的依赖注入容器
 */
export class SimpleContainer {
  private instances = new Map<symbol | string, unknown>();
  private providers = new Map<symbol | string, Provider>();

  /**
   * 注册提供者
   */
  register<T>(token: InjectionToken<T>, provider: Provider<T>): void {
    const key = this.getKey(token);
    
    if (provider.useValue !== undefined) {
      this.instances.set(key, provider.useValue);
    } else {
      this.providers.set(key, provider);
    }
  }

  /**
   * 解析依赖
   */
  resolve<T>(token: InjectionToken<T>): T {
    const key = this.getKey(token);

    // 1. 检查是否已有实例
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    // 2. 查找提供者
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`No provider found for token: ${this.tokenToString(token)}`);
    }

    // 3. 创建实例
    let instance: T;

    if (provider.useFactory) {
      instance = provider.useFactory() as T;
    } else if (provider.useClass) {
      // 暂不支持构造函数自动注入（因为我们使用TC39装饰器）
      instance = new provider.useClass() as T;
    } else {
      throw new Error(`Invalid provider for token: ${this.tokenToString(token)}`);
    }

    // 4. 缓存实例
    this.instances.set(key, instance);

    return instance;
  }

  /**
   * 检查是否已注册
   */
  has(token: InjectionToken): boolean {
    const key = this.getKey(token);
    return this.instances.has(key) || this.providers.has(key);
  }

  /**
   * 清空容器
   */
  clear(): void {
    this.instances.clear();
    this.providers.clear();
  }

  /**
   * 获取 key
   */
  private getKey(token: InjectionToken): symbol | string {
    if (typeof token === 'string' || typeof token === 'symbol') {
      return token;
    }
    // 类构造函数使用类名
    return token.name;
  }

  /**
   * Token 转字符串（用于调试）
   */
  private tokenToString(token: InjectionToken): string {
    if (typeof token === 'string') {
      return token;
    }
    if (typeof token === 'symbol') {
      return token.description || token.toString();
    }
    return token.name || 'Unknown';
  }
}

/**
 * 全局容器实例
 */
export const globalContainer = new SimpleContainer();

/**
 * 便捷函数：直接注册实例到容器
 * 
 * @example
 * registerService(MyService, myServiceInstance);
 */
export function registerService<T>(token: InjectionToken<T>, instance: T): void {
  globalContainer.register(token, { useValue: instance });
}

/**
 * 便捷函数：从容器获取服务实例
 * 
 * @example
 * const service = getService(MyService);
 */
export function getService<T>(token: InjectionToken<T>): T {
  return globalContainer.resolve(token);
}

