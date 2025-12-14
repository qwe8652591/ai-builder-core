/**
 * 轻量级 IoC 容器
 * 用于依赖注入和服务管理
 */

type Class<T = any> = new (...args: any[]) => T;
type Provider<T = any> = Class<T> | (() => T) | T;

export class IocContainer {
  private instances = new Map<string, any>();
  private providers = new Map<string, Provider>();
  private metadata = new Map<string, Map<string, string>>(); // className -> { fieldName: token }

  /**
   * 注册服务提供者
   */
  register<T>(token: string, provider: Provider<T>): void {
    this.providers.set(token, provider);
  }

  /**
   * 注册类（自动实例化）
   */
  registerClass<T>(token: string, clazz: Class<T>): void {
    this.providers.set(token, clazz);
  }

  /**
   * 注册单例实例
   */
  registerInstance<T>(token: string, instance: T): void {
    this.instances.set(token, instance);
  }

  /**
   * 注册依赖元数据（从 @Inject 装饰器收集）
   */
  registerDependency(className: string, fieldName: string, token: string): void {
    if (!this.metadata.has(className)) {
      this.metadata.set(className, new Map());
    }
    this.metadata.get(className)!.set(fieldName, token);
  }

  /**
   * 获取服务实例
   */
  get<T>(token: string | Class<T>): T {
    const key = typeof token === 'string' ? token : token.name;

    // 1. 如果已有实例，直接返回（单例模式）
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    // 2. 查找提供者
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`No provider found for: ${key}`);
    }

    // 3. 创建实例
    let instance: T;

    if (typeof provider === 'function' && provider.prototype) {
      // Class constructor
      instance = new (provider as Class<T>)();
      
      // 自动注入依赖
      this.injectDependencies(instance, provider.name);
    } else if (typeof provider === 'function') {
      // Factory function
      instance = (provider as () => T)();
    } else {
      // Direct value
      instance = provider as T;
    }

    // 4. 缓存实例（单例）
    this.instances.set(key, instance);

    return instance;
  }

  /**
   * 检查是否有服务
   */
  has(token: string): boolean {
    return this.providers.has(token) || this.instances.has(token);
  }

  /**
   * 清空容器（用于测试）
   */
  clear(): void {
    this.instances.clear();
    this.providers.clear();
    this.metadata.clear();
  }

  /**
   * 自动注入依赖到实例的字段
   */
  private injectDependencies(instance: any, className: string): void {
    const deps = this.metadata.get(className);
    if (!deps) return;

    for (const [fieldName, token] of deps.entries()) {
      try {
        instance[fieldName] = this.get(token);
      } catch (err) {
        console.warn(`Failed to inject ${token} into ${className}.${fieldName}:`, err);
      }
    }
  }
}

// 全局单例容器
export const globalContainer = new IocContainer();






