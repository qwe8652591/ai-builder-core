import 'reflect-metadata';
import { SimpleContainer, globalContainer, InjectionToken } from './simple-container';
import { InMemoryRepo } from '../repository/in-memory-repo';
import { RepoFactory } from '../repository/repo-factory';
import { LocalEventBus } from '../event-bus/local-event-bus';
import { HookRegistry } from '../hooks/hook-registry';
import { Decimal } from '../primitives/decimal';
import { ThreadLocalSecurityContext } from '../primitives/security';
import { TOKENS } from './tokens';

// 服务类的类型定义 - 使用 any 以支持各种构造函数签名
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClass = new (...args: any[]) => unknown;

export interface RuntimeConfig {
  /** 运行模式 */
  mode?: 'simulation' | 'production';
  /** 服务类列表（会自动注册到容器） */
  services?: ServiceClass[];
  /** Repo 配置（实体名 -> 实现类型） */
  repos?: Record<string, 'InMemory' | ServiceClass | object>;
}

export class RuntimeBootstrap {
  private container: SimpleContainer;
  private config: RuntimeConfig;

  private constructor(config: RuntimeConfig = {}) {
    this.config = config;
    this.container = globalContainer;
    this.initialize();
  }

  /**
   * 创建 Runtime 实例
   */
  static create(config: RuntimeConfig = {}): RuntimeBootstrap {
    return new RuntimeBootstrap(config);
  }

  /**
   * 初始化运行时环境
   */
  private initialize(): void {
    // 1. 注册基础设施组件（单例）
    this.container.register(TOKENS.EventBus, { useValue: new LocalEventBus() });
    this.container.register(TOKENS.Hooks, { useValue: HookRegistry.global });
    this.container.register(TOKENS.SecurityContext, { useValue: new ThreadLocalSecurityContext() });
    this.container.register(TOKENS.Decimal, { useValue: Decimal });

    // 2. 注册 RepoFactory
    this.container.register(TOKENS.RepoFactory, { useValue: RepoFactory });

    // 3. 配置 Repos
    if (this.config.repos) {
      for (const [entityName, impl] of Object.entries(this.config.repos)) {
        const token = TOKENS.Repo(entityName);
        
        if (impl === 'InMemory') {
          const repo = new InMemoryRepo<{ id: string }>();
          RepoFactory.register(entityName, repo);
          this.container.register(token, { useValue: repo });
        } else if (typeof impl === 'function' && 'prototype' in impl) {
          // 自定义实现类
          const repo = new (impl as ServiceClass)();
          RepoFactory.register(entityName, repo as InMemoryRepo<{ id: string }>);
          this.container.register(token, { useValue: repo });
        } else if (typeof impl === 'object') {
          // 实例
          RepoFactory.register(entityName, impl as InMemoryRepo<{ id: string }>);
          this.container.register(token, { useValue: impl });
        }
      }
    }

    // 4. 注册用户服务（使用工厂函数手动注入依赖）
    if (this.config.services) {
      for (const ServiceClass of this.config.services) {
        const className = ServiceClass.name;
        
        // 注册服务工厂
        this.container.register(className, {
          useFactory: () => this.createServiceInstance(ServiceClass)
        });
        
        // 也注册类本身作为 token
        this.container.register(ServiceClass as never, {
          useFactory: () => this.createServiceInstance(ServiceClass)
        });
      }
    }
  }

  /**
   * 创建服务实例并手动注入依赖
   */
  private createServiceInstance(ServiceClass: ServiceClass): unknown {
    const className = ServiceClass.name;
    
    // 根据类名判断并注入依赖
    // 这里我们使用简单的规则匹配
    const dependencies = this.getDependenciesForService(className);
    
    // 解析依赖
    const resolvedDeps = dependencies.map(token => this.container.resolve(token));
    
    // 创建实例（通过构造函数注入）
    return new ServiceClass(...resolvedDeps);
  }

  /**
   * 获取服务的依赖列表
   * TODO: 未来可以通过装饰器元数据自动获取
   */
  private getDependenciesForService(className: string): InjectionToken[] {
    const deps: InjectionToken[] = [];

    // ProductAPI 的依赖
    if (className === 'ProductAPI') {
      deps.push(TOKENS.Repo('Product'), TOKENS.Decimal);
    }
    
    // CustomerAPI 的依赖
    else if (className === 'CustomerAPI') {
      deps.push(TOKENS.Repo('Customer'), TOKENS.Decimal);
    }
    
    // OrderAPI 的依赖
    else if (className === 'OrderAPI') {
      deps.push(
        TOKENS.Repo('Order'),
        TOKENS.Repo('Product'),
        TOKENS.Repo('Customer'),
        TOKENS.EventBus,
        TOKENS.Decimal
      );
    }

    return deps;
  }

  /**
   * 获取服务实例
   */
  get<T>(token: InjectionToken<T>): T {
    return this.container.resolve(token);
  }

  /**
   * 在安全上下文中执行
   */
  async runInContext<T>(context: Record<string, unknown>, callback: () => Promise<T>): Promise<T> {
    return ThreadLocalSecurityContext.run(context, callback);
  }

  /**
   * 获取容器（用于高级操作）
   */
  getContainer(): SimpleContainer {
    return this.container;
  }

  /**
   * 清空容器（用于测试）
   */
  static reset(): void {
    globalContainer.clear();
  }
}
