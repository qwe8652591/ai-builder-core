/**
 * @ai-builder/dsl 运行时原语契约
 * 定义将在运行时环境中实现的基础设施接口
 */

// =================================================================================================
// 1. Decimal (高精度数值)
// =================================================================================================

/**
 * 高精度数值类型接口
 * 模拟 BigDecimal 的行为
 */
export interface Decimal {
  /** 加法 */
  add(other: Decimal | number | string): Decimal;
  /** 减法 */
  sub(other: Decimal | number | string): Decimal;
  /** 乘法 */
  mul(other: Decimal | number | string): Decimal;
  /** 除法 */
  div(other: Decimal | number | string): Decimal;
  /** 相等比较 */
  equals(other: Decimal | number | string): boolean;
  /** 大于比较 */
  greaterThan(other: Decimal | number | string): boolean;
  /** 小于比较 */
  lessThan(other: Decimal | number | string): boolean;
  /** 转为字符串 */
  toString(): string;
  /** 转为 JavaScript 数字（可能丢失精度） */
  toNumber(): number;
  /** 保留小数位 */
  toFixed(fractionDigits?: number): string;
}

/**
 * Decimal 构造函数接口
 */
export interface DecimalConstructor {
  new (value: number | string | Decimal): Decimal;
  /** 静态方法：从值创建 */
  of(value: number | string | Decimal): Decimal;
  /** 静态属性：0 */
  ZERO: Decimal;
  /** 静态属性：1 */
  ONE: Decimal;
}

// 导出变量声明，以便作为值使用（实际运行时由 global 或 runtime 注入）
export declare const Decimal: DecimalConstructor;


// =================================================================================================
// 2. Repository (仓储接口)
// =================================================================================================

/**
 * 分页选项
 */
export interface PageOptions {
  pageNo?: number;
  pageSize?: number;
  sort?: Record<string, 'asc' | 'desc'>;
}

/**
 * 泛型仓储接口
 * @template T 实体类型
 * @template ID 主键类型
 */
export interface Repo<T, ID = any> {
  /** 根据 ID 查询 */
  findById(id: ID): Promise<T | null>;
  
  /** 根据 ID 查询，不存在则抛出异常 */
  findByIdOrThrow(id: ID): Promise<T>;
  
  /** 根据条件查询单条 */
  findOne(query: Partial<T>): Promise<T | null>;
  
  /** 根据条件查询多条列表 */
  find(query: Partial<T>, options?: { sort?: Record<string, 'asc' | 'desc'> }): Promise<T[]>;
  
  /** 分页查询 */
  findPage(query: Partial<T>, options: PageOptions): Promise<{ list: T[]; total: number }>;
  
  /** 保存实体（新增或更新） */
  save(entity: T): Promise<T>;
  
  /** 批量保存 */
  saveAll(entities: T[]): Promise<T[]>;
  
  /** 根据 ID 删除 */
  deleteById(id: ID): Promise<boolean>;
  
  /** 根据实体删除 */
  delete(entity: T): Promise<boolean>;
  
  /** 统计数量 */
  count(query?: Partial<T>): Promise<number>;
}


// =================================================================================================
// 3. EventBus (事件总线)
// =================================================================================================

/**
 * 事件处理器类型
 */
export type EventHandler<E> = (event: E) => Promise<void> | void;

/**
 * 事件总线接口
 */
export interface EventBus {
  /**
   * 发布事件
   * @param event 事件对象
   */
  publish(event: any): Promise<void>;

  /**
   * 订阅事件
   * @param eventType 事件类或类型名
   * @param handler 处理函数
   */
  subscribe<E>(eventType: { new(...args: any[]): E } | string, handler: EventHandler<E>): void;

  /**
   * 取消订阅
   */
  unsubscribe<E>(eventType: { new(...args: any[]): E } | string, handler: EventHandler<E>): void;
}

// 导出变量声明
export declare const EventBus: EventBus;


// =================================================================================================
// 4. Hooks (钩子系统)
// =================================================================================================

/**
 * 钩子上下文
 */
export interface HookContext<T = any> {
  /** 当前操作的实体 */
  entity?: T;
  /** 操作类型 */
  action: 'create' | 'update' | 'delete' | 'read';
  /** 额外元数据 */
  [key: string]: any;
}

/**
 * 钩子系统接口
 */
export interface Hooks {
  /**
   * 注册前置钩子
   * @param action 动作标识
   * @param handler 处理函数
   */
  before(action: string, handler: (ctx: HookContext) => Promise<void> | void): void;

  /**
   * 注册后置钩子
   * @param action 动作标识
   * @param handler 处理函数
   */
  after(action: string, handler: (ctx: HookContext) => Promise<void> | void): void;
}

// 导出变量声明
export declare const Hooks: Hooks;






