/**
 * 模型层 DSL 定义
 * 
 * 提供统一的 DSL 语法来定义 Entity、Embeddable、Enum
 * 定义时自动注册到 Metadata Store
 */

import { registerMetadata } from './metadata-store';

// ==================== 类型常量（推荐使用，有 IDE 自动补全） ====================

/**
 * 字段类型常量
 * 
 * @example
 * ```typescript
 * { type: FieldTypes.STRING, label: '名称' }
 * ```
 */
export const FieldTypes = {
  /** 字符串 */
  STRING: 'string',
  /** 数字 */
  NUMBER: 'number',
  /** 高精度小数 */
  DECIMAL: 'decimal',
  /** 布尔值 */
  BOOLEAN: 'boolean',
  /** 日期（无时间） */
  DATE: 'date',
  /** 日期时间 */
  DATETIME: 'datetime',
  /** 枚举引用 */
  ENUM: 'enum',
  /** 组合（关联其他实体/值对象） */
  COMPOSITION: 'composition',
} as const;

/**
 * 关系类型常量
 * 
 * @example
 * ```typescript
 * { relation: RelationTypes.ONE_TO_MANY }
 * ```
 */
export const RelationTypes = {
  /** 一对一 */
  ONE_TO_ONE: 'OneToOne',
  /** 一对多 */
  ONE_TO_MANY: 'OneToMany',
  /** 多对一 */
  MANY_TO_ONE: 'ManyToOne',
  /** 多对多 */
  MANY_TO_MANY: 'ManyToMany',
} as const;

/**
 * 级联操作类型常量
 * 
 * @example
 * ```typescript
 * { cascade: [CascadeTypes.INSERT, CascadeTypes.UPDATE] }
 * ```
 */
export const CascadeTypes = {
  /** 级联插入 */
  INSERT: 'insert',
  /** 级联更新 */
  UPDATE: 'update',
  /** 级联删除 */
  REMOVE: 'remove',
  /** 全部级联 */
  ALL: 'all',
} as const;

// ==================== 类型定义（从常量推断，保持向后兼容） ====================

/** 字段类型 */
export type FieldType = typeof FieldTypes[keyof typeof FieldTypes];

/** 关系类型 */
export type RelationType = typeof RelationTypes[keyof typeof RelationTypes];

/** 级联类型 */
export type CascadeType = typeof CascadeTypes[keyof typeof CascadeTypes];

/** 验证规则 */
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
  message?: string;
}

/** 字段定义 */
export interface FieldDefinition {
  type: FieldType;
  label: string;
  required?: boolean;
  primaryKey?: boolean;
  default?: unknown;
  validation?: ValidationRule;
  // 枚举字段
  enumType?: EnumDefinition;
  // 组合字段
  target?: EmbeddableDefinition | EntityDefinition;
  relation?: RelationType;
  embedded?: boolean;
  cascade?: CascadeType[];
}

/** 字段集合 */
export type FieldsDefinition = Record<string, FieldDefinition>;

// ==================== Enum DSL ====================

/** 枚举值定义 */
export interface EnumValueDefinition {
  value: string;
  label: string;
  description?: string;
}

/** 枚举定义 */
export interface EnumDefinition {
  name: string;
  comment?: string;
  values: Record<string, EnumValueDefinition>;
  __type: 'enum';
}

/**
 * 定义枚举
 * 
 * @example
 * ```typescript
 * export const OrderStatus = defineEnum({
 *   name: 'OrderStatus',
 *   values: {
 *     DRAFT: { value: 'DRAFT', label: '草稿' },
 *     APPROVED: { value: 'APPROVED', label: '已审批' },
 *   },
 * });
 * ```
 */
export function defineEnum(definition: Omit<EnumDefinition, '__type'>): EnumDefinition {
  const result: EnumDefinition = {
    ...definition,
    __type: 'enum',
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== Embeddable DSL ====================

/** 嵌入对象定义 */
export interface EmbeddableDefinition {
  name: string;
  table?: string;
  comment?: string;
  fields: FieldsDefinition;
  __type: 'embeddable';
}

/**
 * 定义嵌入对象
 * 
 * 符合 ORM 框架命名习惯（如 JPA @Embeddable）
 * 
 * @example
 * ```typescript
 * export const Address = defineEmbeddable({
 *   name: 'Address',
 *   fields: {
 *     street: { type: 'string', label: '街道' },
 *     city: { type: 'string', label: '城市' },
 *   },
 * });
 * ```
 */
export function defineEmbeddable(definition: Omit<EmbeddableDefinition, '__type'>): EmbeddableDefinition {
  const result: EmbeddableDefinition = {
    ...definition,
    __type: 'embeddable',
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== Entity DSL ====================

/** 实体定义 */
export interface EntityDefinition {
  name: string;
  table: string;
  comment?: string;
  fields: FieldsDefinition;
  __type: 'entity';
}

/**
 * 定义实体（聚合根）
 * 
 * @example
 * ```typescript
 * export const Order = defineEntity({
 *   name: 'Order',
 *   table: 'orders',
 *   fields: {
 *     id: { type: 'string', label: 'ID', primaryKey: true },
 *     orderNo: { type: 'string', label: '订单号', required: true },
 *     items: { 
 *       type: 'composition', 
 *       label: '明细',
 *       target: OrderItem,
 *       relation: 'OneToMany',
 *     },
 *   },
 * });
 * ```
 */
export function defineEntity(definition: Omit<EntityDefinition, '__type'>): EntityDefinition {
  const result: EntityDefinition = {
    ...definition,
    __type: 'entity',
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== 工具函数 ====================

/**
 * 从 Entity/Embeddable 定义生成 TypeScript 类型
 */
export function getFieldTypeString(field: FieldDefinition): string {
  switch (field.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'decimal':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'datetime':
      return 'Date';
    case 'enum':
      return field.enumType?.name || 'string';
    case 'composition':
      if (field.relation === 'OneToMany' || field.relation === 'ManyToMany') {
        return `${field.target?.name}[]`;
      }
      return field.target?.name || 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * 获取实体的所有字段名
 */
export function getFieldNames(definition: EntityDefinition | EmbeddableDefinition): string[] {
  return Object.keys(definition.fields);
}

/**
 * 获取实体的主键字段
 */
export function getPrimaryKeyField(definition: EntityDefinition): string | undefined {
  for (const [name, field] of Object.entries(definition.fields)) {
    if (field.primaryKey) {
      return name;
    }
  }
  return undefined;
}

/**
 * 获取必填字段
 */
export function getRequiredFields(definition: EntityDefinition | EmbeddableDefinition): string[] {
  return Object.entries(definition.fields)
    .filter(([, field]) => field.required)
    .map(([name]) => name);
}

