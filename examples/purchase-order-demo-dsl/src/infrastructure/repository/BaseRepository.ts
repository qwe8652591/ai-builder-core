/**
 * 基础 Repository 抽象类
 * 
 * 提供通用的 CRUD 操作和领域模型映射能力
 * 所有具体的 Repository 都应该继承此类
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from '../database/kysely';
import type { Kysely } from 'kysely';
import { Decimal } from '@ai-builder/dsl';

/**
 * 字段映射配置
 */
export type FieldMapping<T> = Partial<Record<keyof T, string>>;

/**
 * 基础 Repository 配置
 */
export interface BaseRepositoryConfig<TEntity> {
  tableName: string;
  entityConstructor: new () => TEntity;
}

/**
 * 通用基础 Repository
 */
export abstract class BaseRepository<
  TEntity extends { id: string | number }
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly db: Kysely<any>;
  protected readonly tableName: string;
  protected readonly entityConstructor: new () => TEntity;

  constructor(config: BaseRepositoryConfig<TEntity>) {
    this.db = db;
    this.tableName = config.tableName;
    this.entityConstructor = config.entityConstructor;
  }

  // ==================== CRUD 操作 ====================

  /**
   * 根据 ID 查询
   */
  async findById(id: string | number): Promise<TEntity | null> {
    const row = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id as any)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return this.mapToDomainModel(row);
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
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll();

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.execute();
    return rows.map(row => this.mapToDomainModel(row));
  }

  /**
   * 创建实体
   */
  async create(entity: Partial<TEntity>): Promise<TEntity> {
    const row = this.mapToTableRow(entity);
    
    const result = await this.db
      .insertInto(this.tableName)
      .values(row)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomainModel(result);
  }

  /**
   * 更新实体
   */
  async update(id: string | number, entity: Partial<TEntity>): Promise<TEntity | null> {
    const row = this.mapToTableRow(entity);
    
    const result = await this.db
      .updateTable(this.tableName)
      .set(row as any)
      .where('id', '=', id as any)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapToDomainModel(result);
  }

  /**
   * 删除实体
   */
  async delete(id: string | number): Promise<boolean> {
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
    let query = this.db
      .selectFrom(this.tableName)
      .select((eb) => eb.fn.count('id').as('total'));

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
    const result = await this.db
      .selectFrom(this.tableName)
      .select('id')
      .where('id', '=', id as any)
      .executeTakeFirst();

    return !!result;
  }

  // ==================== 映射方法（子类需实现） ====================

  /**
   * 将数据库记录映射为领域模型
   * 子类必须实现此方法
   */
  protected abstract mapToDomainModel(row: any): TEntity;

  /**
   * 将领域模型映射为数据库记录
   * 子类可以重写此方法以实现自定义映射
   */
  protected mapToTableRow(entity: Partial<TEntity>): any {
    // 默认实现：使用字段映射配置
    const fieldMapping = this.getFieldMapping();
    return this.mapFields(entity, entity, fieldMapping, true);
  }

  /**
   * 获取字段映射配置
   * 子类可以重写此方法以提供自定义映射
   */
  protected getFieldMapping(): FieldMapping<TEntity> {
    return {} as FieldMapping<TEntity>;
  }

  // ==================== 工具方法 ====================

  /**
   * 通用字段映射工具
   * 
   * @param target 目标对象
   * @param source 源对象
   * @param fieldMap 字段映射关系（目标字段 -> 源字段）
   * @param reverse 是否反向映射（源字段 -> 目标字段）
   */
  protected mapFields<T, S>(
    target: T,
    source: S,
    fieldMap: Partial<Record<keyof T, keyof S>>,
    reverse: boolean = false
  ): T {
    const result = { ...target };
    
    Object.entries(fieldMap).forEach(([targetKey, sourceKey]) => {
      const key = reverse ? sourceKey : targetKey;
      const value = source[key as keyof S];
      
      if (value !== null && value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[reverse ? sourceKey : targetKey] = value;
      }
    });

    return result;
  }

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
   * 批量转换对象的 key 为 snake_case
   */
  protected keysToSnakeCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[this.toSnakeCase(key)] = value;
    });
    return result;
  }

  /**
   * 批量转换对象的 key 为 camelCase
   */
  protected keysToCamelCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[this.toCamelCase(key)] = value;
    });
    return result;
  }

  /**
   * 处理 Decimal 类型字段
   */
  protected mapDecimalField(value: any): Decimal | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new Decimal(value);
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
  async transaction<T>(callback: (trx: Kysely<any>) => Promise<T>): Promise<T> {
    return await this.db.transaction().execute(callback);
  }
}

