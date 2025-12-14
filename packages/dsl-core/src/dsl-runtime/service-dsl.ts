/**
 * 服务层 DSL 定义
 * 
 * 提供统一的 DSL 语法来定义 AppService、Service、Repository
 * 与视图层 DSL 保持一致的风格
 * 定义时自动注册到 Metadata Store
 */

import { registerMetadata } from './metadata-store';

// ==================== 类型定义 ====================

/** 依赖声明 */
export type DepsDeclaration = Record<string, any>;

/** 方法定义 */
export type MethodsDefinition = Record<string, (...args: any[]) => any>;

// ==================== AppService DSL ====================

/** AppService 元数据 */
export interface AppServiceMeta {
  name: string;
  description?: string;
  expose?: boolean;
}

/** AppService DSL 定义 */
export interface AppServiceDefinition<
  M extends MethodsDefinition = MethodsDefinition
> {
  meta: AppServiceMeta;
  methods: M;
}

/** AppService 实例类型 */
export type AppServiceInstance<M extends MethodsDefinition> = {
  [K in keyof M]: M[K] extends (this: any, ...args: infer A) => infer R 
    ? (...args: A) => R 
    : never;
};

/**
 * 定义应用服务
 * 
 * 依赖会自动注入，无需声明 deps
 * 
 * @example
 * ```typescript
 * export const UserAppService = defineAppService({
 *   meta: { name: 'UserAppService', expose: true },
 *   methods: {
 *     async createUser(this: { service: UserService; eventBus: EventBus }, command) { ... },
 *     async getUsers(this: { service: UserService }, query) { ... },
 *   },
 * });
 * ```
 */
export function defineAppService<M extends MethodsDefinition>(
  definition: AppServiceDefinition<M>
): AppServiceDefinition<M> & { __type: 'appService' } {
  const result = {
    ...definition,
    __type: 'appService' as const,
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== Service DSL ====================

/** Service 元数据 */
export interface ServiceMeta {
  name: string;
  description?: string;
}

/** Service DSL 定义 */
export interface ServiceDefinition<
  M extends MethodsDefinition = MethodsDefinition
> {
  meta: ServiceMeta;
  methods: M;
}

/**
 * 定义内部服务
 * 
 * 依赖会自动注入，无需声明 deps
 * 
 * @example
 * ```typescript
 * export const UserService = defineService({
 *   meta: { name: 'UserService' },
 *   methods: {
 *     async createUser(this: { repository: UserRepository }, data) { ... },
 *     async findUser(this: { repository: UserRepository }, id) { ... },
 *   },
 * });
 * ```
 */
export function defineService<M extends MethodsDefinition>(
  definition: ServiceDefinition<M>
): ServiceDefinition<M> & { __type: 'service' } {
  const result = {
    ...definition,
    __type: 'service' as const,
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== Repository DSL ====================

/** Repository 元数据 */
export interface RepositoryMeta {
  name: string;
  description?: string;
  entity: string;
  table: string;
}

/** Repository DSL 定义 */
export interface RepositoryDefinition<
  E = any,
  M extends MethodsDefinition = MethodsDefinition
> {
  meta: RepositoryMeta;
  entity: E;
  methods: M;
}

/**
 * 定义仓储
 * 
 * @example
 * ```typescript
 * export const UserRepository = defineRepository({
 *   meta: { name: 'UserRepository', entity: 'User', table: 'users' },
 *   entity: User,
 *   methods: {
 *     async findById(this, id) { ... },
 *     async findAll(this, params) { ... },
 *   },
 * });
 * ```
 */
export function defineRepository<
  E,
  M extends MethodsDefinition
>(definition: RepositoryDefinition<E, M>): RepositoryDefinition<E, M> & { __type: 'repository' } {
  const result = {
    ...definition,
    __type: 'repository' as const,
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== DSL 服务容器 ====================

/** 服务实例缓存 */
const serviceInstances = new Map<string, unknown>();

/** 数据库获取函数 */
let dbGetter: (() => unknown) | null = null;

/** 事件总线获取函数 */
let eventBusGetter: (() => unknown) | null = null;

/**
 * 设置数据库获取函数
 */
export function setDSLDbGetter(getter: () => unknown): void {
  dbGetter = getter;
}

/**
 * 设置事件总线获取函数
 */
export function setDSLEventBusGetter(getter: () => unknown): void {
  eventBusGetter = getter;
}

/**
 * 注册服务实例（用于按名称引用）
 */
export function registerDSLService(name: string, instance: unknown): void {
  serviceInstances.set(name, instance);
}

/**
 * 创建服务实例
 * 
 * 自动注入所有已注册的服务，无需声明 deps
 * 
 * 注入规则：
 * - 所有已注册服务按小驼峰名称注入（PurchaseOrderService -> purchaseOrderService）
 * - 简短别名：*Service -> service, *Repository -> repository
 * - Repository 自动注入 db
 * - 所有服务自动注入 eventBus
 */
export function createServiceInstance<M extends MethodsDefinition>(
  definition: { meta: { name: string }; methods: M; __type: string }
): AppServiceInstance<M> {
  const { meta, methods } = definition;
  
  // 检查缓存
  if (serviceInstances.has(meta.name)) {
    return serviceInstances.get(meta.name) as AppServiceInstance<M>;
  }
  
  // 自动注入所有已注册的服务
  const resolvedDeps: Record<string, unknown> = {};
  
  for (const [name, instance] of serviceInstances.entries()) {
    // 转换为小驼峰：PurchaseOrderService -> purchaseOrderService
    const propName = name.charAt(0).toLowerCase() + name.slice(1);
    resolvedDeps[propName] = instance;
    
    // 简短别名
    if (name.endsWith('Service') && !name.startsWith(meta.name.replace(/AppService$|Service$/, ''))) {
      resolvedDeps['service'] = instance;
    }
    if (name.endsWith('Repository')) {
      resolvedDeps['repository'] = instance;
    }
  }
  
  // Repository 自动注入 db
  if (definition.__type === 'repository' && dbGetter) {
    resolvedDeps.db = dbGetter();
  }
  
  // 所有服务自动注入 eventBus
  if (eventBusGetter) {
    resolvedDeps.eventBus = eventBusGetter();
  }
  
  // 创建实例对象
  const instance: Record<string, unknown> = {};
  
  // 绑定方法
  for (const [methodName, method] of Object.entries(methods)) {
    instance[methodName] = (method as (...args: unknown[]) => unknown).bind(resolvedDeps);
  }
  
  // 缓存实例
  serviceInstances.set(meta.name, instance);
  
  console.log(`[DSL] Created service: ${meta.name}`);
  
  return instance as AppServiceInstance<M>;
}

/**
 * 获取 DSL 服务实例
 */
export function getDSLService<T>(definition: { meta: { name: string }; __type: string }): T {
  if (!serviceInstances.has(definition.meta.name)) {
    createServiceInstance(definition as { meta: { name: string }; methods: MethodsDefinition; __type: string });
  }
  return serviceInstances.get(definition.meta.name) as T;
}

/**
 * 清空服务实例缓存（用于测试）
 */
export function clearDSLServiceInstances(): void {
  serviceInstances.clear();
}

