/**
 * MikroORM 适配器实现
 * 
 * 🎯 将 ORM DSL 查询转换为 MikroORM 查询执行
 * 
 * 依赖：@mikro-orm/core, @mikro-orm/postgresql (或其他驱动)
 * 
 * @example
 * ```typescript
 * import { MikroORMAdapter } from '@ai-builder/jsx-runtime';
 * import { MikroORM } from '@mikro-orm/core';
 * 
 * // 初始化 MikroORM
 * const orm = await MikroORM.init({
 *   type: 'postgresql',
 *   dbName: 'mydb',
 *   entities: [PurchaseOrder, ...],
 * });
 * 
 * // 创建适配器
 * const adapter = new MikroORMAdapter(orm);
 * 
 * // 设置为活跃适配器
 * setORMAdapter(adapter);
 * 
 * // 现在 ORM DSL 会使用 MikroORM 执行
 * const orders = await query(PurchaseOrder).where({...}).execute();
 * ```
 */

import type {
  IORMAdapter,
  QuerySpec,
  QueryResult,
  SingleResult,
  WhereCondition,
  WhereGroup,
  EntityClass,
} from './orm-dsl';

// ==================== 类型定义 ====================

/**
 * MikroORM 核心类型（避免硬依赖）
 */
interface IMikroORM {
  em: IEntityManager;
  close(): Promise<void>;
}

interface IEntityManager {
  fork(): IEntityManager;
  find<T>(entityClass: EntityClass<T>, where: unknown, options?: unknown): Promise<T[]>;
  findOne<T>(entityClass: EntityClass<T>, where: unknown, options?: unknown): Promise<T | null>;
  findOneOrFail<T>(entityClass: EntityClass<T>, where: unknown, options?: unknown): Promise<T>;
  findAndCount<T>(entityClass: EntityClass<T>, where: unknown, options?: unknown): Promise<[T[], number]>;
  count<T>(entityClass: EntityClass<T>, where?: unknown): Promise<number>;
  create<T>(entityClass: EntityClass<T>, data: Partial<T>): T;
  persist(entity: unknown): IEntityManager;
  persistAndFlush(entity: unknown): Promise<void>;
  assign<T>(entity: T, data: Partial<T>): T;
  remove(entity: unknown): IEntityManager;
  removeAndFlush(entity: unknown): Promise<void>;
  flush(): Promise<void>;
  clear(): void;
  transactional<T>(callback: (em: IEntityManager) => Promise<T>): Promise<T>;
}

/**
 * MikroORM 配置选项
 */
export interface MikroORMConfig {
  /** 数据库类型 */
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'mariadb';
  /** 数据库连接 */
  dbName: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  /** 实体类列表 */
  entities?: unknown[];
  /** 是否自动创建表 */
  autoCreateTables?: boolean;
  /** 是否开启调试 */
  debug?: boolean;
}

// ==================== MikroORM 适配器 ====================

/**
 * MikroORM 适配器
 * 
 * 将 ORM DSL 查询转换为 MikroORM 查询
 */
export class MikroORMAdapter implements IORMAdapter {
  readonly name = 'mikro-orm';
  
  private orm: IMikroORM;
  private em: IEntityManager;
  
  constructor(orm: IMikroORM) {
    this.orm = orm;
    this.em = orm.em;
  }
  
  /**
   * 获取 EntityManager（每次请求使用 fork）
   */
  private getEM(): IEntityManager {
    return this.em.fork();
  }
  
  /**
   * 转换 where 条件为 MikroORM 格式
   */
  private convertWhere<T>(
    conditions: Array<WhereCondition<T> | WhereGroup<T>>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const cond of conditions) {
      if ('type' in cond) {
        // WhereGroup (and/or)
        const groupConditions = cond.conditions.map(c => 
          this.convertWhere([c])
        );
        
        if (cond.type === 'or') {
          result['$or'] = groupConditions;
        } else {
          // and - 合并条件
          Object.assign(result, ...groupConditions);
        }
      } else {
        // WhereCondition
        const field = cond.field as string;
        const value = this.convertOperator(cond.operator, cond.value);
        
        // 处理嵌套路径（如 supplier.code）
        if (field.includes('.')) {
          this.setNestedValue(result, field, value);
        } else {
          result[field] = value;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 转换操作符为 MikroORM 格式
   */
  private convertOperator(operator: string, value: unknown): unknown {
    switch (operator) {
      case 'eq':
        return value;
      case 'neq':
        return { $ne: value };
      case 'gt':
        return { $gt: value };
      case 'gte':
        return { $gte: value };
      case 'lt':
        return { $lt: value };
      case 'lte':
        return { $lte: value };
      case 'in':
        return { $in: value };
      case 'nin':
        return { $nin: value };
      case 'like':
        return { $like: `%${value}%` };
      case 'ilike':
        return { $ilike: `%${value}%` };
      case 'between':
        const [min, max] = value as [unknown, unknown];
        return { $gte: min, $lte: max };
      case 'isNull':
        return null;
      case 'isNotNull':
        return { $ne: null };
      default:
        return value;
    }
  }
  
  /**
   * 设置嵌套路径值
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  /**
   * 转换排序为 MikroORM 格式
   */
  private convertOrderBy<T>(
    orderBy: Array<{ field: string | keyof T; direction: 'asc' | 'desc' }>
  ): Record<string, 'asc' | 'desc'> {
    const result: Record<string, 'asc' | 'desc'> = {};
    
    for (const clause of orderBy) {
      result[clause.field as string] = clause.direction;
    }
    
    return result;
  }
  
  // ==================== IORMAdapter 实现 ====================
  
  async executeQuery<T>(spec: QuerySpec<T>): Promise<QueryResult<T>> {
    const em = this.getEM();
    
    const where = this.convertWhere(spec.where);
    const orderBy = this.convertOrderBy(spec.orderBy);
    
    // 构建选项
    const options: Record<string, unknown> = {};
    
    if (Object.keys(orderBy).length > 0) {
      options.orderBy = orderBy;
    }
    
    if (spec.include.length > 0) {
      options.populate = spec.include;
    }
    
    if (spec.select.length > 0) {
      options.fields = spec.select;
    }
    
    // 分页
    if (spec.pagination) {
      options.offset = spec.pagination.offset;
      options.limit = spec.pagination.limit;
    } else {
      if (spec.skip) options.offset = spec.skip;
      if (spec.limit) options.limit = spec.limit;
    }
    
    // 执行查询
    const [data, total] = await em.findAndCount(
      spec.entityClass,
      where,
      options
    );
    
    const result: QueryResult<T> = { data, total };
    
    if (spec.pagination) {
      result.pagination = {
        pageNo: spec.pagination.pageNo,
        pageSize: spec.pagination.pageSize,
        totalPages: Math.ceil(total / spec.pagination.pageSize),
      };
    }
    
    return result;
  }
  
  async executeQueryFirst<T>(spec: QuerySpec<T>): Promise<SingleResult<T>> {
    const em = this.getEM();
    
    const where = this.convertWhere(spec.where);
    const options: Record<string, unknown> = {};
    
    if (spec.include.length > 0) {
      options.populate = spec.include;
    }
    
    return em.findOne(spec.entityClass, where, options);
  }
  
  async executeCount<T>(spec: QuerySpec<T>): Promise<number> {
    const em = this.getEM();
    const where = this.convertWhere(spec.where);
    return em.count(spec.entityClass, where);
  }
  
  async executeCreate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    data: Partial<T>;
  }): Promise<T> {
    const em = this.getEM();
    
    const entity = em.create(spec.entityClass, spec.data);
    await em.persistAndFlush(entity);
    
    console.log(`[MikroORM] Created ${spec.entityName}`);
    return entity;
  }
  
  async executeUpdate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
    data: Partial<T>;
  }): Promise<number> {
    const em = this.getEM();
    
    const where = this.convertWhere(spec.where);
    const entities = await em.find(spec.entityClass, where);
    
    let count = 0;
    for (const entity of entities) {
      em.assign(entity, spec.data);
      count++;
    }
    
    if (count > 0) {
      await em.flush();
    }
    
    console.log(`[MikroORM] Updated ${count} ${spec.entityName}(s)`);
    return count;
  }
  
  async executeDelete<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
  }): Promise<number> {
    const em = this.getEM();
    
    const where = this.convertWhere(spec.where);
    const entities = await em.find(spec.entityClass, where);
    
    const count = entities.length;
    for (const entity of entities) {
      em.remove(entity);
    }
    
    if (count > 0) {
      await em.flush();
    }
    
    console.log(`[MikroORM] Deleted ${count} ${spec.entityName}(s)`);
    return count;
  }
  
  async transactional<R>(callback: () => Promise<R>): Promise<R> {
    const em = this.getEM();
    return em.transactional(async () => {
      return callback();
    });
  }
  
  /**
   * 关闭连接
   */
  async destroy(): Promise<void> {
    await this.orm.close();
    console.log('[MikroORM] Connection closed');
  }
  
  /**
   * 获取原始 EntityManager（用于高级操作）
   */
  getEntityManager(): IEntityManager {
    return this.getEM();
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建 MikroORM 适配器
 * 
 * @example
 * ```typescript
 * import { MikroORM } from '@mikro-orm/core';
 * import { createMikroORMAdapter, setORMAdapter } from '@ai-builder/jsx-runtime';
 * 
 * const orm = await MikroORM.init({...});
 * const adapter = createMikroORMAdapter(orm);
 * setORMAdapter(adapter);
 * ```
 */
export function createMikroORMAdapter(orm: IMikroORM): MikroORMAdapter {
  return new MikroORMAdapter(orm);
}

/**
 * 初始化 MikroORM 并创建适配器
 * 
 * 注意：此函数需要 @mikro-orm/core 已安装
 * 
 * @example
 * ```typescript
 * const adapter = await initMikroORM({
 *   type: 'postgresql',
 *   dbName: 'mydb',
 *   host: 'localhost',
 *   entities: [PurchaseOrder, ...],
 * });
 * 
 * setORMAdapter(adapter);
 * ```
 */
export async function initMikroORM(config: MikroORMConfig): Promise<MikroORMAdapter> {
  // 动态导入 MikroORM
  let MikroORM: unknown;
  
  try {
    // 动态导入 - 避免编译时依赖
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mikroModule = await (Function('return import("@mikro-orm/core")')() as Promise<{ MikroORM: unknown }>);
    MikroORM = mikroModule.MikroORM;
  } catch {
    throw new Error(
      'MikroORM is not installed. Please install @mikro-orm/core and the appropriate driver:\n' +
      '  pnpm add @mikro-orm/core @mikro-orm/postgresql\n' +
      'or:\n' +
      '  pnpm add @mikro-orm/core @mikro-orm/mysql'
    );
  }
  
  // 初始化 MikroORM
  const orm = await (MikroORM as { init: (config: unknown) => Promise<IMikroORM> }).init({
    type: config.type,
    dbName: config.dbName,
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    entities: config.entities || [],
    debug: config.debug,
    // 自动创建表（开发环境）
    ...(config.autoCreateTables ? {
      schemaGenerator: {
        createForeignKeyConstraints: true,
      },
    } : {}),
  });
  
  // 自动创建表
  if (config.autoCreateTables) {
    const generator = (orm as unknown as { getSchemaGenerator: () => { createSchema: () => Promise<void> } }).getSchemaGenerator();
    await generator.createSchema();
  }
  
  console.log(`[MikroORM] Connected to ${config.type}://${config.host || 'localhost'}/${config.dbName}`);
  
  return new MikroORMAdapter(orm);
}

