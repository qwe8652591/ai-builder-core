/**
 * @ai-builder/dsl 类型系统契约
 * 提供用于快速派生 DTO 的类型工具
 */

// =================================================================================================
// 1. Base Types (基础类型)
// =================================================================================================

/**
 * 基础命令接口（写操作）
 */
export interface Command {
  // 标记属性，用于类型识别
  readonly _type?: 'Command';
}

/**
 * 基础查询接口（读操作参数）
 */
export interface Query {
  /** 页码（从 1 开始） */
  pageNo?: number;
  /** 每页大小 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 基础视图接口（读操作返回）
 */
export interface View {
  readonly _type?: 'View';
}

/**
 * 领域事件接口
 */
export interface Event {
  /** 事件唯一 ID */
  eventId: string;
  /** 事件发生时间 */
  occurredOn: Date;
  /** 事件类型 */
  eventType: string;
}

/**
 * 分页参数别名
 */
export type PageParam = Query;

/**
 * 分页结果
 */
export interface PageResult<T> {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNo: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

// =================================================================================================
// 2. Type Helpers (类型辅助工具)
// =================================================================================================

/**
 * 从实体类型中提取字段（排除方法）
 */
export type FieldsOf<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

/**
 * 自动生成创建命令 DTO 类型
 * 排除 id, createdAt, updatedAt 等系统字段
 * 将所有非 nullable 字段设为必填，nullable 字段设为可选
 */
export type CreateCommand<T> = Omit<FieldsOf<T>, 'id' | 'createdAt' | 'updatedAt' | 'version'>;

/**
 * 自动生成更新命令 DTO 类型
 * id 必填，其他字段全部可选
 */
export type UpdateCommand<T> = { id: any } & Partial<CreateCommand<T>>;

/**
 * 自动生成详情视图 DTO 类型
 * 包含所有字段
 */
export type DetailView<T> = FieldsOf<T>;

/**
 * 自动生成列表视图 DTO 类型
 * 通常与 DetailView 相同，但可以根据需要通过 Pick 裁剪
 */
export type ListView<T> = FieldsOf<T>;

/**
 * 提取实体的关联键
 * 用于定义关联查询
 */
export type RelationKeys<T> = {
  [K in keyof T]: T[K] extends object ? (T[K] extends Function ? never : K) : never;
}[keyof T];






