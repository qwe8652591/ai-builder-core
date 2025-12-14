/**
 * 基于 Metadata 的自动映射 Repository
 * 
 * 利用 metadataStore 中的实体和表映射信息，实现完全自动化的映射
 * 无需手动编写 mapToDomainModel 和 mapToTableRow 方法
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { metadataStore } from '@ai-builder/dsl';
import type { Decimal, DecimalConstructor } from '@ai-builder/dsl';
import { transactionContext } from '../transaction/context';

// 运行时 Decimal 构造函数（由 initializeDecimal() 注入到 globalThis）
// 使用 getter 延迟获取，确保在 initializeDecimal() 之后使用
function getDecimal(): DecimalConstructor {
  const d = (globalThis as any).Decimal;
  if (!d) {
    throw new Error('Decimal not initialized. Please call initializeDecimal() first.');
  }
  return d;
}

// 全局数据库获取函数（由应用初始化时注入）
type DbGetter = () => Promise<any>;
let globalDbGetter: DbGetter | null = null;

/**
 * 设置全局数据库获取函数
 * 
 * 在应用启动时调用，注入数据库获取函数
 * 
 * @example
 * ```typescript
 * import { setRepositoryDbGetter } from '@ai-builder/runtime';
 * import { getDb } from './kysely.browser';
 * 
 * setRepositoryDbGetter(getDb);
 * ```
 */
export function setRepositoryDbGetter(getter: DbGetter): void {
  globalDbGetter = getter;
}

/**
 * 获取数据库实例
 */
async function getDb(): Promise<any> {
  if (!globalDbGetter) {
    throw new Error(
      'Database getter not set. Please call setRepositoryDbGetter() during application initialization.'
    );
  }
  return globalDbGetter();
}

/**
 * 基础 Repository 配置
 */
export interface MetadataRepositoryConfig<TEntity> {
  entityName: string;  // 实体名称（用于查找 metadata）
  entityConstructor: new () => TEntity;
  tableName?: string;  // 可选的硬编码表名
}

/**
 * 基于 Metadata 的自动映射 Repository
 * 
 * @typeParam TEntity - 实体类型
 * @typeParam TDatabase - 数据库 Schema 类型（默认为 any）
 */
export abstract class MetadataBaseRepository<
  TEntity extends { id: string | number },
  TDatabase = any
> {
  private _db!: any;
  protected readonly entityName: string;
  protected readonly entityConstructor: new () => TEntity;
  protected tableName!: string;
  
  /**
   * 数据库访问器
   * 
   * 自动检查事务上下文：
   * - 如果在 @AppTransactional() 事务中，返回事务对象
   * - 否则返回普通数据库连接
   */
  protected get db(): any {
    // 优先使用事务上下文中的事务对象
    const currentTrx = transactionContext.getTransaction();
    if (currentTrx) {
      return currentTrx;
    }
    
    // 否则返回普通连接
    if (!this._db) {
      throw new Error('Database not initialized. Repository must be initialized before use.');
    }
    return this._db;
  }
  
  // 缓存映射关系（性能优化）
  private fieldMappingCache: Map<string, string> | null = null;  // model字段 -> table字段
  private reverseMappingCache: Map<string, string> | null = null;  // table字段 -> model字段
  private dbInitialized = false;

  constructor(config: MetadataRepositoryConfig<TEntity>) {
    this.entityName = config.entityName;
    this.entityConstructor = config.entityConstructor;
    if (config.tableName) {
      this.tableName = config.tableName;
    }
    
    // 异步初始化数据库
    this.initialize().catch(err => {
      console.error('[Repository] Failed to initialize database:', err);
    });
  }
  
  /**
   * 确保数据库已初始化
   */
  private async ensureDb(): Promise<void> {
    if (!this.dbInitialized) {
      console.log('[MetadataBaseRepository] ensureDb 开始获取数据库...');
      this._db = await getDb();
      this.dbInitialized = true;
      console.log('[MetadataBaseRepository] ensureDb 完成，_db:', this._db ? '已设置' : '未设置');
    }
  }

  /**
   * 初始化：加载 metadata 并设置表名
   * 
   * ⚠️ 注意：即使 metadata 加载失败，也确保 db 被初始化
   * 这样子类可以使用硬编码的表名直接查询
   */
  async initialize(): Promise<void> {
    // 确保数据库已初始化（无论后续是否成功）
    await this.ensureDb();
    
    if (this.tableName) return;  // 已初始化

    // 尝试从 metadata 加载表名（可选，子类可以使用硬编码表名）
    try {
      const tableMetadata = metadataStore.getTableByEntity(this.entityName);
      
      if (tableMetadata) {
        this.tableName = tableMetadata.name;
        
        // 构建字段映射缓存
        const entityMetadata = metadataStore.getEntity(this.entityName);
        if (entityMetadata) {
          this.buildFieldMappingCache(entityMetadata, tableMetadata);
        }
      } else {
        console.warn(`[Repository] 找不到实体 ${this.entityName} 的表元数据，将使用硬编码表名`);
      }
    } catch (err) {
      console.warn(`[Repository] metadata 初始化失败，将使用硬编码表名:`, err);
    }
  }

  /**
   * 构建字段映射缓存
   */
  private buildFieldMappingCache(entityMetadata: any, tableMetadata: any): void {
    this.fieldMappingCache = new Map();
    this.reverseMappingCache = new Map();

    // 遍历表的所有列，建立映射关系
    tableMetadata.columns.forEach((column: any) => {
      // 查找对应的实体字段
      const entityField = entityMetadata.fields.find((f: any) => {
        // 转换字段名为 snake_case 进行匹配
        const snakeName = this.toSnakeCase(f.name);
        return snakeName === column.name || f.name === column.sourceField;
      });

      if (entityField) {
        // model字段 -> table字段
        this.fieldMappingCache!.set(entityField.name, column.name);
        // table字段 -> model字段
        this.reverseMappingCache!.set(column.name, entityField.name);
      }
    });
  }

  // ==================== CRUD 操作 ====================

  /**
   * 根据 ID 查询
   */
  async findById(id: string | number): Promise<TEntity | null> {
    await this.initialize();
    
    const row = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id as any)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return await this.mapToDomainModel(row);
  }

  /**
   * 查询所有记录
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<TEntity[]> {
    await this.initialize();
    
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll();

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy as any, options.orderDirection || 'asc');
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.execute();
    return Promise.all(rows.map((row: any) => this.mapToDomainModel(row)));
  }

  /**
   * 创建实体
   */
  async create(entity: Partial<TEntity>): Promise<TEntity> {
    await this.initialize();
    
    const row = await this.mapToTableRow(entity);
    
    const result = await this.db
      .insertInto(this.tableName)
      .values(row)
      .returningAll()
      .executeTakeFirstOrThrow();

    return await this.mapToDomainModel(result);
  }

  /**
   * 更新实体
   */
  async update(id: string | number, entity: Partial<TEntity>): Promise<TEntity | null> {
    await this.initialize();
    
    const row = await this.mapToTableRow(entity);
    
    const result = await this.db
      .updateTable(this.tableName)
      .set(row as any)
      .where('id', '=', id as any)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return await this.mapToDomainModel(result);
  }

  /**
   * 删除实体
   */
  async delete(id: string | number): Promise<boolean> {
    await this.initialize();
    
    const result = await this.db
      .deleteFrom(this.tableName)
      .where('id', '=', id as any)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * 统计总数
   */
  async count(where?: Record<string, any>): Promise<number> {
    await this.initialize();
    
    let query = this.db
      .selectFrom(this.tableName)
      .select((eb: any) => eb.fn.count('id').as('total'));

    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.where(key as any, '=', value);
      });
    }

    const result = await query.executeTakeFirst();
    return Number(result?.total || 0);
  }

  /**
   * 检查实体是否存在
   */
  async exists(id: string | number): Promise<boolean> {
    await this.initialize();
    
    const result = await this.db
      .selectFrom(this.tableName)
      .select('id')
      .where('id', '=', id as any)
      .executeTakeFirst();

    return !!result;
  }

  // ==================== 自动映射方法 ====================

  /**
   * 🔑 自动映射：数据库记录 → 领域模型
   * 
   * 基于 metadata 自动完成映射，无需手动编写
   */
  protected async mapToDomainModel(row: any): Promise<TEntity> {
    await this.initialize();
    
    const entity = new this.entityConstructor();
    const entityMetadata = metadataStore.getEntity(this.entityName);
    
    if (!entityMetadata) {
      throw new Error(`找不到实体 ${this.entityName} 的元数据`);
    }

    // 遍历所有实体字段，从 row 中取值
    entityMetadata.fields.forEach((field: any) => {
      // 跳过关系字段（由子类处理）
      if ((field as any).isRelation) {
        return;
      }

      // 获取数据库字段名
      const dbFieldName = this.fieldMappingCache?.get(field.name);
      if (!dbFieldName) {
        return;
      }

      const value = row[dbFieldName];
      
      // 根据类型进行转换
      (entity as any)[field.name] = this.convertTableValueToModel(value, field.type);
    });

    return entity;
  }

  /**
   * 🔑 自动映射：领域模型 → 数据库记录
   * 
   * 基于 metadata 自动完成映射，无需手动编写
   */
  protected async mapToTableRow(entity: Partial<TEntity>): Promise<any> {
    await this.initialize();
    
    const row: any = {};
    const entityMetadata = metadataStore.getEntity(this.entityName);
    
    if (!entityMetadata) {
      throw new Error(`找不到实体 ${this.entityName} 的元数据`);
    }

    // 遍历实体的所有字段，转换为数据库字段
    Object.entries(entity).forEach(([key, value]) => {
      // 跳过 undefined
      if (value === undefined) {
        return;
      }

      // 查找字段元数据
      const field = entityMetadata.fields.find((f: any) => f.name === key);
      if (!field || (field as any).isRelation) {
        return;
      }

      // 获取数据库字段名
      const dbFieldName = this.fieldMappingCache?.get(key);
      if (!dbFieldName) {
        return;
      }

      // 根据类型进行转换
      row[dbFieldName] = this.convertModelValueToTable(value, field.type);
    });

    return row;
  }

  // ==================== 类型转换工具 ====================

  /**
   * 将数据库值转换为领域模型值
   */
  protected convertTableValueToModel(value: any, fieldType: string): any {
    if (value === null || value === undefined) {
      return undefined;
    }

    // Decimal 类型
    if (fieldType === 'Decimal' || fieldType.includes('Decimal')) {
      return new (getDecimal())(value);
    }

    // Date 类型
    if (fieldType === 'Date') {
      return value instanceof Date ? value : new Date(value);
    }

    // 其他类型直接返回
    return value;
  }

  /**
   * 将领域模型值转换为数据库值
   */
  protected convertModelValueToTable(value: any, fieldType: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Decimal 类型需要转换为字符串
    if (value instanceof (getDecimal() as any) || fieldType === 'Decimal' || fieldType.includes('Decimal')) {
      return value.toString();
    }

    // Date 类型
    if (fieldType === 'Date' && value instanceof Date) {
      return value;
    }

    // 其他类型直接返回
    return value;
  }

  // ==================== 工具方法 ====================

  /**
   * 转换为 snake_case
   */
  protected toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter, index) => {
      return index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase();
    });
  }

  /**
   * 转换为 camelCase
   */
  protected toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 处理 Decimal 类型字段
   */
  protected mapDecimalField(value: any): Decimal | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new (getDecimal())(value);
  }

  /**
   * 处理可选字段
   */
  protected mapOptionalField<T>(value: T | null | undefined): T | undefined {
    return value ?? undefined;
  }

  // ==================== 事务支持 ====================

  /**
   * 在事务中执行操作
   */
  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    return await this.db.transaction().execute(callback);
  }
}

