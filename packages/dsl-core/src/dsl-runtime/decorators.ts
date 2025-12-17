/**
 * DSL 装饰器
 * 
 * 提供装饰器语法糖，底层转换为 DSL 并注册到 Metadata Store
 * 
 * @example
 * ```typescript
 * @Entity('purchase_orders')
 * class PurchaseOrder {
 *   @PrimaryKey()
 *   @Column({ type: FieldTypes.STRING, label: 'ID' })
 *   id: string;
 * 
 *   @Column({ type: FieldTypes.STRING, label: '订单编号', required: true })
 *   orderNo: string;
 * }
 * ```
 */

import 'reflect-metadata';
import { registerMetadata } from './metadata-store';
import { FieldTypes, RelationTypes, CascadeTypes, type FieldType, type RelationType, type CascadeType } from './model-dsl';

// ==================== 元数据 Key ====================

const ENTITY_METADATA_KEY = Symbol('entity');
const VALUE_OBJECT_METADATA_KEY = Symbol('valueObject');
const DTO_METADATA_KEY = Symbol('dto');
const ENUM_METADATA_KEY = Symbol('enum');
const COLUMN_METADATA_KEY = Symbol('column');
const PRIMARY_KEY_METADATA_KEY = Symbol('primaryKey');
const RELATION_METADATA_KEY = Symbol('relation');
const ENUM_VALUE_METADATA_KEY = Symbol('enumValue');
const INDEX_METADATA_KEY = Symbol('index');

// ==================== 类型定义 ====================

/** 列配置 */
export interface ColumnOptions {
  type: FieldType;
  label: string;
  required?: boolean;
  default?: unknown;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  };
}

/** 关系配置 */
export interface RelationOptions {
  type: RelationType;
  target: () => new (...args: unknown[]) => unknown;
  cascade?: CascadeType[];
  embedded?: boolean;
}

/** 实体配置 */
export interface EntityOptions {
  table?: string;
  comment?: string;
}

/** DTO 配置 */
export interface DTOOptions {
  comment?: string;
  pagination?: boolean;
}

/** 枚举值配置 */
export interface EnumValueOptions {
  value: string;
  label: string;
}

/** 枚举配置 */
export interface EnumOptions {
  comment?: string;
}

// ==================== 装饰器实现 ====================

/**
 * 实体装饰器
 * 
 * @example
 * ```typescript
 * @Entity('purchase_orders')
 * class PurchaseOrder { ... }
 * ```
 */
export function Entity(tableOrOptions?: string | EntityOptions): ClassDecorator {
  return function (target: Function) {
    const options: EntityOptions = typeof tableOrOptions === 'string' 
      ? { table: tableOrOptions }
      : tableOrOptions || {};
    
    // 获取类上定义的所有字段元数据
    const columns = Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || {};
    const primaryKeys = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target.prototype) || [];
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || {};
    const indexes = Reflect.getMetadata(INDEX_METADATA_KEY, target.prototype) || [];
    
    // 构建字段定义
    const fields: Record<string, unknown> = {};
    
    for (const [propertyKey, columnOptions] of Object.entries(columns) as [string, ColumnOptions][]) {
      // 检查该字段是否有索引
      const fieldIndex = indexes.find((idx: { fieldName: string }) => idx.fieldName === propertyKey);
      
      fields[propertyKey] = {
        type: columnOptions.type,
        label: columnOptions.label,
        required: columnOptions.required,
        default: columnOptions.default,
        validation: columnOptions.validation,
        primaryKey: primaryKeys.includes(propertyKey),
        // 索引信息
        index: fieldIndex ? {
          unique: fieldIndex.unique,
          name: fieldIndex.name,
        } : undefined,
      };
    }
    
    // 添加关系字段
    for (const [propertyKey, relationOptions] of Object.entries(relations) as [string, RelationOptions][]) {
      fields[propertyKey] = {
        type: FieldTypes.COMPOSITION,
        label: propertyKey,
        relation: relationOptions.type,
        target: relationOptions.target,
        cascade: relationOptions.cascade,
        embedded: relationOptions.embedded,
      };
    }
    
    // 收集复合索引（多列索引）
    const compositeIndexes = indexes
      .filter((idx: { columns?: string[] }) => idx.columns && idx.columns.length > 0)
      .map((idx: { fieldName: string; name?: string; unique?: boolean; columns?: string[] }) => ({
        name: idx.name || `idx_${target.name.toLowerCase()}_${idx.fieldName}`,
        columns: [idx.fieldName, ...(idx.columns || [])],
        unique: idx.unique,
      }));
    
    // 构建实体定义
    const entityDefinition = {
      name: target.name,
      table: options.table || target.name.toLowerCase() + 's',
      comment: options.comment,
      fields,
      indexes: compositeIndexes.length > 0 ? compositeIndexes : undefined,  // 复合索引
      __type: 'entity' as const,
      __class: target,  // 保留类引用
    };
    
    // 存储到类上
    Reflect.defineMetadata(ENTITY_METADATA_KEY, entityDefinition, target);
    
    // 注册到 Metadata Store
    registerMetadata(entityDefinition);
    
    console.log(`[Decorator] 已注册实体: ${target.name}`);
  };
}

/**
 * 嵌入对象装饰器
 * 
 * 用于定义嵌入在实体中的值对象，符合 ORM 框架命名习惯（如 JPA @Embeddable）
 * 
 * @example
 * ```typescript
 * @Embeddable({ comment: '地址信息' })
 * export class Address {
 *   @Column({ type: FieldTypes.STRING, label: '街道' })
 *   street!: string;
 * }
 * ```
 */
export function Embeddable(options?: { comment?: string }): ClassDecorator {
  return function (target: Function) {
    const columns = Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || {};
    
    const fields: Record<string, unknown> = {};
    for (const [propertyKey, columnOptions] of Object.entries(columns) as [string, ColumnOptions][]) {
      fields[propertyKey] = {
        type: columnOptions.type,
        label: columnOptions.label,
        required: columnOptions.required,
        default: columnOptions.default,
        validation: columnOptions.validation,
      };
    }
    
    const embeddableDefinition = {
      name: target.name,
      comment: options?.comment,
      fields,
      __type: 'embeddable' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(VALUE_OBJECT_METADATA_KEY, embeddableDefinition, target);
    registerMetadata(embeddableDefinition);
    
    console.log(`[Decorator] 已注册嵌入对象: ${target.name}`);
  };
}

/**
 * DTO 装饰器
 * 
 * @example
 * ```typescript
 * @DTO({ comment: '订单列表项' })
 * class OrderListItemDTO {
 *   @Field({ type: FieldTypes.STRING, label: 'ID', required: true })
 *   id!: string;
 * }
 * ```
 */
export function DTO(options?: DTOOptions): ClassDecorator {
  return function (target: Function) {
    const columns = Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || {};
    
    const fields: Record<string, unknown> = {};
    for (const [propertyKey, columnOptions] of Object.entries(columns) as [string, ColumnOptions][]) {
      fields[propertyKey] = {
        type: columnOptions.type,
        label: columnOptions.label,
        required: columnOptions.required,
      };
    }
    
    const dtoDefinition = {
      name: target.name,
      comment: options?.comment,
      pagination: options?.pagination,
      fields,
      __type: 'dto' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(DTO_METADATA_KEY, dtoDefinition, target);
    registerMetadata(dtoDefinition);
    
    console.log(`[Decorator] 已注册 DTO: ${target.name}`);
  };
}

/**
 * 枚举装饰器（类版本）
 * 
 * @example
 * ```typescript
 * @Enum({ comment: '订单状态' })
 * class OrderStatus {
 *   @EnumValue({ value: 'DRAFT', label: '草稿' })
 *   static DRAFT: string;
 * }
 * ```
 */
export function Enum(options?: EnumOptions): ClassDecorator {
  return function (target: Function) {
    const enumValues = Reflect.getMetadata(ENUM_VALUE_METADATA_KEY, target) || {};
    
    // 构建枚举值
    const values: Record<string, { value: string; label: string }> = {};
    for (const [key, valueOptions] of Object.entries(enumValues) as [string, EnumValueOptions][]) {
      values[key] = {
        value: valueOptions.value,
        label: valueOptions.label,
      };
      // 同时设置静态属性值
      (target as unknown as Record<string, unknown>)[key] = valueOptions.value;
    }
    
    // 🎯 添加 values 静态属性到类上，兼容函数式 DSL 的访问方式
    (target as unknown as Record<string, unknown>)['values'] = values;
    
    const enumDefinition = {
      name: target.name,
      comment: options?.comment,
      values,
      __type: 'enum' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(ENUM_METADATA_KEY, enumDefinition, target);
    registerMetadata(enumDefinition);
    
    console.log(`[Decorator] 已注册枚举: ${target.name}`);
  };
}

/**
 * 枚举值装饰器
 * 
 * @example
 * ```typescript
 * @EnumValue({ value: 'DRAFT', label: '草稿' })
 * static DRAFT: string;
 * ```
 */
export function EnumValue(options: EnumValueOptions): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const enumValues = Reflect.getMetadata(ENUM_VALUE_METADATA_KEY, target) || {};
    enumValues[propertyKey as string] = options;
    Reflect.defineMetadata(ENUM_VALUE_METADATA_KEY, enumValues, target);
  };
}

// ==================== 原生枚举增强 ====================

/** 枚举标签映射配置 */
export interface EnumLabelsConfig<T extends Record<string, string | number>> {
  /** 枚举名称（必填，用于注册和显示） */
  name: string;
  /** 枚举标签 */
  labels: { [K in keyof T]: string };
  /** 注释说明 */
  comment?: string;
}

/** 增强后的枚举类型 */
export interface EnhancedEnum<T extends Record<string, string | number>> {
  /** 原生枚举对象 */
  enum: T;
  /** 枚举值到标签的映射 */
  values: { [K in keyof T]: { value: T[K]; label: string } };
  /** 获取标签 */
  getLabel: (value: T[keyof T]) => string | undefined;
  /** 获取所有选项（用于下拉框等） */
  getOptions: () => Array<{ value: T[keyof T]; label: string }>;
  /** 枚举名称 */
  name: string;
  /** 注释 */
  comment?: string;
}

/**
 * 增强原生 TypeScript 枚举
 * 
 * 🎯 使用原生枚举语法，通过函数添加元数据
 * 
 * @example
 * ```typescript
 * // 1. 定义原生枚举
 * enum OrderStatusEnum {
 *   DRAFT = 'DRAFT',
 *   PENDING = 'PENDING',
 *   APPROVED = 'APPROVED',
 * }
 * 
 * // 2. 增强枚举（添加标签等元数据）
 * export const OrderStatus = registerEnum(OrderStatusEnum, {
 *   name: 'OrderStatus',
 *   comment: '订单状态',
 *   labels: {
 *     DRAFT: '草稿',
 *     PENDING: '待审批',
 *     APPROVED: '已审批',
 *   },
 * });
 * ```
 */
export function registerEnum<T extends Record<string, string | number>>(
  enumObj: T,
  config: EnumLabelsConfig<T>
): EnhancedEnum<T> {
  const enumName = config.name;
  
  // 构建 values 对象
  const values = {} as { [K in keyof T]: { value: T[K]; label: string } };
  
  // 遍历枚举键（排除反向映射的数字键）
  for (const key of Object.keys(enumObj)) {
    // 跳过数字键（TypeScript 数字枚举的反向映射）
    if (!isNaN(Number(key))) continue;
    
    const typedKey = key as keyof T;
    values[typedKey] = {
      value: enumObj[typedKey],
      label: config.labels[typedKey],
    };
  }
  
  // 创建增强枚举对象
  const enhanced: EnhancedEnum<T> = {
    enum: enumObj,
    values,
    name: enumName,
    comment: config.comment,
    
    getLabel(value: T[keyof T]): string | undefined {
      for (const key of Object.keys(values)) {
        if (values[key as keyof T].value === value) {
          return values[key as keyof T].label;
        }
      }
      return undefined;
    },
    
    getOptions(): Array<{ value: T[keyof T]; label: string }> {
      return Object.values(values) as Array<{ value: T[keyof T]; label: string }>;
    },
  };
  
  // 注册到 Metadata Store
  const enumDefinition = {
    name: enumName,
    comment: config.comment,
    values,
    __type: 'enum' as const,
    __enum: enumObj,
  };
  
  registerMetadata(enumDefinition);
  console.log(`[RegisterEnum] 已注册枚举: ${enumName}`);
  
  return enhanced;
}

// ==================== 一体化枚举定义 ====================

/** 一体化枚举定义配置 */
export interface TypedEnumConfig {
  /** 枚举名称 */
  name: string;
  /** 注释说明 */
  comment?: string;
  /** 枚举值和标签定义 { KEY: 'label' } */
  values: Record<string, string>;
}

/** 一体化枚举返回类型 */
export type TypedEnum<T extends Record<string, string>> = {
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
} & {
  /** 枚举值（KEY -> KEY） */
  [K in keyof T]: K;
};

/**
 * 一体化枚举定义
 * 
 * 🎯 一行代码同时定义枚举值和标签，自动注册到 Metadata Store
 * 
 * @example
 * ```typescript
 * // 🎯 一体化定义（推荐）
 * export const OrderStatus = defineTypedEnum({
 *   name: 'OrderStatus',
 *   comment: '订单状态',
 *   values: {
 *     DRAFT: '草稿',
 *     PENDING: '待审批',
 *     APPROVED: '已审批',
 *     IN_PROGRESS: '执行中',
 *     COMPLETED: '已完成',
 *     CANCELLED: '已取消',
 *   },
 * });
 * 
 * // 使用
 * OrderStatus.DRAFT              // 'DRAFT' - 枚举值
 * OrderStatus.getLabel('DRAFT')  // '草稿' - 获取标签
 * OrderStatus.values.DRAFT.label // '草稿' - 直接访问
 * OrderStatus.getOptions()       // [{ value: 'DRAFT', label: '草稿' }, ...]
 * 
 * // 类型使用
 * type Status = keyof typeof OrderStatus.values;  // 'DRAFT' | 'PENDING' | ...
 * ```
 */
export function defineTypedEnum<T extends Record<string, string>>(
  config: { name: string; comment?: string; values: T }
): TypedEnum<T> {
  const { name: enumName, comment, values: valueLabels } = config;
  
  // 构建 values 对象
  const values = {} as { [K in keyof T]: { value: K; label: T[K] } };
  
  // 创建结果对象，同时包含枚举值和辅助方法
  const result = {
    name: enumName,
    comment,
    values,
    
    getLabel(value: string): string | undefined {
      const entry = values[value as keyof T];
      return entry?.label;
    },
    
    getOptions(): Array<{ value: string; label: string }> {
      return Object.values(values) as Array<{ value: string; label: string }>;
    },
  } as TypedEnum<T> & { [K in keyof T]: K };
  
  // 添加枚举值和 values 映射
  for (const key of Object.keys(valueLabels)) {
    const typedKey = key as keyof T;
    // 设置枚举值：OrderStatus.DRAFT = 'DRAFT'
    (result as Record<string, unknown>)[key] = key;
    // 设置 values 映射：OrderStatus.values.DRAFT = { value: 'DRAFT', label: '草稿' }
    values[typedKey] = {
      value: key as keyof T,
      label: valueLabels[typedKey],
    } as { value: keyof T; label: T[keyof T] };
  }
  
  // 注册到 Metadata Store
  const enumDefinition = {
    name: enumName,
    comment,
    values,
    __type: 'enum' as const,
  };
  
  registerMetadata(enumDefinition);
  console.log(`[DefineTypedEnum] 已注册枚举: ${enumName}`);
  
  return result;
}

/**
 * Field 装饰器 - Column 的别名，用于 DTO
 */
export const Field = Column;

/**
 * 列装饰器
 * 
 * @example
 * ```typescript
 * @Column({ type: FieldTypes.STRING, label: '名称', required: true })
 * name: string;
 * ```
 */
export function Column(options: ColumnOptions): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const columns = Reflect.getMetadata(COLUMN_METADATA_KEY, target) || {};
    columns[propertyKey as string] = options;
    Reflect.defineMetadata(COLUMN_METADATA_KEY, columns, target);
  };
}

/**
 * 主键装饰器
 */
export function PrimaryKey(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const primaryKeys = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target) || [];
    primaryKeys.push(propertyKey as string);
    Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, primaryKeys, target);
  };
}

/**
 * 索引配置选项
 */
export interface IndexOptions {
  /** 索引名称（可选，默认自动生成） */
  name?: string;
  /** 是否唯一索引 */
  unique?: boolean;
  /** 复合索引的其他字段（当需要多列索引时） */
  columns?: string[];
}

/**
 * 索引装饰器
 * 
 * @example
 * ```typescript
 * @Entity({ table: 'orders' })
 * class Order {
 *   @Index()  // 普通索引
 *   @Column({ type: FieldTypes.STRING })
 *   orderNo!: string;
 * 
 *   @Index({ unique: true })  // 唯一索引
 *   @Column({ type: FieldTypes.STRING })
 *   email!: string;
 * 
 *   @Index({ name: 'idx_user_date', columns: ['userId', 'createdAt'] })  // 复合索引
 *   @Column({ type: FieldTypes.STRING })
 *   userId!: string;
 * }
 * ```
 */
export function Index(options: IndexOptions = {}): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const indexes = Reflect.getMetadata(INDEX_METADATA_KEY, target) || [];
    indexes.push({
      fieldName: propertyKey as string,
      ...options,
    });
    Reflect.defineMetadata(INDEX_METADATA_KEY, indexes, target);
  };
}

/**
 * 关系装饰器
 * 
 * @example
 * ```typescript
 * @Relation({ type: RelationTypes.ONE_TO_MANY, target: () => OrderItem })
 * items: OrderItem[];
 * ```
 */
export function Relation(options: RelationOptions): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || {};
    relations[propertyKey as string] = options;
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * 一对多关系装饰器
 */
export function OneToMany(target: () => new (...args: unknown[]) => unknown, cascade?: CascadeType[]): PropertyDecorator {
  return Relation({ type: RelationTypes.ONE_TO_MANY, target, cascade });
}

/**
 * 一对一关系装饰器
 */
export function OneToOne(target: () => new (...args: unknown[]) => unknown, cascade?: CascadeType[]): PropertyDecorator {
  return Relation({ type: RelationTypes.ONE_TO_ONE, target, cascade });
}

/**
 * 嵌入装饰器
 * 
 * 用于将 @Embeddable 标记的类嵌入到实体中
 * 
 * @example
 * ```typescript
 * @Entity({ table: 'orders' })
 * class Order {
 *   @Embedded(() => Address)
 *   shippingAddress!: Address;
 * }
 * ```
 */
export function Embedded(target: () => new (...args: unknown[]) => unknown): PropertyDecorator {
  return function (targetProto: Object, propertyKey: string | symbol) {
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, targetProto) || {};
    
    relations[propertyKey as string] = {
      type: 'embedded',
      target,
      embedded: true,
    };
    
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, targetProto);
  };
}

// ==================== 工具函数 ====================

/**
 * 获取实体定义
 */
export function getEntityDefinition(target: Function): unknown {
  return Reflect.getMetadata(ENTITY_METADATA_KEY, target);
}

/**
 * 获取嵌入对象定义
 */
export function getEmbeddableDefinition(target: Function): unknown {
  return Reflect.getMetadata(VALUE_OBJECT_METADATA_KEY, target);
}

/**
 * 获取 DTO 定义
 */
export function getDTODefinition(target: Function): unknown {
  return Reflect.getMetadata(DTO_METADATA_KEY, target);
}

// ==================== 领域逻辑装饰器 ====================

const DOMAIN_LOGIC_METADATA_KEY = Symbol('domainLogic');
const RULE_METADATA_KEY = Symbol('rule');

/** 规则类型 */
export const RuleTypes = {
  /** 验证规则 */
  VALIDATION: 'validation',
  /** 计算规则 */
  COMPUTATION: 'computation',
  /** 状态检查 */
  CHECK: 'check',
  /** 状态转换动作 */
  ACTION: 'action',
} as const;

export type RuleType = typeof RuleTypes[keyof typeof RuleTypes];

/** 规则配置 */
export interface RuleOptions {
  /** 规则类型 */
  type: RuleType;
  /** 规则描述 */
  description?: string;
  /** 验证失败消息（仅 validation 类型） */
  message?: string;
}

/** 业务逻辑配置 */
export interface LogicOptions {
  /** 逻辑名称（可选，默认使用类名） */
  name?: string;
  /** 描述 */
  description?: string;
}

/**
 * 业务逻辑装饰器
 * 
 * 用于定义业务逻辑类，配合 *.logic.ts 文件后缀使用
 * 
 * @example
 * ```typescript
 * @Logic({ description: '采购订单业务逻辑' })
 * class PurchaseOrderLogic {
 *   @Validation({ message: '订单编号格式错误' })
 *   static validateOrderNo(orderNo: string): boolean {
 *     return /^PO\d{8}$/.test(orderNo);
 *   }
 * 
 *   @Computation({ description: '计算订单总额' })
 *   static calculateTotal(items: Item[]): number {
 *     return items.reduce((sum, item) => sum + item.amount, 0);
 *   }
 * }
 * ```
 */
export function Logic(options?: LogicOptions): ClassDecorator {
  return function (target: Function) {
    const rules = Reflect.getMetadata(RULE_METADATA_KEY, target) || {};
    
    // 按类型分组
    const validations: Record<string, unknown> = {};
    const computations: Record<string, unknown> = {};
    const checks: Record<string, unknown> = {};
    const actions: Record<string, unknown> = {};
    
    for (const [methodName, ruleOptions] of Object.entries(rules) as [string, RuleOptions][]) {
      const method = (target as unknown as Record<string, unknown>)[methodName];
      const ruleDefinition = {
        name: methodName,
        description: ruleOptions.description,
        message: ruleOptions.message,
        method,
      };
      
      switch (ruleOptions.type) {
        case RuleTypes.VALIDATION:
          validations[methodName] = ruleDefinition;
          break;
        case RuleTypes.COMPUTATION:
          computations[methodName] = ruleDefinition;
          break;
        case RuleTypes.CHECK:
          checks[methodName] = ruleDefinition;
          break;
        case RuleTypes.ACTION:
          actions[methodName] = ruleDefinition;
          break;
      }
    }
    
    const logicDefinition = {
      name: options?.name || target.name,
      description: options?.description,
      validations,
      computations,
      checks,
      actions,
      __type: 'logic' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(DOMAIN_LOGIC_METADATA_KEY, logicDefinition, target);
    registerMetadata(logicDefinition);
    
    console.log(`[Decorator] 已注册业务逻辑: ${target.name}`);
  };
}

/**
 * 验证规则装饰器
 */
export function Validation(options?: { description?: string; message?: string }): MethodDecorator {
  return createRuleDecorator(RuleTypes.VALIDATION, options);
}

/**
 * 计算规则装饰器
 */
export function Computation(options?: { description?: string }): MethodDecorator {
  return createRuleDecorator(RuleTypes.COMPUTATION, options);
}

/**
 * 状态检查装饰器
 */
export function Check(options?: { description?: string }): MethodDecorator {
  return createRuleDecorator(RuleTypes.CHECK, options);
}

/**
 * 状态转换动作装饰器
 */
export function Action(options?: { description?: string }): MethodDecorator {
  return createRuleDecorator(RuleTypes.ACTION, options);
}

/**
 * 创建规则装饰器的工厂函数
 */
function createRuleDecorator(
  type: RuleType,
  options?: { description?: string; message?: string }
): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor
  ) {
    // 静态方法的 target 是构造函数
    const constructor = typeof target === 'function' ? target : target.constructor;
    const rules = Reflect.getMetadata(RULE_METADATA_KEY, constructor) || {};
    
    rules[propertyKey as string] = {
      type,
      description: options?.description,
      message: options?.message,
    };
    
    Reflect.defineMetadata(RULE_METADATA_KEY, rules, constructor);
  };
}

/**
 * 获取业务逻辑定义
 */
export function getLogicDefinition(target: Function): unknown {
  return Reflect.getMetadata(DOMAIN_LOGIC_METADATA_KEY, target);
}


// ==================== 服务层装饰器 ====================

const REPOSITORY_METADATA_KEY = Symbol('repository');
const SERVICE_METADATA_KEY = Symbol('service');
const APP_SERVICE_METADATA_KEY = Symbol('appService');
const METHOD_METADATA_KEY = Symbol('method');

/** Repository 配置 */
export interface RepositoryOptions {
  /** 仓储名称（可选，默认使用类名） */
  name?: string;
  /** 描述 */
  description?: string;
  /** 关联实体名称 */
  entity?: string;
  /** 数据库表名 */
  table?: string;
}

/** Service 配置 */
export interface ServiceOptions {
  /** 服务名称（可选，默认使用类名） */
  name?: string;
  /** 描述 */
  description?: string;
}

/** AppService 配置 */
export interface AppServiceOptions {
  /** 服务名称（可选，默认使用类名） */
  name?: string;
  /** 描述 */
  description?: string;
  /** 是否暴露给外部 */
  expose?: boolean;
}

/** 方法配置 */
export interface MethodOptions {
  /** 方法描述 */
  description?: string;
  /** 是否为查询方法 */
  query?: boolean;
  /** 是否为命令方法 */
  command?: boolean;
}

/**
 * Repository 装饰器
 * 
 * @example
 * ```typescript
 * @Repository({ entity: 'PurchaseOrder', table: 'purchase_orders' })
 * class PurchaseOrderRepository {
 *   @Method({ description: '根据ID查询', query: true })
 *   static async findById(id: string): Promise<PurchaseOrder | null> { ... }
 * }
 * ```
 */
export function Repository(options?: RepositoryOptions): ClassDecorator {
  return function (target: Function) {
    const methods = Reflect.getMetadata(METHOD_METADATA_KEY, target) || {};
    
    const repositoryDefinition = {
      name: options?.name || target.name,
      description: options?.description,
      entity: options?.entity,
      table: options?.table,
      methods,
      __type: 'repository' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(REPOSITORY_METADATA_KEY, repositoryDefinition, target);
    registerMetadata(repositoryDefinition);
    
    console.log(`[Decorator] 已注册仓储: ${target.name}`);
  };
}

/**
 * Service 装饰器（领域服务）
 * 
 * @example
 * ```typescript
 * @Service({ description: '采购订单业务服务' })
 * class PurchaseOrderService {
 *   @Method({ description: '创建订单', command: true })
 *   static async createOrder(data: CreateOrderDTO): Promise<string> { ... }
 * }
 * ```
 */
export function Service(options?: ServiceOptions): ClassDecorator {
  return function (target: Function) {
    const methods = Reflect.getMetadata(METHOD_METADATA_KEY, target) || {};
    
    const serviceDefinition = {
      name: options?.name || target.name,
      description: options?.description,
      methods,
      __type: 'service' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(SERVICE_METADATA_KEY, serviceDefinition, target);
    registerMetadata(serviceDefinition);
    
    console.log(`[Decorator] 已注册服务: ${target.name}`);
  };
}

/**
 * AppService 装饰器（应用服务）
 * 
 * @example
 * ```typescript
 * @AppService({ description: '采购订单应用服务', expose: true })
 * class PurchaseOrderAppService {
 *   @Method({ description: '获取订单列表', query: true })
 *   static async getPurchaseOrderList(query: QueryDTO): Promise<Result<PageResult>> { ... }
 * }
 * ```
 */
export function AppService(options?: AppServiceOptions): ClassDecorator {
  return function (target: Function) {
    const methods = Reflect.getMetadata(METHOD_METADATA_KEY, target) || {};
    
    const appServiceDefinition = {
      name: options?.name || target.name,
      description: options?.description,
      expose: options?.expose ?? true,
      methods,
      __type: 'appService' as const,
      __class: target,
    };
    
    Reflect.defineMetadata(APP_SERVICE_METADATA_KEY, appServiceDefinition, target);
    registerMetadata(appServiceDefinition);
    
    console.log(`[Decorator] 已注册应用服务: ${target.name}`);
  };
}

/**
 * Method 装饰器（标记服务方法）
 * 
 * @example
 * ```typescript
 * @Method({ description: '获取订单详情', query: true })
 * static async getOrderDetail(id: string): Promise<Order> { ... }
 * ```
 */
export function Method(options?: MethodOptions): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor
  ) {
    const constructor = typeof target === 'function' ? target : target.constructor;
    const methods = Reflect.getMetadata(METHOD_METADATA_KEY, constructor) || {};
    
    methods[propertyKey as string] = {
      name: propertyKey as string,
      description: options?.description,
      query: options?.query,
      command: options?.command,
    };
    
    Reflect.defineMetadata(METHOD_METADATA_KEY, methods, constructor);
  };
}

/**
 * 获取 Repository 定义
 */
export function getRepositoryDefinition(target: Function): unknown {
  return Reflect.getMetadata(REPOSITORY_METADATA_KEY, target);
}

/**
 * 获取 Service 定义
 */
export function getServiceDefinition(target: Function): unknown {
  return Reflect.getMetadata(SERVICE_METADATA_KEY, target);
}

/**
 * 获取 AppService 定义
 */
export function getAppServiceDefinition(target: Function): unknown {
  return Reflect.getMetadata(APP_SERVICE_METADATA_KEY, target);
}
