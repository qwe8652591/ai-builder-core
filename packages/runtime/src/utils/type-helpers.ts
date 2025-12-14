/**
 * 类型辅助函数
 * 提供更安全的类型转换和断言
 */

/**
 * 判断值是否有 toFixed 方法（是否为 Decimal 或 Number）
 */
export function hasToFixed(value: unknown): value is { toFixed: (n: number) => string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return value != null && typeof (value as any).toFixed === 'function';
}

/**
 * 安全地格式化 Decimal 或 Number 为货币字符串
 */
export function formatCurrency(value: unknown, decimals = 2, currencySymbol = '¥'): string {
  if (hasToFixed(value)) {
    return `${currencySymbol}${value.toFixed(decimals)}`;
  }
  return `${currencySymbol}${String(value)}`;
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

/**
 * 安全地获取嵌套属性
 */
export function getNestedProperty<T = unknown>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  if (obj == null) return defaultValue;
  
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result ?? defaultValue;
}

/**
 * 检查值是否为空（null、undefined、空字符串、空数组、空对象）
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 检查值是否非空
 */
export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

