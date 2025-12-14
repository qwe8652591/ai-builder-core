/**
 * Decimal 浏览器运行时实现
 * 
 * 将 decimal.js 适配为 DSL 的 Decimal 接口
 * 用于浏览器环境的高精度数值计算
 */

import DecimalJS from 'decimal.js';

// DSL Decimal 类型定义（内联，避免循环依赖）
export interface DSLDecimal {
  add(other: DSLDecimal | number | string): DSLDecimal;
  sub(other: DSLDecimal | number | string): DSLDecimal;
  mul(other: DSLDecimal | number | string): DSLDecimal;
  div(other: DSLDecimal | number | string): DSLDecimal;
  equals(other: DSLDecimal | number | string): boolean;
  greaterThan(other: DSLDecimal | number | string): boolean;
  lessThan(other: DSLDecimal | number | string): boolean;
  toString(): string;
  toNumber(): number;
  toFixed(fractionDigits?: number): string;
}

export interface DSLDecimalConstructor {
  new (value: number | string | DSLDecimal): DSLDecimal;
  of(value: number | string | DSLDecimal): DSLDecimal;
  ZERO: DSLDecimal;
  ONE: DSLDecimal;
}

// 配置全局精度
DecimalJS.set({ precision: 20 });

/**
 * 将 decimal.js 导出为符合 DSL 接口的 Decimal
 * 
 * 由于 decimal.js 的 API 与 DSL Decimal 接口兼容，
 * 我们可以直接类型断言导出
 */
export const Decimal = DecimalJS as unknown as DSLDecimalConstructor;

/**
 * 类型兼容性说明：
 * 
 * DSL Decimal 接口定义：
 * - add(other): Decimal
 * - sub(other): Decimal
 * - mul(other): Decimal
 * - div(other): Decimal
 * - equals(other): boolean
 * - greaterThan(other): boolean
 * - lessThan(other): boolean
 * - toString(): string
 * - toNumber(): number
 * - toFixed(digits): string
 * 
 * decimal.js 提供：
 * - plus(n): Decimal (对应 add)
 * - minus(n): Decimal (对应 sub)
 * - times(n): Decimal (对应 mul)
 * - div(n): Decimal (对应 div)
 * - equals(n): boolean
 * - greaterThan(n): boolean / gt(n)
 * - lessThan(n): boolean / lt(n)
 * - toString(): string
 * - toNumber(): number
 * - toFixed(dp): string
 * 
 * decimal.js 还提供了额外的方法（add, sub, mul 等别名），
 * 这使得它可以直接满足 DSL 的接口要求
 */

/**
 * 初始化全局 Decimal
 * 
 * 在应用启动时调用此函数，将 Decimal 注入到全局对象
 * 这样 DSL 代码中的 `new Decimal()` 调用就能正常工作
 * 
 * @example
 * ```typescript
 * // main.tsx
 * import { initializeDecimal } from '@ai-builder/runtime-renderer/react';
 * initializeDecimal();
 * ```
 */
export function initializeDecimal(): void {
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).Decimal = DecimalJS;
  } else if (typeof window !== 'undefined') {
    (window as any).Decimal = DecimalJS;
  }
}


