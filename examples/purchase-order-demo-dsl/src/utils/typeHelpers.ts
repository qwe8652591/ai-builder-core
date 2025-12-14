/**
 * 类型辅助函数
 * 提供更安全的类型转换和断言
 */

import type { Decimal } from '@ai-builder/dsl';

/**
 * 判断值是否有 toFixed 方法（是否为 Decimal 或 Number）
 */
export function hasToFixed(value: unknown): value is { toFixed: (n: number) => string } {
  return value != null && typeof (value as any).toFixed === 'function';
}

/**
 * 安全地格式化 Decimal 或 Number 为货币字符串
 */
export function formatCurrency(value: unknown, decimals = 2): string {
  if (hasToFixed(value)) {
    return `¥${value.toFixed(decimals)}`;
  }
  return `¥${String(value)}`;
}

/**
 * 安全地格式化日期
 */
export function formatDate(value: unknown, locale = 'zh-CN'): string {
  if (value instanceof Date) {
    return value.toLocaleDateString(locale);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).toLocaleDateString(locale);
  }
  return String(value);
}

/**
 * 安全地格式化日期时间
 */
export function formatDateTime(value: unknown, locale = 'zh-CN'): string {
  if (value instanceof Date) {
    return value.toLocaleString(locale);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).toLocaleString(locale);
  }
  return String(value);
}

/**
 * 类型守卫：检查对象是否有特定属性
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return obj != null && typeof obj === 'object' && key in obj;
}

