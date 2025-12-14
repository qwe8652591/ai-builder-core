/**
 * ORM DSL - 声明式领域模型查询语言
 * 
 * 🎯 核心设计理念：
 * - 声明式查询语法，操作领域模型
 * - 链式 API，类型安全
 * - 运行时适配到具体 ORM（MikroORM / InMemory / Supabase）
 * 
 * @example
 * ```typescript
 * // 查询订单
 * const orders = await query(PurchaseOrder)
 *   .where({ status: 'PENDING' })
 *   .include('items', 'supplier')
 *   .orderBy('createdAt', 'desc')
 *   .paginate(1, 20)
 *   .execute();
 * 
 * // 创建订单
 * const order = await create(PurchaseOrder, {
 *   title: '新订单',
 *   supplier: { code: 'SUP001', name: '供应商A' },
 *   items: [...],
 * }).execute();
 * 
 * // 更新订单
 * await update(PurchaseOrder)
 *   .where({ id: 'order-123' })
 *   .set({ status: 'APPROVED' })
 *   .execute();
 * 
 * // 删除订单
 * await remove(PurchaseOrder)
 *   .where({ id: 'order-123' })
 *   .execute();
 * ```
 */

// ==================== 类型定义 ====================

/** 实体类型 */
export type EntityClass<T> = new (...args: unknown[]) => T;

/** 
 * 🎯 类型安全的字段路径
 * 
 * 支持一级字段和嵌套字段（如 'supplier.name'）
 */
// 获取对象类型的所有键（排除数组方法等）
type ObjectKeys<T> = T extends object 
  ? T extends unknown[] 
    ? never 
    : keyof T 
  : never;

// 一级字段路径
type Level1Path<T> = keyof T & string;

// 二级嵌套路径 - 对象字段（如 'supplier.name'）
type ObjectNestedPath<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends unknown[]
      ? never
      : `${K & string}.${ObjectKeys<T[K]> & string}`
    : never;
}[keyof T];

// 二级嵌套路径 - 数组字段（如 'items.materialCode'）
type ArrayNestedPath<T> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? U extends object
      ? `${K & string}.${ObjectKeys<U> & string}`
      : never
    : never;
}[keyof T];

// 🎯 嵌套字段路径（支持对象和数组，用于 whereNested）
export type NestedPath<T> = ObjectNestedPath<T> | ArrayNestedPath<T>;

// 组合字段路径类型（一级字段 + 嵌套路径）
export type FieldPath<T> = Level1Path<T> | NestedPath<T>;

// 根据字段路径获取值类型
export type FieldValue<T, P extends string> = 
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? T[K] extends object
        ? Rest extends keyof T[K]
          ? T[K][Rest]
          : unknown
        : unknown
      : unknown
    : P extends keyof T
      ? T[P]
      : unknown;

// 🎯 嵌套字段值类型（用于 whereNested 的值类型推导，支持对象和数组）
export type NestedValue<T, P extends string> = 
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? T[K] extends (infer U)[]
        // 数组字段：取数组元素的字段类型
        ? U extends object
          ? Rest extends keyof U
            ? U[Rest]
            : unknown
          : unknown
        // 对象字段：取对象的字段类型
        : T[K] extends object
          ? Rest extends keyof T[K]
            ? T[K][Rest]
            : unknown
          : unknown
      : unknown
    : unknown;

// 🎯 数组字段类型（提取 T 中所有数组类型的字段）
export type ArrayField<T> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? U extends object
      ? K
      : never
    : never;
}[keyof T] & string;

// 🎯 数组元素类型
export type ArrayElement<T, K extends keyof T> = T[K] extends (infer U)[] ? U : never;

// 🎯 数组元素的字段
export type ArrayElementField<T, K extends keyof T> = T[K] extends (infer U)[]
  ? U extends object
    ? keyof U & string
    : never
  : never;

// 🎯 数组元素字段的值类型
export type ArrayElementValue<T, K extends keyof T, F extends string> = 
  T[K] extends (infer U)[]
    ? U extends object
      ? F extends keyof U
        ? U[F]
        : unknown
      : unknown
    : unknown;

/** 排序方向 */
export type SortDirection = 'asc' | 'desc';

/** 比较操作符 */
export type CompareOperator = 
  | 'eq'      // 等于
  | 'neq'     // 不等于
  | 'gt'      // 大于
  | 'gte'     // 大于等于
  | 'lt'      // 小于
  | 'lte'     // 小于等于
  | 'in'      // 在列表中
  | 'nin'     // 不在列表中
  | 'like'    // 模糊匹配
  | 'ilike'   // 模糊匹配（忽略大小写）
  | 'between' // 范围
  | 'isNull'  // 为空
  | 'isNotNull'; // 不为空

/** 条件表达式 */
export interface WhereCondition<T> {
  field: FieldPath<T>;
  operator: CompareOperator;
  value: unknown;
  /** 数组查询模式：'any' = 任一匹配, 'all' = 全部匹配 */
  _arrayQuery?: 'any' | 'all';
}

/** 逻辑组合 */
export interface WhereGroup<T> {
  type: 'and' | 'or';
  conditions: Array<WhereCondition<T> | WhereGroup<T>>;
}

/** 排序规则 */
export interface OrderByClause<T> {
  field: FieldPath<T>;
  direction: SortDirection;
}

/** 分页信息 */
export interface PaginationInfo {
  pageNo: number;
  pageSize: number;
  offset: number;
  limit: number;
}

/** 查询结果 */
export interface QueryResult<T> {
  data: T[];
  total: number;
  pagination?: {
    pageNo: number;
    pageSize: number;
    totalPages: number;
  };
}

/** 单条结果 */
export type SingleResult<T> = T | null;

// ==================== 查询构建器 ====================

/**
 * 查询构建器
 * 
 * 用于构建查询 DSL，最终由适配器执行
 */
export class QueryBuilder<T> {
  private entityClass: EntityClass<T>;
  private entityName: string;
  private whereConditions: Array<WhereCondition<T> | WhereGroup<T>> = [];
  private includeRelations: string[] = [];
  private orderByClauses: OrderByClause<T>[] = [];
  private selectFields: string[] = [];
  private pagination?: PaginationInfo;
  private limitCount?: number;
  private skipCount?: number;
  
  constructor(entityClass: EntityClass<T>) {
    this.entityClass = entityClass;
    this.entityName = entityClass.name;
  }
  
  /**
   * 添加查询条件（简单对象形式，类型安全）
   * 
   * @example
   * ```typescript
   * query(Order).where({ status: 'PENDING' })
   * query(Order).where({ status: 'PENDING', createdBy: 'admin' })
   * ```
   */
  where(conditions: Partial<T>): this;
  
  /**
   * 添加查询条件（字段、操作符、值形式，类型安全）
   * 
   * @example
   * ```typescript
   * query(Order).where('totalAmount', 'gte', 1000)
   * query(Order).where('status', 'in', ['PENDING', 'APPROVED'])
   * ```
   */
  where<K extends keyof T & string>(field: K, operator: CompareOperator, value: T[K] | T[K][]): this;
  
  where<K extends keyof T & string>(
    conditionsOrField: Partial<T> | K,
    operator?: CompareOperator,
    value?: T[K] | T[K][]
  ): this {
    if (typeof conditionsOrField === 'object') {
      // 简单对象形式
      for (const [field, val] of Object.entries(conditionsOrField)) {
        this.whereConditions.push({
          field: field as FieldPath<T>,
          operator: 'eq',
          value: val,
        });
      }
    } else {
      // 字段、操作符、值形式
      this.whereConditions.push({
        field: conditionsOrField,
        operator: operator!,
        value,
      });
    }
    return this;
  }
  
  /**
   * 嵌套字段查询（如 supplier.name）- 类型安全
   * 
   * @example
   * ```typescript
   * query(Order).whereNested('supplier.name', 'like', '%ABC%')
   * query(Order).whereNested('supplier.code', 'eq', 'SUP001')
   * ```
   */
  whereNested<P extends NestedPath<T>>(
    field: P, 
    operator: CompareOperator, 
    value: NestedValue<T, P> | NestedValue<T, P>[]
  ): this {
    this.whereConditions.push({
      field: field as FieldPath<T>,
      operator,
      value,
    });
    return this;
  }
  
  /**
   * 🎯 数组字段查询 - 数组中所有元素都满足条件（类型安全）
   * 
   * 💡 与 whereNested 的区别：
   * - whereNested('items.field', op, val) = JOIN + 任一元素匹配
   * - whereAll('items', 'field', op, val) = 所有元素都必须匹配
   * 
   * @example
   * ```typescript
   * // 查询所有明细项单价都大于 50 的订单
   * query(PurchaseOrder).whereAll('items', 'unitPrice', 'gt', 50)
   * ```
   */
  whereAll<
    A extends ArrayField<T>,
    F extends ArrayElementField<T, A>
  >(
    arrayField: A,
    elementField: F,
    operator: CompareOperator,
    value: ArrayElementValue<T, A, F> | ArrayElementValue<T, A, F>[]
  ): this {
    this.whereConditions.push({
      field: `${arrayField}.${elementField}` as FieldPath<T>,
      operator,
      value,
      // 标记为数组查询（all 模式）
      _arrayQuery: 'all',
    } as WhereCondition<T>);
    return this;
  }
  
  /**
   * AND 条件组合（类型安全）
   */
  andWhere<K extends keyof T & string>(field: K, operator: CompareOperator, value: T[K] | T[K][]): this {
    this.whereConditions.push({
      field: field as FieldPath<T>,
      operator,
      value,
    });
    return this;
  }
  
  /**
   * OR 条件组合（类型安全）
   */
  orWhere<K extends keyof T & string>(field: K, operator: CompareOperator, value: T[K] | T[K][]): this {
    const lastCondition = this.whereConditions.pop();
    if (lastCondition) {
      this.whereConditions.push({
        type: 'or',
        conditions: [
          lastCondition,
          { field: field as FieldPath<T>, operator, value },
        ],
      });
    } else {
      this.whereConditions.push({ field: field as FieldPath<T>, operator, value });
    }
    return this;
  }
  
  /**
   * 加载关联实体（类型安全）
   * 
   * @example
   * ```typescript
   * query(Order).include('items', 'supplier')
   * ```
   */
  include<K extends keyof T>(...relations: K[]): this {
    this.includeRelations.push(...(relations as string[]));
    return this;
  }
  
  /**
   * 选择特定字段（类型安全）
   * 
   * @example
   * ```typescript
   * query(Order).select('id', 'orderNo', 'status')
   * ```
   */
  select<K extends keyof T>(...fields: K[]): this {
    this.selectFields.push(...(fields as string[]));
    return this;
  }
  
  /**
   * 排序（类型安全）
   * 
   * @example
   * ```typescript
   * query(Order).orderBy('createdAt', 'desc')
   * query(Order).orderBy('status').orderBy('createdAt', 'desc')
   * ```
   */
  orderBy<K extends keyof T>(field: K, direction?: SortDirection): this;
  orderBy(field: FieldPath<T>, direction?: SortDirection): this;
  orderBy(field: FieldPath<T>, direction: SortDirection = 'asc'): this {
    this.orderByClauses.push({ field, direction });
    return this;
  }
  
  /**
   * 分页
   * 
   * @example
   * ```typescript
   * query(Order).paginate(1, 20) // 第1页，每页20条
   * ```
   */
  paginate(pageNo: number, pageSize: number): this {
    this.pagination = {
      pageNo,
      pageSize,
      offset: (pageNo - 1) * pageSize,
      limit: pageSize,
    };
    return this;
  }
  
  /**
   * 限制返回数量
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }
  
  /**
   * 跳过指定数量
   */
  skip(count: number): this {
    this.skipCount = count;
    return this;
  }
  
  /**
   * 执行查询 - 返回列表
   */
  async execute(): Promise<QueryResult<T>> {
    const adapter = getActiveORMAdapter();
    return adapter.executeQuery(this.toQuerySpec());
  }
  
  /**
   * 执行查询 - 返回第一条
   */
  async first(): Promise<SingleResult<T>> {
    const adapter = getActiveORMAdapter();
    return adapter.executeQueryFirst(this.toQuerySpec());
  }
  
  /**
   * 执行查询 - 返回数量
   */
  async count(): Promise<number> {
    const adapter = getActiveORMAdapter();
    return adapter.executeCount(this.toQuerySpec());
  }
  
  /**
   * 执行查询 - 检查是否存在
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }
  
  /**
   * 转换为查询规格（供适配器使用）
   */
  toQuerySpec(): QuerySpec<T> {
    return {
      entityClass: this.entityClass,
      entityName: this.entityName,
      where: this.whereConditions,
      include: this.includeRelations,
      select: this.selectFields,
      orderBy: this.orderByClauses,
      pagination: this.pagination,
      limit: this.limitCount,
      skip: this.skipCount,
    };
  }
}

/** 查询规格（适配器使用） */
export interface QuerySpec<T> {
  entityClass: EntityClass<T>;
  entityName: string;
  where: Array<WhereCondition<T> | WhereGroup<T>>;
  include: string[];
  select: string[];
  orderBy: OrderByClause<T>[];
  pagination?: PaginationInfo;
  limit?: number;
  skip?: number;
}

// ==================== 聚合保存构建器 ====================

/**
 * 聚合保存构建器
 * 
 * 🎯 支持 DDD 聚合保存模式：
 * - 保存聚合根时，自动保存所有子实体
 * - 支持级联插入、更新、删除
 * - 处理嵌入式值对象
 * 
 * @example
 * ```typescript
 * // 保存整个聚合
 * const order = new PurchaseOrder();
 * order.title = '新订单';
 * order.supplier = { code: 'SUP001', name: '供应商A' };
 * order.items = [
 *   { materialCode: 'MAT001', quantity: 10, unitPrice: 100 },
 *   { materialCode: 'MAT002', quantity: 5, unitPrice: 200 },
 * ];
 * 
 * await save(order).execute();
 * // 自动保存订单和所有明细项
 * ```
 */
export class SaveBuilder<T> {
  private entity: T;
  private entityClass: EntityClass<T>;
  private entityName: string;
  private isUpdate: boolean = false;
  private fieldsToSave: string[] | null = null; // null = 保存所有字段
  
  constructor(entity: T) {
    this.entity = entity;
    this.entityClass = (entity as object).constructor as EntityClass<T>;
    this.entityName = this.entityClass.name;
    
    // 判断是新建还是更新
    const id = (entity as Record<string, unknown>)['id'];
    this.isUpdate = id !== undefined && id !== null && id !== '';
  }
  
  /**
   * 只保存指定字段（部分更新）
   * 
   * @example
   * ```typescript
   * // 只更新 status 字段
   * await save(order).only('status').execute();
   * 
   * // 只更新 status 和 remark 字段
   * await save(order).only('status', 'remark').execute();
   * 
   * // 只更新 items 子表
   * await save(order).only('items').execute();
   * ```
   */
  only(...fields: (keyof T | string)[]): this {
    this.fieldsToSave = fields as string[];
    return this;
  }
  
  /**
   * 排除指定字段（保存其他所有字段）
   * 
   * @example
   * ```typescript
   * // 保存除了 items 之外的所有字段
   * await save(order).except('items').execute();
   * ```
   */
  except(...fields: (keyof T | string)[]): this {
    const data = this.entity as Record<string, unknown>;
    const allFields = Object.keys(data);
    this.fieldsToSave = allFields.filter(f => !fields.includes(f));
    return this;
  }
  
  /**
   * 执行保存（聚合保存）
   */
  async execute(): Promise<T> {
    const adapter = getActiveORMAdapter();
    
    if (this.isUpdate) {
      // 更新模式
      return this.executeUpdate(adapter);
    } else {
      // 创建模式
      return this.executeCreate(adapter);
    }
  }
  
  /**
   * 执行创建
   */
  private async executeCreate(adapter: IORMAdapter): Promise<T> {
    // 生成 ID（如果没有）
    const data = { ...this.entity } as Record<string, unknown>;
    if (!data['id']) {
      data['id'] = `${this.entityName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!data['createdAt']) {
      data['createdAt'] = new Date();
    }
    
    // 处理子实体的 ID
    this.ensureChildIds(data);
    
    const result = await adapter.executeCreate({
      entityClass: this.entityClass,
      entityName: this.entityName,
      data: data as Partial<T>,
    });
    
    console.log(`[ORM] Saved aggregate ${this.entityName}:`, data['id']);
    return result;
  }
  
  /**
   * 执行更新
   */
  private async executeUpdate(adapter: IORMAdapter): Promise<T> {
    const fullData = { ...this.entity } as Record<string, unknown>;
    const id = fullData['id'] as string;
    
    // 🎯 根据 fieldsToSave 过滤要更新的字段
    let data: Record<string, unknown>;
    
    if (this.fieldsToSave) {
      // 部分更新 - 只保存指定字段
      data = {};
      for (const field of this.fieldsToSave) {
        if (field in fullData) {
          data[field] = fullData[field];
        }
      }
      // id 必须保留用于定位
      data['id'] = id;
      console.log(`[ORM] Partial update ${this.entityName}:`, id, 'fields:', this.fieldsToSave);
    } else {
      // 全量更新
      data = fullData;
    }
    
    data['updatedAt'] = new Date();
    
    // 处理子实体的 ID
    this.ensureChildIds(data);
    
    await adapter.executeUpdate({
      entityClass: this.entityClass,
      entityName: this.entityName,
      where: [{ field: 'id' as FieldPath<T>, operator: 'eq', value: id }],
      data: data as Partial<T>,
    });
    
    console.log(`[ORM] Updated aggregate ${this.entityName}:`, id);
    return { ...fullData, ...data } as T;
  }
  
  /**
   * 确保子实体有 ID
   */
  private ensureChildIds(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // 处理数组（如 items）
        data[key] = value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const itemData = { ...item } as Record<string, unknown>;
            if (!itemData['id']) {
              itemData['id'] = `${key}_${Date.now()}_${index}`;
            }
            return itemData;
          }
          return item;
        });
      }
    }
  }
}

// ==================== 创建构建器 ====================

/**
 * 创建构建器
 */
export class CreateBuilder<T> {
  private entityClass: EntityClass<T>;
  private entityName: string;
  private dataToCreate: Partial<T>;
  
  constructor(entityClass: EntityClass<T>, data: Partial<T>) {
    this.entityClass = entityClass;
    this.entityName = entityClass.name;
    this.dataToCreate = data;
  }
  
  /**
   * 执行创建
   */
  async execute(): Promise<T> {
    const adapter = getActiveORMAdapter();
    return adapter.executeCreate({
      entityClass: this.entityClass,
      entityName: this.entityName,
      data: this.dataToCreate,
    });
  }
}

// ==================== 更新构建器 ====================

/**
 * 更新构建器
 */
export class UpdateBuilder<T> {
  private entityClass: EntityClass<T>;
  private entityName: string;
  private whereConditions: Array<WhereCondition<T> | WhereGroup<T>> = [];
  private updateData: Partial<T> = {};
  
  constructor(entityClass: EntityClass<T>) {
    this.entityClass = entityClass;
    this.entityName = entityClass.name;
  }
  
  /**
   * 添加条件（类型安全）
   */
  where(conditions: Partial<T>): this;
  where<K extends keyof T & string>(field: K, operator: CompareOperator, value: T[K] | T[K][]): this;
  where<K extends keyof T & string>(
    conditionsOrField: Partial<T> | K,
    operator?: CompareOperator,
    value?: T[K] | T[K][]
  ): this {
    if (typeof conditionsOrField === 'object') {
      for (const [field, val] of Object.entries(conditionsOrField)) {
        this.whereConditions.push({
          field: field as FieldPath<T>,
          operator: 'eq',
          value: val,
        });
      }
    } else {
      this.whereConditions.push({
        field: conditionsOrField as FieldPath<T>,
        operator: operator!,
        value,
      });
    }
    return this;
  }
  
  /**
   * 设置更新值（类型安全）
   */
  set(data: Partial<T>): this {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }
  
  /**
   * 设置单个字段值（类型安全）
   */
  setField<K extends keyof T & string>(field: K, value: T[K]): this {
    (this.updateData as Record<string, unknown>)[field] = value;
    return this;
  }
  
  /**
   * 执行更新
   */
  async execute(): Promise<number> {
    const adapter = getActiveORMAdapter();
    return adapter.executeUpdate({
      entityClass: this.entityClass,
      entityName: this.entityName,
      where: this.whereConditions,
      data: this.updateData,
    });
  }
}

// ==================== 删除构建器 ====================

/**
 * 删除构建器
 */
export class DeleteBuilder<T> {
  private entityClass: EntityClass<T>;
  private entityName: string;
  private whereConditions: Array<WhereCondition<T> | WhereGroup<T>> = [];
  
  constructor(entityClass: EntityClass<T>) {
    this.entityClass = entityClass;
    this.entityName = entityClass.name;
  }
  
  /**
   * 添加条件（类型安全）
   */
  where(conditions: Partial<T>): this;
  where<K extends keyof T & string>(field: K, operator: CompareOperator, value: T[K] | T[K][]): this;
  where<K extends keyof T & string>(
    conditionsOrField: Partial<T> | K,
    operator?: CompareOperator,
    value?: T[K] | T[K][]
  ): this {
    if (typeof conditionsOrField === 'object') {
      for (const [field, val] of Object.entries(conditionsOrField)) {
        this.whereConditions.push({
          field: field as FieldPath<T>,
          operator: 'eq',
          value: val,
        });
      }
    } else {
      this.whereConditions.push({
        field: conditionsOrField as FieldPath<T>,
        operator: operator!,
        value,
      });
    }
    return this;
  }
  
  /**
   * 执行删除
   */
  async execute(): Promise<number> {
    const adapter = getActiveORMAdapter();
    return adapter.executeDelete({
      entityClass: this.entityClass,
      entityName: this.entityName,
      where: this.whereConditions,
    });
  }
}

// ==================== ORM 适配器接口 ====================

/**
 * ORM 适配器接口
 * 
 * 实现此接口以支持不同的 ORM 后端
 */
export interface IORMAdapter {
  /** 适配器名称 */
  readonly name: string;
  
  /** 初始化 */
  initialize?(config: unknown): Promise<void>;
  
  /** 销毁 */
  destroy?(): Promise<void>;
  
  /** 执行查询 - 列表 */
  executeQuery<T>(spec: QuerySpec<T>): Promise<QueryResult<T>>;
  
  /** 执行查询 - 第一条 */
  executeQueryFirst<T>(spec: QuerySpec<T>): Promise<SingleResult<T>>;
  
  /** 执行查询 - 计数 */
  executeCount<T>(spec: QuerySpec<T>): Promise<number>;
  
  /** 执行创建 */
  executeCreate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    data: Partial<T>;
  }): Promise<T>;
  
  /** 执行更新 */
  executeUpdate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
    data: Partial<T>;
  }): Promise<number>;
  
  /** 执行删除 */
  executeDelete<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
  }): Promise<number>;
  
  /** 开始事务 */
  beginTransaction?(): Promise<void>;
  
  /** 提交事务 */
  commit?(): Promise<void>;
  
  /** 回滚事务 */
  rollback?(): Promise<void>;
  
  /** 在事务中执行 */
  transactional?<R>(callback: () => Promise<R>): Promise<R>;
}

// ==================== 内存适配器实现 ====================

/**
 * 内存 ORM 适配器
 * 
 * 用于开发和测试环境
 */
export class InMemoryORMAdapter implements IORMAdapter {
  readonly name = 'in-memory';
  
  // 每个实体类型的数据存储
  private stores = new Map<string, Map<string, unknown>>();
  private idCounters = new Map<string, number>();
  
  /**
   * 获取实体存储
   */
  private getStore<T>(entityName: string): Map<string, T> {
    if (!this.stores.has(entityName)) {
      this.stores.set(entityName, new Map());
    }
    return this.stores.get(entityName)! as Map<string, T>;
  }
  
  /**
   * 生成 ID
   */
  private generateId(entityName: string): string {
    const counter = (this.idCounters.get(entityName) || 0) + 1;
    this.idCounters.set(entityName, counter);
    return `${entityName.toLowerCase()}_${counter}_${Date.now()}`;
  }
  
  /**
   * 匹配条件
   */
  private matchesConditions<T>(
    item: T,
    conditions: Array<WhereCondition<T> | WhereGroup<T>>
  ): boolean {
    for (const cond of conditions) {
      if ('type' in cond) {
        // WhereGroup
        const results = cond.conditions.map(c => this.matchesConditions(item, [c]));
        if (cond.type === 'and' && !results.every(r => r)) return false;
        if (cond.type === 'or' && !results.some(r => r)) return false;
      } else {
        // WhereCondition
        if (!this.matchesSingleCondition(item, cond)) return false;
      }
    }
    return true;
  }
  
  /**
   * 匹配单个条件
   */
  private matchesSingleCondition<T>(item: T, cond: WhereCondition<T>): boolean {
    const fieldValue = this.getFieldValue(item, cond.field as string);
    const targetValue = cond.value;
    
    const numFieldValue = fieldValue as number;
    
    switch (cond.operator) {
      case 'eq':
        return fieldValue === targetValue;
      case 'neq':
        return fieldValue !== targetValue;
      case 'gt':
        return numFieldValue > (targetValue as number);
      case 'gte':
        return numFieldValue >= (targetValue as number);
      case 'lt':
        return numFieldValue < (targetValue as number);
      case 'lte':
        return numFieldValue <= (targetValue as number);
      case 'in':
        return (targetValue as unknown[]).includes(fieldValue);
      case 'nin':
        return !(targetValue as unknown[]).includes(fieldValue);
      case 'like':
        return String(fieldValue).includes(String(targetValue));
      case 'ilike':
        return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
      case 'between': {
        const [min, max] = targetValue as [number, number];
        return numFieldValue >= min && numFieldValue <= max;
      }
      case 'isNull':
        return fieldValue === null || fieldValue === undefined;
      case 'isNotNull':
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return true;
    }
  }
  
  /**
   * 获取字段值（支持嵌套路径）
   */
  private getFieldValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let value: unknown = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  }
  
  /**
   * 排序
   */
  private sortItems<T>(items: T[], orderBy: OrderByClause<T>[]): T[] {
    if (orderBy.length === 0) return items;
    
    return [...items].sort((a, b) => {
      for (const clause of orderBy) {
        const aVal = this.getFieldValue(a, clause.field as string);
        const bVal = this.getFieldValue(b, clause.field as string);
        if (aVal! < bVal!) return clause.direction === 'asc' ? -1 : 1;
        if (aVal! > bVal!) return clause.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  // ==================== 接口实现 ====================
  
  async executeQuery<T>(spec: QuerySpec<T>): Promise<QueryResult<T>> {
    const store = this.getStore<T>(spec.entityName);
    let items = Array.from(store.values());
    
    // 过滤
    if (spec.where.length > 0) {
      items = items.filter(item => this.matchesConditions(item, spec.where));
    }
    
    const total = items.length;
    
    // 排序
    items = this.sortItems(items, spec.orderBy);
    
    // 分页 / 限制
    let offset = spec.skip || 0;
    let limit = spec.limit;
    
    if (spec.pagination) {
      offset = spec.pagination.offset;
      limit = spec.pagination.limit;
    }
    
    if (offset > 0 || limit !== undefined) {
      items = items.slice(offset, limit !== undefined ? offset + limit : undefined);
    }
    
    // 构建结果
    const result: QueryResult<T> = {
      data: items.map(item => this.clone(item)),
      total,
    };
    
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
    spec.limit = 1;
    const result = await this.executeQuery(spec);
    return result.data[0] || null;
  }
  
  async executeCount<T>(spec: QuerySpec<T>): Promise<number> {
    const store = this.getStore<T>(spec.entityName);
    let items = Array.from(store.values());
    
    if (spec.where.length > 0) {
      items = items.filter(item => this.matchesConditions(item, spec.where));
    }
    
    return items.length;
  }
  
  async executeCreate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    data: Partial<T>;
  }): Promise<T> {
    const store = this.getStore<T>(spec.entityName);
    
    const id = (spec.data as Record<string, unknown>)['id'] as string 
      || this.generateId(spec.entityName);
    
    const entity = {
      ...spec.data,
      id,
      createdAt: new Date(),
    } as T;
    
    store.set(id, entity);
    console.log(`[InMemoryORM] Created ${spec.entityName}:`, id);
    
    return this.clone(entity);
  }
  
  async executeUpdate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
    data: Partial<T>;
  }): Promise<number> {
    const store = this.getStore<T>(spec.entityName);
    const items = Array.from(store.values());
    
    let count = 0;
    for (const item of items) {
      if (this.matchesConditions(item, spec.where)) {
        const id = (item as Record<string, unknown>)['id'] as string;
        const updated = {
          ...item,
          ...spec.data,
          updatedAt: new Date(),
        };
        store.set(id, updated as T);
        count++;
      }
    }
    
    console.log(`[InMemoryORM] Updated ${count} ${spec.entityName}(s)`);
    return count;
  }
  
  async executeDelete<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
  }): Promise<number> {
    const store = this.getStore<T>(spec.entityName);
    const items = Array.from(store.entries());
    
    let count = 0;
    for (const [id, item] of items) {
      if (this.matchesConditions(item, spec.where)) {
        store.delete(id);
        count++;
      }
    }
    
    console.log(`[InMemoryORM] Deleted ${count} ${spec.entityName}(s)`);
    return count;
  }
  
  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 清空所有数据（测试用）
   */
  clearAll(): void {
    this.stores.clear();
    this.idCounters.clear();
  }
  
  /**
   * 导入数据（测试用）
   */
  importData<T extends { id: string }>(entityName: string, data: T[]): void {
    const store = this.getStore<T>(entityName);
    for (const item of data) {
      store.set(item.id, item);
    }
  }
  
  /**
   * 获取所有数据（调试用）
   */
  getAllData<T>(entityName: string): T[] {
    const store = this.getStore<T>(entityName);
    return Array.from(store.values()).map(item => this.clone(item));
  }
}

// ==================== 适配器管理 ====================

let activeAdapter: IORMAdapter = new InMemoryORMAdapter();

/**
 * 设置活跃的 ORM 适配器
 */
export function setORMAdapter(adapter: IORMAdapter): void {
  activeAdapter = adapter;
  console.log(`[ORM] 切换适配器: ${adapter.name}`);
}

/**
 * 获取活跃的 ORM 适配器
 */
export function getActiveORMAdapter(): IORMAdapter {
  return activeAdapter;
}

/**
 * 获取内存适配器（用于测试数据导入）
 */
export function getInMemoryAdapter(): InMemoryORMAdapter | null {
  if (activeAdapter.name === 'in-memory') {
    return activeAdapter as InMemoryORMAdapter;
  }
  return null;
}

// ==================== DSL 入口函数 ====================

/**
 * 创建查询构建器
 * 
 * @example
 * ```typescript
 * const orders = await query(PurchaseOrder)
 *   .where({ status: 'PENDING' })
 *   .include('items')
 *   .orderBy('createdAt', 'desc')
 *   .paginate(1, 20)
 *   .execute();
 * ```
 */
export function query<T>(entityClass: EntityClass<T>): QueryBuilder<T> {
  return new QueryBuilder(entityClass);
}

/**
 * 创建实体
 * 
 * @example
 * ```typescript
 * const order = await create(PurchaseOrder, {
 *   title: '新订单',
 *   supplier: {...},
 *   items: [...],
 * }).execute();
 * ```
 */
export function create<T>(entityClass: EntityClass<T>, data: Partial<T>): CreateBuilder<T> {
  return new CreateBuilder(entityClass, data);
}

/**
 * 更新实体
 * 
 * @example
 * ```typescript
 * const count = await update(PurchaseOrder)
 *   .where({ id: 'order-123' })
 *   .set({ status: 'APPROVED' })
 *   .execute();
 * ```
 */
export function update<T>(entityClass: EntityClass<T>): UpdateBuilder<T> {
  return new UpdateBuilder(entityClass);
}

/**
 * 删除实体
 * 
 * @example
 * ```typescript
 * const count = await remove(PurchaseOrder)
 *   .where({ id: 'order-123' })
 *   .execute();
 * ```
 */
export function remove<T>(entityClass: EntityClass<T>): DeleteBuilder<T> {
  return new DeleteBuilder(entityClass);
}

/**
 * 保存聚合根（DDD 聚合保存模式）
 * 
 * 🎯 保存整个聚合，包括：
 * - 聚合根本身
 * - 所有嵌入的值对象（如 supplier）
 * - 所有子实体集合（如 items）
 * 
 * @example
 * ```typescript
 * // 创建聚合
 * const order = new PurchaseOrder();
 * order.title = '新订单';
 * order.supplier = { code: 'SUP001', name: '供应商A' };
 * order.items = [
 *   { materialCode: 'MAT001', quantity: 10, unitPrice: 100 },
 *   { materialCode: 'MAT002', quantity: 5, unitPrice: 200 },
 * ];
 * 
 * // 保存整个聚合
 * const savedOrder = await save(order).execute();
 * 
 * // 更新聚合
 * savedOrder.status = 'APPROVED';
 * savedOrder.items.push({ materialCode: 'MAT003', quantity: 3, unitPrice: 300 });
 * await save(savedOrder).execute();
 * ```
 */
export function save<T>(entity: T): SaveBuilder<T> {
  return new SaveBuilder(entity);
}

/**
 * 批量保存聚合
 * 
 * @example
 * ```typescript
 * const orders = [order1, order2, order3];
 * const savedOrders = await saveAll(orders);
 * ```
 */
export async function saveAll<T>(entities: T[]): Promise<T[]> {
  const results: T[] = [];
  for (const entity of entities) {
    const saved = await save(entity).execute();
    results.push(saved);
  }
  return results;
}

/**
 * 根据 ID 查找实体
 * 
 * @example
 * ```typescript
 * const order = await findById(PurchaseOrder, 'order-123');
 * ```
 */
export async function findById<T>(
  entityClass: EntityClass<T>,
  id: string | number
): Promise<T | null> {
  return query(entityClass)
    .where({ id } as unknown as Partial<T>)
    .first();
}

/**
 * 根据 ID 查找实体，不存在则抛出异常
 * 
 * @example
 * ```typescript
 * const order = await findByIdOrThrow(PurchaseOrder, 'order-123');
 * ```
 */
export async function findByIdOrThrow<T>(
  entityClass: EntityClass<T>,
  id: string | number
): Promise<T> {
  const entity = await findById(entityClass, id);
  if (!entity) {
    throw new Error(`${entityClass.name} with id ${id} not found`);
  }
  return entity;
}

/**
 * 在事务中执行
 * 
 * @example
 * ```typescript
 * await transaction(async () => {
 *   await create(Order, { ... }).execute();
 *   await create(OrderItem, { ... }).execute();
 * });
 * ```
 */
export async function transaction<R>(callback: () => Promise<R>): Promise<R> {
  const adapter = getActiveORMAdapter();
  
  if (adapter.transactional) {
    return adapter.transactional(callback);
  }
  
  // 简单的模拟事务（适用于内存适配器）
  if (adapter.beginTransaction) {
    await adapter.beginTransaction();
    try {
      const result = await callback();
      if (adapter.commit) await adapter.commit();
      return result;
    } catch (error) {
      if (adapter.rollback) await adapter.rollback();
      throw error;
    }
  }
  
  // 没有事务支持，直接执行
  return callback();
}

