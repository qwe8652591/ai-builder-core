/**
 * DTO 层 DSL 定义
 * 
 * 提供统一的 DSL 语法来定义 DTO（数据传输对象）
 * 定义时自动注册到 Metadata Store
 */

import type { FieldDefinition, EntityDefinition, ValueObjectDefinition, EnumDefinition } from './model-dsl';
import { registerMetadata } from './metadata-store';

// ==================== 类型常量（推荐使用，有 IDE 自动补全）====================

/**
 * DTO 字段类型常量
 * 
 * @example
 * ```typescript
 * { type: DTOFieldTypes.STRING, label: '名称' }
 * ```
 */
export const DTOFieldTypes = {
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
  /** 数组 */
  ARRAY: 'array',
  /** 对象 */
  OBJECT: 'object',
  /** 组合（关联其他 DTO） */
  COMPOSITION: 'composition',
} as const;

/**
 * 常量类型常量
 * 
 * @example
 * ```typescript
 * { type: ConstantTypes.MAP, value: { ... } }
 * ```
 */
export const ConstantTypes = {
  /** 键值对映射 */
  MAP: 'map',
  /** 数组 */
  ARRAY: 'array',
  /** 单一值 */
  VALUE: 'value',
} as const;

// ==================== 类型定义（从常量推断，保持向后兼容）====================

/** DTO 字段类型 */
export type DTOFieldType = typeof DTOFieldTypes[keyof typeof DTOFieldTypes];

/** DTO 字段定义 */
export interface DTOFieldDefinition<T extends DTOFieldType = DTOFieldType, R extends boolean = boolean> {
  type: T;
  label: string;
  required?: R;
  computed?: string;  // 计算表达式
  enumType?: EnumDefinition;
  itemType?: DTODefinition;  // 数组项类型
}

/** DTO 字段集合 */
export type DTOFieldsDefinition = Record<string, DTOFieldDefinition>;

// ==================== 类型推断工具 ====================

/**
 * 从字段类型推断 TypeScript 类型
 */
export type InferFieldType<T extends DTOFieldType> = 
  T extends 'string' ? string :
  T extends 'number' ? number :
  T extends 'decimal' ? number :
  T extends 'boolean' ? boolean :
  T extends 'date' ? Date :
  T extends 'datetime' ? Date :
  T extends 'enum' ? string :
  T extends 'array' ? unknown[] :
  T extends 'object' ? Record<string, unknown> :
  T extends 'composition' ? unknown :
  unknown;

/**
 * 从单个字段定义推断类型
 */
type InferSingleField<F extends DTOFieldDefinition> = 
  F['required'] extends true 
    ? InferFieldType<F['type']>
    : InferFieldType<F['type']> | undefined;

/**
 * 从字段集合推断对象类型
 * 
 * @example
 * ```typescript
 * const fields = {
 *   id: { type: 'string' as const, label: 'ID', required: true as const },
 *   name: { type: 'string' as const, label: '名称' },
 * };
 * type Result = InferDTOFields<typeof fields>;
 * // { id: string; name?: string }
 * ```
 */
export type InferDTOFields<T extends Record<string, DTOFieldDefinition>> = {
  // 必填字段
  [K in keyof T as T[K]['required'] extends true ? K : never]: InferFieldType<T[K]['type']>;
} & {
  // 可选字段
  [K in keyof T as T[K]['required'] extends true ? never : K]?: InferFieldType<T[K]['type']>;
};

/**
 * 从 DTO 定义推断 TypeScript 类型
 * 
 * @example
 * ```typescript
 * const UserDTO = defineDTO({
 *   name: 'UserDTO',
 *   fields: {
 *     id: { type: DTOFieldTypes.STRING, label: 'ID', required: true },
 *     name: { type: DTOFieldTypes.STRING, label: '名称', required: true },
 *     age: { type: DTOFieldTypes.NUMBER, label: '年龄' },
 *   } as const,
 * });
 * 
 * type User = InferDTOType<typeof UserDTO>;
 * // { id: string; name: string; age?: number }
 * ```
 */
export type InferDTOType<T extends DTODefinition> = 
  T['fields'] extends Record<string, DTOFieldDefinition>
    ? InferDTOFields<T['fields']>
    : Record<string, unknown>;

/**
 * 简写别名：从 DTO 定义推断类型
 * 
 * @example
 * ```typescript
 * const UserDTO = defineDTO({ ... } as const);
 * type User = InferDTO<typeof UserDTO>;
 * ```
 */
export type InferDTO<T extends DTODefinition> = InferDTOType<T>;

// ==================== DTO DSL ====================

/** DTO 定义 */
export interface DTODefinition {
  name: string;
  comment?: string;
  // 继承/派生
  base?: EntityDefinition | ValueObjectDefinition | DTODefinition;
  extends?: EntityDefinition | ValueObjectDefinition | DTODefinition;  // 支持从实体/值对象继承
  pick?: string[];
  omit?: string[];
  partial?: boolean;
  required?: string[];
  // 分页
  pagination?: boolean;
  // 字段
  fields?: DTOFieldsDefinition;
  __type: 'dto';
}

/**
 * 定义 DTO（带类型推断）
 * 
 * @example
 * ```typescript
 * // 独立定义（使用 as const 获得完整类型推断）
 * export const UserDTO = defineDTO({
 *   name: 'UserDTO',
 *   fields: {
 *     id: { type: DTOFieldTypes.STRING, label: 'ID', required: true },
 *     name: { type: DTOFieldTypes.STRING, label: '名称', required: true },
 *     age: { type: DTOFieldTypes.NUMBER, label: '年龄' },
 *   } as const,
 * });
 * 
 * // 自动推断类型
 * type User = InferDTOType<typeof UserDTO>;
 * // { id: string; name: string; age?: number }
 * ```
 */
export function defineDTO<T extends Omit<DTODefinition, '__type'>>(definition: T): T & { __type: 'dto' } {
  const result = {
    ...definition,
    __type: 'dto' as const,
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result as DTODefinition);
  
  return result;
}

// ==================== Constant DSL ====================

/** 常量类型 */
export type ConstantType = typeof ConstantTypes[keyof typeof ConstantTypes];

/** 常量定义 */
export interface ConstantDefinition {
  name: string;
  comment?: string;
  type: ConstantType;
  value: Record<string, unknown> | unknown[] | unknown;
  __type: 'constant';
}

/**
 * 定义常量
 * 
 * @example
 * ```typescript
 * export const StatusLabels = defineConstant({
 *   name: 'StatusLabels',
 *   type: 'map',
 *   value: {
 *     DRAFT: '草稿',
 *     APPROVED: '已审批',
 *   },
 * });
 * ```
 */
export function defineConstant(definition: Omit<ConstantDefinition, '__type'>): ConstantDefinition {
  const result: ConstantDefinition = {
    ...definition,
    __type: 'constant',
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== 工具函数 ====================

/**
 * 从定义中提取字段
 */
function extractFieldsFromDefinition(
  def: EntityDefinition | ValueObjectDefinition | DTODefinition,
  pick?: string[],
  omit?: string[],
  partial?: boolean,
  required?: string[]
): DTOFieldsDefinition {
  const fields: DTOFieldsDefinition = {};
  
  if ('fields' in def && def.fields) {
    const sourceFields = def.fields as Record<string, FieldDefinition | DTOFieldDefinition>;
    for (const [name, field] of Object.entries(sourceFields)) {
      if (pick && !pick.includes(name)) continue;
      if (omit && omit.includes(name)) continue;
      
      fields[name] = {
        type: field.type as DTOFieldType,
        label: field.label,
        required: partial ? required?.includes(name) : field.required,
      };
    }
  }
  
  return fields;
}

/**
 * 获取 DTO 的所有字段
 */
export function getDTOFields(dto: DTODefinition): DTOFieldsDefinition {
  const fields: DTOFieldsDefinition = {};
  
  // 从 base 继承字段
  if (dto.base) {
    Object.assign(fields, extractFieldsFromDefinition(
      dto.base, 
      dto.pick, 
      dto.omit, 
      dto.partial, 
      dto.required
    ));
  }
  
  // 从 extends 继承字段
  if (dto.extends) {
    Object.assign(fields, extractFieldsFromDefinition(dto.extends));
  }
  
  // 添加自定义字段
  if (dto.fields) {
    Object.assign(fields, dto.fields);
  }
  
  // 添加分页字段
  if (dto.pagination) {
    fields.pageNo = { type: 'number', label: '页码' };
    fields.pageSize = { type: 'number', label: '每页条数' };
  }
  
  return fields;
}

/**
 * 获取常量值
 */
export function getConstantValue<T>(constant: ConstantDefinition): T {
  return constant.value as T;
}

// ==================== 应用层通用类型 ====================

/**
 * 通用结果类型
 * 
 * 应用服务统一返回格式
 * 
 * @example
 * ```typescript
 * async getPurchaseOrderDetail(query: { id: string }): Promise<Result<OrderDetailDTO>> {
 *   try {
 *     const data = await service.getOrderDetail(query.id);
 *     return { success: true, data };
 *   } catch (e) {
 *     return { success: false, message: (e as Error).message };
 *   }
 * }
 * ```
 */
export interface Result<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 返回数据（成功时） */
  data?: T;
  /** 错误消息（失败时） */
  message?: string;
  /** 错误码（可选） */
  code?: string | number;
}

/**
 * 分页结果类型
 * 
 * @example
 * ```typescript
 * async getOrderList(query: QueryDTO): Promise<Result<PageResult<OrderListItemDTO>>> {
 *   const result = await service.findList(query);
 *   return {
 *     success: true,
 *     data: {
 *       list: result.data,
 *       total: result.total,
 *       pageNo: query.pageNo,
 *       pageSize: query.pageSize,
 *       totalPages: Math.ceil(result.total / query.pageSize),
 *     },
 *   };
 * }
 * ```
 */
export interface PageResult<T = unknown> {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNo: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 分页查询参数类型
 */
export interface PageQuery {
  /** 页码（从1开始） */
  pageNo?: number;
  /** 每页条数 */
  pageSize?: number;
}

/**
 * 创建成功结果
 */
export function success<T>(data?: T, message?: string): Result<T> {
  return { success: true, data, message };
}

/**
 * 创建失败结果
 */
export function failure<T = never>(message: string, code?: string | number): Result<T> {
  return { success: false, message, code };
}

/**
 * 创建分页结果
 */
export function pageResult<T>(
  list: T[],
  total: number,
  pageNo: number,
  pageSize: number
): PageResult<T> {
  return {
    list,
    total,
    pageNo,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
