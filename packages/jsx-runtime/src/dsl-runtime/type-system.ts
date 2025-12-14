/**
 * DSL 类型系统
 * 
 * 统一的类型定义，包括：
 * - 基础类型 (Primitive Types)
 * - 枚举类型 (Enum Types)
 * - 对象类型 (Object Types)
 * - 集合类型 (Collection Types)
 * - 引用类型 (Reference Types)
 * 
 * @module type-system
 */

import { registerMetadata } from './metadata-store';

// ============================================================================
// 1. 基础类型 (Primitive Types)
// ============================================================================

/**
 * 基础类型常量
 * 
 * 用于定义字段的基本数据类型
 */
export const PrimitiveTypes = {
  /** 字符串 */
  STRING: 'string',
  /** 整数 */
  INTEGER: 'integer',
  /** 浮点数 */
  FLOAT: 'float',
  /** 高精度小数（财务计算） */
  DECIMAL: 'decimal',
  /** 布尔值 */
  BOOLEAN: 'boolean',
  /** 日期（无时间，YYYY-MM-DD） */
  DATE: 'date',
  /** 时间（无日期，HH:mm:ss） */
  TIME: 'time',
  /** 日期时间（YYYY-MM-DD HH:mm:ss） */
  DATETIME: 'datetime',
  /** 时间戳（Unix timestamp） */
  TIMESTAMP: 'timestamp',
  /** UUID */
  UUID: 'uuid',
  /** 大文本 */
  TEXT: 'text',
  /** JSON 对象 */
  JSON: 'json',
  /** 二进制数据 */
  BINARY: 'binary',
} as const;

export type PrimitiveType = typeof PrimitiveTypes[keyof typeof PrimitiveTypes];

// ============================================================================
// 2. 枚举类型 (Enum Types)
// ============================================================================

/**
 * 枚举定义配置
 */
export interface EnumDefinitionConfig<T extends Record<string, string>> {
  /** 枚举名称 */
  name: string;
  /** 注释说明 */
  comment?: string;
  /** 枚举值 { KEY: 'label' } */
  values: T;
}

/**
 * 枚举类型返回值
 */
export type EnumType<T extends Record<string, string>> = {
  /** 枚举值到标签的映射 */
  values: { [K in keyof T]: { value: K; label: T[K] } };
  /** 获取标签 */
  getLabel: (value: string) => string | undefined;
  /** 获取所有选项（用于下拉框等） */
  getOptions: () => Array<{ value: string; label: string }>;
  /** 枚举名称 */
  name: string;
  /** 注释 */
  comment?: string;
  /** 类型标识 */
  __type: 'enum';
} & {
  /** 枚举值（KEY -> KEY） */
  [K in keyof T]: K;
};

/**
 * 定义枚举类型（类型系统版本）
 * 
 * 注意：这是 defineTypedEnum 的别名，推荐使用 defineTypedEnum
 * 
 * @example
 * ```typescript
 * export const OrderStatus = createEnumType({
 *   name: 'OrderStatus',
 *   comment: '订单状态',
 *   values: {
 *     DRAFT: '草稿',
 *     PENDING: '待审批',
 *     APPROVED: '已审批',
 *   },
 * });
 * ```
 */
export function createEnumType<T extends Record<string, string>>(
  config: EnumDefinitionConfig<T>
): EnumType<T> {
  const { name: enumName, comment, values: valueLabels } = config;
  
  // 构建 values 对象
  const values = {} as { [K in keyof T]: { value: K; label: T[K] } };
  
  // 创建结果对象
  const result = {
    name: enumName,
    comment,
    values,
    __type: 'enum' as const,
    
    getLabel(value: string): string | undefined {
      const entry = values[value as keyof T];
      return entry?.label;
    },
    
    getOptions(): Array<{ value: string; label: string }> {
      return Object.values(values) as Array<{ value: string; label: string }>;
    },
  } as EnumType<T>;
  
  // 添加枚举值和 values 映射
  for (const key of Object.keys(valueLabels)) {
    const typedKey = key as keyof T;
    (result as Record<string, unknown>)[key] = key;
    values[typedKey] = {
      value: key as keyof T,
      label: valueLabels[typedKey],
    } as { value: keyof T; label: T[keyof T] };
  }
  
  // 注册到 Metadata Store
  registerMetadata({
    name: enumName,
    comment,
    values,
    __type: 'enum',
  });
  
  return result;
}

// ============================================================================
// 3. 对象类型 (Object Types)
// ============================================================================

/**
 * 对象类型分类
 */
export const ObjectTypes = {
  /** 实体（有唯一标识，可持久化） */
  ENTITY: 'entity',
  /** 值对象（无唯一标识，不可变） */
  VALUE_OBJECT: 'valueObject',
  /** 数据传输对象 */
  DTO: 'dto',
  /** 聚合根 */
  AGGREGATE_ROOT: 'aggregateRoot',
} as const;

export type ObjectType = typeof ObjectTypes[keyof typeof ObjectTypes];

/**
 * 类型字段定义
 */
export interface TypeFieldDefinition {
  /** 字段类型（基础类型） */
  type: PrimitiveType | 'enum' | 'object' | 'array' | 'reference';
  /** 字段标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  default?: unknown;
  /** 是否为主键 */
  primaryKey?: boolean;
  /** 枚举引用（当 type 为 'enum' 时） */
  enumType?: EnumType<Record<string, string>>;
  /** 对象引用（当 type 为 'object' 时） */
  objectType?: ObjectDefinition;
  /** 数组元素类型（当 type 为 'array' 时） */
  itemType?: PrimitiveType | ObjectDefinition;
  /** 引用目标（当 type 为 'reference' 时） */
  refType?: ObjectDefinition;
  /** 验证规则 */
  validation?: ValidationConfig;
}

/**
 * 验证配置
 */
export interface ValidationConfig {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 正则表达式 */
  pattern?: RegExp;
  /** 自定义验证函数 */
  custom?: (value: unknown) => boolean;
  /** 错误消息 */
  message?: string;
}

/**
 * 对象定义
 */
export interface ObjectDefinition {
  /** 对象名称 */
  name: string;
  /** 对象类型 */
  __type: ObjectType;
  /** 注释说明 */
  comment?: string;
  /** 数据库表名（仅 Entity） */
  table?: string;
  /** 字段定义 */
  fields: Record<string, TypeFieldDefinition>;
}

// ============================================================================
// 4. 集合类型 (Collection Types)
// ============================================================================

/**
 * 集合类型常量
 */
export const CollectionTypes = {
  /** 数组/列表 */
  ARRAY: 'array',
  /** 集合（无重复） */
  SET: 'set',
  /** 映射/字典 */
  MAP: 'map',
} as const;

export type CollectionType = typeof CollectionTypes[keyof typeof CollectionTypes];

/**
 * 集合定义配置
 */
export interface CollectionDefinition {
  /** 集合类型 */
  type: CollectionType;
  /** 元素类型 */
  itemType: PrimitiveType | ObjectDefinition | EnumType<Record<string, string>>;
  /** 键类型（仅 Map） */
  keyType?: PrimitiveType;
  /** 最小元素数 */
  minItems?: number;
  /** 最大元素数 */
  maxItems?: number;
}

// ============================================================================
// 5. 引用类型 (Reference Types)
// ============================================================================

/**
 * 引用/关系类型常量
 */
export const ReferenceTypes = {
  /** 一对一 */
  ONE_TO_ONE: 'OneToOne',
  /** 一对多 */
  ONE_TO_MANY: 'OneToMany',
  /** 多对一 */
  MANY_TO_ONE: 'ManyToOne',
  /** 多对多 */
  MANY_TO_MANY: 'ManyToMany',
  /** 组合（强依赖，级联删除） */
  COMPOSITION: 'Composition',
  /** 聚合（弱依赖，不级联删除） */
  AGGREGATION: 'Aggregation',
} as const;

export type ReferenceType = typeof ReferenceTypes[keyof typeof ReferenceTypes];

/**
 * 级联操作类型
 */
export const CascadeOperations = {
  /** 级联插入 */
  INSERT: 'insert',
  /** 级联更新 */
  UPDATE: 'update',
  /** 级联删除 */
  REMOVE: 'remove',
  /** 全部级联 */
  ALL: 'all',
  /** 无级联 */
  NONE: 'none',
} as const;

export type CascadeOperation = typeof CascadeOperations[keyof typeof CascadeOperations];

/**
 * 引用定义配置
 */
export interface ReferenceDefinition {
  /** 引用类型 */
  type: ReferenceType;
  /** 目标对象 */
  target: ObjectDefinition | (() => ObjectDefinition);
  /** 级联操作 */
  cascade?: CascadeOperation[];
  /** 是否嵌入（值对象场景） */
  embedded?: boolean;
  /** 外键字段名 */
  foreignKey?: string;
  /** 反向引用字段名 */
  mappedBy?: string;
  /** 是否懒加载 */
  lazy?: boolean;
}

// ============================================================================
// 6. 复合类型定义器 (Composite Type Definers)
// ============================================================================

/**
 * 定义值对象
 */
export interface ValueObjectConfig {
  name: string;
  comment?: string;
  fields: Record<string, FieldConfig>;
}

/**
 * 定义实体
 */
export interface EntityConfig {
  name: string;
  table?: string;
  comment?: string;
  fields: Record<string, FieldConfig>;
}

/**
 * 字段配置（简化版）
 */
export type FieldConfig = {
  type: PrimitiveType | 'enum' | 'object' | 'array' | 'reference';
  label: string;
  required?: boolean;
  default?: unknown;
  primaryKey?: boolean;
  validation?: ValidationConfig;
  // 类型特定配置
  enumType?: EnumType<Record<string, string>>;
  itemType?: PrimitiveType | ObjectDefinition;
  target?: ObjectDefinition | (() => ObjectDefinition);
  relation?: ReferenceType;
  cascade?: CascadeOperation[];
  embedded?: boolean;
};

// ============================================================================
// 7. 类型守卫 (Type Guards)
// ============================================================================

/**
 * 判断是否为基础类型
 */
export function isPrimitiveType(type: string): type is PrimitiveType {
  return Object.values(PrimitiveTypes).includes(type as PrimitiveType);
}

/**
 * 判断是否为枚举类型
 */
export function isEnumType(value: unknown): value is EnumType<Record<string, string>> {
  return typeof value === 'object' && value !== null && (value as { __type?: string }).__type === 'enum';
}

/**
 * 判断是否为对象类型
 */
export function isObjectType(value: unknown): value is ObjectDefinition {
  return typeof value === 'object' && value !== null && 
    Object.values(ObjectTypes).includes((value as { __type?: string }).__type as ObjectType);
}

/**
 * 判断是否为集合类型
 */
export function isCollectionType(type: string): type is CollectionType {
  return Object.values(CollectionTypes).includes(type as CollectionType);
}

/**
 * 判断是否为引用类型
 */
export function isReferenceType(type: string): type is ReferenceType {
  return Object.values(ReferenceTypes).includes(type as ReferenceType);
}

// ============================================================================
// 8. 类型工具 (Type Utilities)
// ============================================================================

/**
 * 获取类型的 TypeScript 类型字符串
 */
export function getTypeScriptType(type: PrimitiveType): string {
  const mapping: Record<PrimitiveType, string> = {
    string: 'string',
    integer: 'number',
    float: 'number',
    decimal: 'number',
    boolean: 'boolean',
    date: 'Date',
    time: 'string',
    datetime: 'Date',
    timestamp: 'number',
    uuid: 'string',
    text: 'string',
    json: 'Record<string, unknown>',
    binary: 'ArrayBuffer',
  };
  return mapping[type] || 'unknown';
}

/**
 * 获取类型的数据库类型字符串（PostgreSQL）
 */
export function getDatabaseType(type: PrimitiveType): string {
  const mapping: Record<PrimitiveType, string> = {
    string: 'VARCHAR(255)',
    integer: 'INTEGER',
    float: 'DOUBLE PRECISION',
    decimal: 'DECIMAL(18,4)',
    boolean: 'BOOLEAN',
    date: 'DATE',
    time: 'TIME',
    datetime: 'TIMESTAMP',
    timestamp: 'BIGINT',
    uuid: 'UUID',
    text: 'TEXT',
    json: 'JSONB',
    binary: 'BYTEA',
  };
  return mapping[type] || 'TEXT';
}

// ============================================================================
// 9. 导出汇总
// ============================================================================

/**
 * 所有类型常量
 */
export const Types = {
  Primitive: PrimitiveTypes,
  Object: ObjectTypes,
  Collection: CollectionTypes,
  Reference: ReferenceTypes,
  Cascade: CascadeOperations,
} as const;

