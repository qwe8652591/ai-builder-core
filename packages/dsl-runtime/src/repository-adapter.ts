/**
 * Repository 适配器系统
 * 
 * 🎯 核心设计理念：
 * - DSL 层：声明式定义 Repository 接口和方法签名
 * - 运行时层：根据元数据自动生成 ORM 实现
 * 
 * 支持的 ORM 适配器：
 * - InMemoryAdapter：内存存储（开发/测试用）
 * - MikroORMAdapter：MikroORM 集成（生产用）
 * - TypeORMAdapter：TypeORM 集成（可选）
 * 
 * @example
 * ```typescript
 * // 1. DSL 层：声明式定义
 * @Repository({ entity: 'PurchaseOrder', table: 'purchase_orders' })
 * class PurchaseOrderRepository {
 *   @Query({ description: '根据ID查询' })
 *   static findById(id: string): Promise<PurchaseOrder | null>;
 *   
 *   @Query({ description: '查询列表' })
 *   static findList(params: ListParams): Promise<PageResult<PurchaseOrder>>;
 *   
 *   @Command({ description: '创建订单' })
 *   static create(data: CreateDTO): Promise<string>;
 * }
 * 
 * // 2. 运行时：自动绑定 ORM 实现
 * configureRepositoryAdapter({
 *   adapter: 'mikro-orm',
 *   config: { ... },
 * });
 * ```
 */

import { getMetadataByType } from '@qwe8652591/dsl-core';

// ==================== 类型定义 ====================

/** 分页选项 */
export interface PageOptions {
  offset?: number;
  limit?: number;
  pageNo?: number;
  pageSize?: number;
  sort?: Record<string, 'asc' | 'desc'>;
}

/** 分页结果 */
export interface PageResult<T> {
  data: T[];
  total: number;
  pageNo?: number;
  pageSize?: number;
  totalPages?: number;
}

/** 基础实体接口 */
export interface BaseEntity {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Repository 元数据 */
export interface RepositoryMetadata {
  name: string;
  entity: string;
  table: string;
  methods: Record<string, MethodMetadata>;
}

/** 方法元数据 */
export interface MethodMetadata {
  name: string;
  description?: string;
  query?: boolean;
  command?: boolean;
  // 方法签名信息（可通过 reflect-metadata 获取）
  paramTypes?: unknown[];
  returnType?: unknown;
}

// ==================== Repository 适配器接口 ====================

/**
 * Repository 适配器接口
 * 
 * 所有 ORM 适配器必须实现此接口
 */
export interface IRepositoryAdapter<T extends BaseEntity = BaseEntity> {
  /** 适配器名称 */
  readonly name: string;
  
  /** 创建实体 */
  create(data: Partial<T>): Promise<T>;
  
  /** 根据 ID 查询 */
  findById(id: string | number): Promise<T | null>;
  
  /** 根据 ID 查询，不存在则抛出异常 */
  findByIdOrThrow(id: string | number): Promise<T>;
  
  /** 查询单条 */
  findOne(query: Partial<T>): Promise<T | null>;
  
  /** 查询列表 */
  find(query: Partial<T>, options?: { sort?: Record<string, 'asc' | 'desc'> }): Promise<T[]>;
  
  /** 分页查询 */
  findPage(query: Partial<T>, options: PageOptions): Promise<PageResult<T>>;
  
  /** 更新实体 */
  update(id: string | number, data: Partial<T>): Promise<T>;
  
  /** 保存实体（创建或更新） */
  save(entity: T): Promise<T>;
  
  /** 批量保存 */
  saveAll(entities: T[]): Promise<T[]>;
  
  /** 根据 ID 删除 */
  deleteById(id: string | number): Promise<boolean>;
  
  /** 删除实体 */
  delete(entity: T): Promise<boolean>;
  
  /** 统计数量 */
  count(query?: Partial<T>): Promise<number>;
  
  /** 执行原生查询（可选） */
  nativeQuery?<R = unknown>(sql: string, params?: unknown[]): Promise<R[]>;
}

/**
 * Repository 适配器工厂接口
 */
export interface IRepositoryAdapterFactory {
  /** 工厂名称 */
  readonly name: string;
  
  /** 创建适配器实例 */
  createAdapter<T extends BaseEntity>(
    entityClass: new (...args: unknown[]) => T,
    metadata: RepositoryMetadata
  ): IRepositoryAdapter<T>;
  
  /** 初始化（如数据库连接） */
  initialize?(config: unknown): Promise<void>;
  
  /** 销毁（如关闭连接） */
  destroy?(): Promise<void>;
}

// ==================== 内存适配器实现 ====================

/**
 * 内存 Repository 适配器
 * 
 * 用于开发和测试环境，数据存储在内存中
 */
export class InMemoryRepositoryAdapter<T extends BaseEntity> implements IRepositoryAdapter<T> {
  readonly name = 'in-memory';
  private store = new Map<string, T>();
  private idCounter = 0;
  
  constructor(
    private entityClass: new (...args: unknown[]) => T,
    private metadata: RepositoryMetadata
  ) {
    console.log(`[InMemoryAdapter] 创建适配器: ${metadata.name} -> ${metadata.entity}`);
  }
  
  async create(data: Partial<T>): Promise<T> {
    const id = data.id ?? `${this.metadata.entity.toLowerCase()}_${++this.idCounter}`;
    const entity = {
      ...data,
      id,
      createdAt: new Date(),
    } as T;
    
    this.store.set(String(id), entity);
    return this.clone(entity);
  }
  
  async findById(id: string | number): Promise<T | null> {
    const entity = this.store.get(String(id));
    return entity ? this.clone(entity) : null;
  }
  
  async findByIdOrThrow(id: string | number): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`${this.metadata.entity} with id ${id} not found`);
    }
    return entity;
  }
  
  async findOne(query: Partial<T>): Promise<T | null> {
    const all = Array.from(this.store.values());
    const found = all.find(item => this.matches(item, query));
    return found ? this.clone(found) : null;
  }
  
  async find(query: Partial<T>, options?: { sort?: Record<string, 'asc' | 'desc'> }): Promise<T[]> {
    let all = Array.from(this.store.values());
    all = all.filter(item => this.matches(item, query));
    
    if (options?.sort) {
      all = this.sortItems(all, options.sort);
    }
    
    return all.map(item => this.clone(item));
  }
  
  async findPage(query: Partial<T>, options: PageOptions): Promise<PageResult<T>> {
    let all = Array.from(this.store.values());
    all = all.filter(item => this.matches(item, query));
    
    const total = all.length;
    
    // 支持两种分页方式
    let start: number;
    let end: number;
    let pageNo: number;
    let pageSize: number;
    
    if (options.offset !== undefined) {
      start = options.offset;
      pageSize = options.limit || 20;
      end = start + pageSize;
      pageNo = Math.floor(start / pageSize) + 1;
    } else {
      pageNo = options.pageNo || 1;
      pageSize = options.pageSize || 20;
      start = (pageNo - 1) * pageSize;
      end = start + pageSize;
    }
    
    if (options.sort) {
      all = this.sortItems(all, options.sort);
    }
    
    const data = all.slice(start, end).map(item => this.clone(item));
    
    return {
      data,
      total,
      pageNo,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  
  async update(id: string | number, data: Partial<T>): Promise<T> {
    const existing = await this.findByIdOrThrow(id);
    const updated = {
      ...existing,
      ...data,
      id, // 确保 ID 不变
      updatedAt: new Date(),
    } as T;
    
    this.store.set(String(id), updated);
    return this.clone(updated);
  }
  
  async save(entity: T): Promise<T> {
    if (entity.id && this.store.has(String(entity.id))) {
      return this.update(entity.id, entity);
    }
    return this.create(entity);
  }
  
  async saveAll(entities: T[]): Promise<T[]> {
    const saved: T[] = [];
    for (const entity of entities) {
      saved.push(await this.save(entity));
    }
    return saved;
  }
  
  async deleteById(id: string | number): Promise<boolean> {
    const exists = this.store.has(String(id));
    this.store.delete(String(id));
    return exists;
  }
  
  async delete(entity: T): Promise<boolean> {
    return this.deleteById(entity.id);
  }
  
  async count(query?: Partial<T>): Promise<number> {
    if (!query || Object.keys(query).length === 0) {
      return this.store.size;
    }
    const all = Array.from(this.store.values());
    return all.filter(item => this.matches(item, query)).length;
  }
  
  // ==================== 辅助方法 ====================
  
  private matches(item: T, query: Partial<T>): boolean {
    for (const key in query) {
      if (query[key] !== (item as Record<string, unknown>)[key]) {
        return false;
      }
    }
    return true;
  }
  
  private sortItems(items: T[], sort: Record<string, 'asc' | 'desc'>): T[] {
    return items.sort((a, b) => {
      for (const key in sort) {
        const aVal = (a as Record<string, unknown>)[key];
        const bVal = (b as Record<string, unknown>)[key];
        if (aVal! < bVal!) return sort[key] === 'asc' ? -1 : 1;
        if (aVal! > bVal!) return sort[key] === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  private clone(entity: T): T {
    return JSON.parse(JSON.stringify(entity));
  }
  
  /** 清空数据（测试用） */
  clear(): void {
    this.store.clear();
    this.idCounter = 0;
  }
  
  /** 导入数据（测试用） */
  importData(data: T[]): void {
    for (const item of data) {
      this.store.set(String(item.id), item);
    }
  }
}

/**
 * 内存适配器工厂
 */
export class InMemoryAdapterFactory implements IRepositoryAdapterFactory {
  readonly name = 'in-memory';
  private adapters = new Map<string, InMemoryRepositoryAdapter<any>>();
  
  createAdapter<T extends BaseEntity>(
    entityClass: new (...args: unknown[]) => T,
    metadata: RepositoryMetadata
  ): IRepositoryAdapter<T> {
    // 复用已创建的适配器（单例模式）
    if (this.adapters.has(metadata.name)) {
      return this.adapters.get(metadata.name)!;
    }
    
    const adapter = new InMemoryRepositoryAdapter(entityClass, metadata);
    this.adapters.set(metadata.name, adapter);
    return adapter;
  }
  
  /** 获取适配器（用于测试数据注入） */
  getAdapter<T extends BaseEntity>(repoName: string): InMemoryRepositoryAdapter<T> | undefined {
    return this.adapters.get(repoName);
  }
  
  /** 清空所有适配器数据（测试用） */
  clearAll(): void {
    this.adapters.forEach(adapter => adapter.clear());
  }
}

// ==================== MikroORM 适配器接口 ====================

/**
 * MikroORM 适配器配置
 */
export interface MikroORMAdapterConfig {
  /** 数据库类型 */
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  /** 数据库连接配置 */
  connection: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    dbName: string;
  };
  /** 是否自动同步 Schema（开发环境） */
  autoSync?: boolean;
  /** 是否显示 SQL 日志 */
  debug?: boolean;
}

/**
 * MikroORM 适配器工厂（占位，需要单独包实现）
 * 
 * 🎯 这个工厂由 @ai-builder/orm-mikro 包提供实现
 */
export interface IMikroORMAdapterFactory extends IRepositoryAdapterFactory {
  /** 初始化 MikroORM */
  initialize(config: MikroORMAdapterConfig): Promise<void>;
  
  /** 获取 EntityManager */
  getEntityManager(): unknown;
  
  /** 执行事务 */
  transactional<T>(callback: () => Promise<T>): Promise<T>;
}

// ==================== Repository 适配器管理器 ====================

/**
 * Repository 适配器管理器
 * 
 * 单例模式，管理所有 Repository 适配器
 */
class RepositoryAdapterManager {
  private static instance: RepositoryAdapterManager;
  
  private factory: IRepositoryAdapterFactory;
  private adapters = new Map<string, IRepositoryAdapter<any>>();
  
  private constructor() {
    // 默认使用内存适配器
    this.factory = new InMemoryAdapterFactory();
  }
  
  static getInstance(): RepositoryAdapterManager {
    if (!RepositoryAdapterManager.instance) {
      RepositoryAdapterManager.instance = new RepositoryAdapterManager();
    }
    return RepositoryAdapterManager.instance;
  }
  
  /**
   * 配置适配器工厂
   */
  setFactory(factory: IRepositoryAdapterFactory): void {
    this.factory = factory;
    this.adapters.clear(); // 清空已创建的适配器
    console.log(`[RepositoryManager] 切换适配器工厂: ${factory.name}`);
  }
  
  /**
   * 获取当前工厂
   */
  getFactory(): IRepositoryAdapterFactory {
    return this.factory;
  }
  
  /**
   * 获取 Repository 适配器
   */
  getAdapter<T extends BaseEntity>(
    repositoryClass: new (...args: unknown[]) => unknown,
    entityClass: new (...args: unknown[]) => T
  ): IRepositoryAdapter<T> {
    const repoName = repositoryClass.name;
    
    // 复用已创建的适配器
    if (this.adapters.has(repoName)) {
      return this.adapters.get(repoName)!;
    }
    
    // 从 Metadata Store 获取 Repository 元数据
    const repoMetadataMap = getMetadataByType('repository');
    const repoMetadata = repoMetadataMap.get(repoName) as RepositoryMetadata | undefined;
    
    if (!repoMetadata) {
      throw new Error(`Repository metadata not found: ${repoName}`);
    }
    
    // 创建适配器
    const adapter = this.factory.createAdapter(entityClass, repoMetadata);
    this.adapters.set(repoName, adapter);
    
    return adapter;
  }
  
  /**
   * 根据名称获取适配器
   */
  getAdapterByName<T extends BaseEntity>(repoName: string): IRepositoryAdapter<T> | undefined {
    return this.adapters.get(repoName);
  }
}

// ==================== 导出 API ====================

/**
 * 获取 Repository 适配器管理器
 */
export function getRepositoryManager(): RepositoryAdapterManager {
  return RepositoryAdapterManager.getInstance();
}

/**
 * 配置 Repository 适配器
 * 
 * @example
 * ```typescript
 * // 使用内存适配器（默认）
 * configureRepositoryAdapter({ type: 'in-memory' });
 * 
 * // 使用 MikroORM 适配器
 * configureRepositoryAdapter({
 *   type: 'mikro-orm',
 *   config: {
 *     type: 'postgresql',
 *     connection: {
 *       host: 'localhost',
 *       port: 5432,
 *       dbName: 'mydb',
 *     },
 *   },
 * });
 * ```
 */
export async function configureRepositoryAdapter(options: {
  type: 'in-memory' | 'mikro-orm' | 'custom';
  factory?: IRepositoryAdapterFactory;
  config?: MikroORMAdapterConfig;
}): Promise<void> {
  const manager = getRepositoryManager();
  
  switch (options.type) {
    case 'in-memory':
      manager.setFactory(new InMemoryAdapterFactory());
      break;
      
    case 'mikro-orm':
      // MikroORM 适配器需要单独的包来提供
      throw new Error(
        'MikroORM adapter requires @ai-builder/orm-mikro package. ' +
        'Install it and use: import { MikroORMAdapterFactory } from "@ai-builder/orm-mikro"'
      );
      
    case 'custom':
      if (!options.factory) {
        throw new Error('Custom adapter requires a factory instance');
      }
      manager.setFactory(options.factory);
      break;
  }
}

/**
 * 创建 Repository 代理
 * 
 * 🎯 为 DSL Repository 类创建运行时代理，自动绑定 ORM 实现
 * 
 * @example
 * ```typescript
 * // DSL 定义
 * @Repository({ entity: 'PurchaseOrder', table: 'purchase_orders' })
 * class PurchaseOrderRepository {
 *   static findById(id: string): Promise<PurchaseOrder | null>;
 *   static create(data: CreateDTO): Promise<string>;
 * }
 * 
 * // 运行时绑定
 * const repo = createRepositoryProxy(PurchaseOrderRepository, PurchaseOrder);
 * const order = await repo.findById('123');
 * ```
 */
export function createRepositoryProxy<
  R extends { new (...args: unknown[]): unknown },
  T extends BaseEntity
>(
  repositoryClass: R,
  entityClass: new (...args: unknown[]) => T
): R & IRepositoryAdapter<T> {
  const manager = getRepositoryManager();
  const adapter = manager.getAdapter(repositoryClass, entityClass);
  
  // 创建代理对象，将所有方法调用转发到适配器
  return new Proxy(repositoryClass, {
    get(target, prop, receiver) {
      // 优先使用适配器上的方法
      if (prop in adapter) {
        return (adapter as unknown as Record<string, unknown>)[prop as string];
      }
      // 然后检查原始类上的静态方法
      return Reflect.get(target, prop, receiver);
    },
  }) as R & IRepositoryAdapter<T>;
}

