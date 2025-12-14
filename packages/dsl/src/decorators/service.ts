import 'reflect-metadata';
import { metadataStore } from '../utils/metadata';
import { Constructor } from '../utils/type-helpers';

// ==================== 服务层装饰器 ====================

/**
 * 服务装饰器配置选项
 * 支持类似 Spring 的依赖声明
 */
export interface ServiceDecoratorOptions {
  /**
   * 依赖列表（按构造函数参数顺序）
   * 
   * 如果不提供，会尝试通过 reflect-metadata 自动获取构造函数参数类型。
   * 注意：自动获取需要 TypeScript 编译器启用 emitDecoratorMetadata。
   * 
   * @example
   * ```typescript
   * // 自动解析依赖（推荐，需要配置 emitDecoratorMetadata）
   * @Service()
   * export class UserService {
   *   constructor(private repo: UserRepository) {}
   * }
   * 
   * // 或手动声明（适用于 esbuild 等不支持 emitDecoratorMetadata 的环境）
   * @Service({ deps: [UserRepository] })
   * export class UserService {
   *   constructor(private repo: UserRepository) {}
   * }
   * ```
   */
  deps?: Array<new (...args: any[]) => any>;
}

/**
 * 自动解析构造函数依赖
 * 优先使用手动声明的 deps，否则尝试通过 reflect-metadata 获取
 */
function resolveConstructorDeps(
  target: new (...args: any[]) => any,
  manualDeps?: Array<new (...args: any[]) => any>
): Array<new (...args: any[]) => any> {
  // 1. 如果手动声明了 deps，直接使用
  if (manualDeps && manualDeps.length > 0) {
    return manualDeps;
  }
  
  // 2. 尝试通过 reflect-metadata 自动获取构造函数参数类型
  try {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target);
    if (paramTypes && Array.isArray(paramTypes)) {
      // 过滤掉原始类型（String, Number, Boolean, Object, Array 等）
      const validDeps = paramTypes.filter((type: any) => {
        return type && 
               typeof type === 'function' && 
               type !== Object &&
               type !== String &&
               type !== Number &&
               type !== Boolean &&
               type !== Array &&
               type !== Function;
      });
      if (validDeps.length > 0) {
        console.log(`[DI] ${target.name} 自动解析依赖: [${validDeps.map((d: any) => d.name).join(', ')}]`);
        return validDeps;
      }
    }
  } catch (e) {
    // reflect-metadata 可能不可用，忽略
  }
  
  // 3. 无依赖
  return [];
}

/**
 * 服务元数据（存储依赖信息）
 */
export interface ServiceMetadata {
  constructor: new (...args: any[]) => any;
  deps: Array<new (...args: any[]) => any>;
  name: string;
  type: 'domainLogic' | 'appService' | 'service' | 'repository';
}

// 服务注册表（存储所有被装饰器标记的服务及其依赖）
const serviceRegistry = new Map<new (...args: any[]) => any, ServiceMetadata>();

/**
 * 获取服务注册表
 */
export function getServiceRegistry(): Map<new (...args: any[]) => any, ServiceMetadata> {
  return serviceRegistry;
}

/**
 * 清空服务注册表（用于测试）
 */
export function clearServiceRegistry(): void {
  serviceRegistry.clear();
}

/**
 * 领域逻辑装饰器
 */
export function DomainLogic(options: ServiceDecoratorOptions = {}) {
  return function <T extends new (...args: any[]) => any>(target: T, context?: ClassDecoratorContext) {
    const className = context ? String(context.name) : target.name;
    metadataStore.registerEntity(className, {
      type: 'domainLogic',
      className: className,
    });
    
    // 自动解析依赖并注册到服务注册表
    serviceRegistry.set(target, {
      constructor: target,
      deps: resolveConstructorDeps(target, options.deps),
      name: className,
      type: 'domainLogic',
    });
    
    return target;
  };
}

/**
 * 应用服务装饰器
 * 
 * 依赖会自动从构造函数参数类型中解析（需要 emitDecoratorMetadata）。
 * 也可以手动声明 deps 参数。
 * 
 * @example
 * ```typescript
 * // 自动解析依赖（推荐）
 * @AppService()
 * export class UserAppService {
 *   constructor(private service: UserService, private eventBus: EventBus) {}
 * }
 * 
 * // 或手动声明
 * @AppService({ deps: [UserService, EventBus] })
 * export class UserAppService {
 *   constructor(private service: UserService, private eventBus: EventBus) {}
 * }
 * ```
 */
export function AppService(options: ServiceDecoratorOptions = {}) {
  return function <T extends new (...args: any[]) => any>(target: T, context?: ClassDecoratorContext) {
    const className = context ? String(context.name) : target.name;
    metadataStore.registerEntity(className, {
      type: 'appService',
      className: className,
    });
    
    // 自动解析依赖并注册到服务注册表
    serviceRegistry.set(target, {
      constructor: target,
      deps: resolveConstructorDeps(target, options.deps),
      name: className,
      type: 'appService',
    });
    
    return target;
  };
}

/**
 * 内部服务装饰器
 * 
 * 依赖会自动从构造函数参数类型中解析（需要 emitDecoratorMetadata）。
 * 
 * @example
 * ```typescript
 * // 自动解析依赖（推荐）
 * @Service()
 * export class UserService {
 *   constructor(private repo: UserRepository) {}
 * }
 * ```
 */
export function Service(options: ServiceDecoratorOptions = {}) {
  return function <T extends new (...args: any[]) => any>(target: T, context?: ClassDecoratorContext) {
    const className = context ? String(context.name) : target.name;
    metadataStore.registerEntity(className, {
      type: 'service',
      className: className,
    });
    
    // 自动解析依赖并注册到服务注册表
    serviceRegistry.set(target, {
      constructor: target,
      deps: resolveConstructorDeps(target, options.deps),
      name: className,
      type: 'service',
    });
    
    return target;
  };
}

/**
 * 仓储装饰器
 * 
 * Repository 通常没有依赖，但也支持自动解析。
 * 
 * @example
 * ```typescript
 * @Repository()
 * export class UserRepository {}
 * ```
 */
export function Repository(options: ServiceDecoratorOptions = {}) {
  return function <T extends new (...args: any[]) => any>(target: T, context?: ClassDecoratorContext) {
    const className = context ? String(context.name) : target.name;
    metadataStore.registerEntity(className, {
      type: 'repository',
      className: className,
    });
    
    // 自动解析依赖并注册到服务注册表
    serviceRegistry.set(target, {
      constructor: target,
      deps: resolveConstructorDeps(target, options.deps),
      name: className,
      type: 'repository',
    });
    
    return target;
  };
}


