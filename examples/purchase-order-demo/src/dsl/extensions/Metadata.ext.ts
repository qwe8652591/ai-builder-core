/**
 * 元数据扩展
 * 
 * 🎯 使用 Module Augmentation 扩展 DSL 装饰器的选项
 *    - 让 @Field、@Entity 等装饰器支持更多选项
 *    - 注册到 Metadata Store 可在开发态查看
 * 
 * @example
 * ```typescript
 * @Field({ 
 *   type: FieldTypes.NUMBER, 
 *   label: '金额',
 *   displayFormat: 'currency',  // 扩展属性
 *   tooltip: '订单总金额',       // 扩展属性
 * })
 * totalAmount: number;
 * ```
 */

import { registerExtension } from '@ai-builder/jsx-runtime';

// ==================== 扩展配置定义（复用于类型和注册） ====================

/** ColumnOptions 扩展配置 */
const columnOptionsExtension = {
  name: 'ColumnOptionsExtension',
  description: 'Field/Column 装饰器选项扩展',
  target: 'ColumnOptions',
  type: 'metadata' as const,
  members: [
    { name: 'displayFormat', description: '显示格式：currency/percent/date/datetime/custom' },
    { name: 'formatter', description: '自定义格式化函数' },
    { name: 'tooltip', description: '提示信息' },
    { name: 'permission', description: '字段级权限' },
    { name: 'sortable', description: '是否可排序' },
    { name: 'searchable', description: '是否可搜索' },
    { name: 'hidden', description: '是否隐藏' },
    { name: 'width', description: '列宽' },
    { name: 'align', description: '对齐方式' },
    { name: 'placeholder', description: '占位符' },
    { name: 'helpText', description: '帮助文本' },
    { name: 'readonly', description: '是否只读' },
    { name: 'group', description: '表单分组' },
    { name: 'order', description: '排序顺序' },
  ],
};

/** EntityOptions 扩展配置 */
const entityOptionsExtension = {
  name: 'EntityOptionsExtension',
  description: 'Entity 装饰器选项扩展',
  target: 'EntityOptions',
  type: 'metadata' as const,
  members: [
    { name: 'audit', description: '是否启用审计' },
    { name: 'cache', description: '缓存配置' },
    { name: 'softDelete', description: '是否软删除' },
    { name: 'versioned', description: '是否启用乐观锁' },
  ],
};

/** DTOOptions 扩展配置 */
const dtoOptionsExtension = {
  name: 'DTOOptionsExtension',
  description: 'DTO 装饰器选项扩展',
  target: 'DTOOptions',
  type: 'metadata' as const,
  members: [
    { name: 'validationMode', description: '验证模式：strict/loose' },
    { name: 'trim', description: '是否自动去空白' },
    { name: 'allowExtra', description: '是否允许额外字段' },
  ],
};

/** ServiceOptions 扩展配置 */
const serviceOptionsExtension = {
  name: 'ServiceOptionsExtension',
  description: 'Service 装饰器选项扩展',
  target: 'ServiceOptions',
  type: 'metadata' as const,
  members: [
    { name: 'transactional', description: '是否事务性' },
    { name: 'timeout', description: '超时时间（毫秒）' },
    { name: 'retry', description: '重试配置' },
  ],
};

/** MethodOptions 扩展配置 */
const methodOptionsExtension = {
  name: 'MethodOptionsExtension',
  description: 'Method 装饰器选项扩展',
  target: 'MethodOptions',
  type: 'metadata' as const,
  members: [
    { name: 'rateLimit', description: '限流配置' },
    { name: 'permission', description: '权限要求' },
    { name: 'requireAuth', description: '是否需要登录' },
    { name: 'log', description: '是否记录日志' },
  ],
};

// ==================== 注册扩展到 Metadata Store ====================

registerExtension(columnOptionsExtension);
registerExtension(entityOptionsExtension);
registerExtension(dtoOptionsExtension);
registerExtension(serviceOptionsExtension);
registerExtension(methodOptionsExtension);

// ==================== 类型声明扩展（IDE 支持） ====================
// 注：TypeScript 的 declare module 需要静态类型，无法从配置自动推断

declare module '@ai-builder/jsx-runtime' {
  interface ColumnOptions {
    displayFormat?: 'currency' | 'percent' | 'date' | 'datetime' | 'custom';
    formatter?: (value: unknown) => string;
    tooltip?: string;
    permission?: string;
    sortable?: boolean;
    searchable?: boolean;
    hidden?: boolean;
    width?: number;
    align?: 'left' | 'center' | 'right';
    placeholder?: string;
    helpText?: string;
    readonly?: boolean;
    group?: string;
    order?: number;
  }

  interface EntityOptions {
    audit?: boolean;
    cache?: { enabled: boolean; ttl?: number; };
    softDelete?: boolean;
    versioned?: boolean;
  }

  interface DTOOptions {
    validationMode?: 'strict' | 'loose';
    trim?: boolean;
    allowExtra?: boolean;
  }

  interface ServiceOptions {
    transactional?: boolean;
    timeout?: number;
    retry?: { maxAttempts: number; delay: number; };
  }

  interface MethodOptions {
    rateLimit?: { limit: number; window: number; };
    permission?: string;
    requireAuth?: boolean;
    log?: boolean;
  }
}

// ==================== 工具函数 ====================

/** 根据 displayFormat 格式化值 */
export function formatByDisplayFormat(
  value: unknown, 
  displayFormat?: string,
  formatter?: (value: unknown) => string
): string {
  if (value == null) return '-';
  
  switch (displayFormat) {
    case 'currency':
      return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percent':
      return `${(Number(value) * 100).toFixed(2)}%`;
    case 'date':
      return new Date(value as string).toLocaleDateString('zh-CN');
    case 'datetime':
      return new Date(value as string).toLocaleString('zh-CN');
    case 'custom':
      return formatter ? formatter(value) : String(value);
    default:
      return String(value);
  }
}

/** 检查字段权限 */
export function checkFieldPermission(permission: string | undefined, userPermissions: string[]): boolean {
  return !permission || userPermissions.includes(permission);
}

/** 过滤隐藏字段 */
export function filterHiddenFields<T extends Record<string, { hidden?: boolean }>>(fields: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!value.hidden) result[key as keyof T] = value as T[keyof T];
  }
  return result;
}

/** 按 order 排序字段 */
export function sortFieldsByOrder<T extends Record<string, { order?: number }>>(fields: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(fields).sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999)) as Array<[keyof T, T[keyof T]]>;
}

/** 按 group 分组字段 */
export function groupFieldsByGroup<T extends Record<string, { group?: string }>>(fields: T): Map<string, Array<[keyof T, T[keyof T]]>> {
  const groups = new Map<string, Array<[keyof T, T[keyof T]]>>();
  for (const [key, value] of Object.entries(fields)) {
    const group = value.group ?? 'default';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push([key as keyof T, value as T[keyof T]]);
  }
  return groups;
}
