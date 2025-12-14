/**
 * 高精度数值类型接口
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
  /** 转为数字 */
  toNumber(): number;
  /** 保留小数位 */
  toFixed(fractionDigits?: number): string;
}

/**
 * Decimal 构造函数接口
 */
export interface DecimalConstructor {
  new (value: number | string | Decimal): Decimal;
  of(value: number | string | Decimal): Decimal;
  ZERO: Decimal;
  ONE: Decimal;
}

// 导出变量声明
// 注意：这需要 Runtime 环境注入全局变量或使用 shim
export declare const Decimal: DecimalConstructor;





