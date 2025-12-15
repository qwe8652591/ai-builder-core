/**
 * 领域逻辑 DSL 定义
 * 
 * 提供统一的 DSL 语法来定义领域规则（纯函数）
 * 定义时自动注册到 Metadata Store
 * 
 * ⚠️ Domain 层约束：
 * 1. 必须是纯函数（无副作用）
 * 2. 禁止 async/await（必须同步执行）
 * 3. 禁止 IO 操作（数据库、网络、文件）
 */

import { registerMetadata } from './metadata-store';

// ==================== 类型定义 ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/** 验证规则 */
export interface ValidationRuleDefinition {
  name: string;
  description?: string;
  message: string;
  validate: AnyFunction;
  __type: 'validationRule';
}

/** 计算规则 */
export interface ComputationRuleDefinition {
  name: string;
  description?: string;
  compute: AnyFunction;
  __type: 'computationRule';
}

/** 状态转换规则 */
export interface ActionRuleDefinition {
  name: string;
  description?: string;
  action: AnyFunction;
  __type: 'actionRule';
}

/** 规则定义（联合类型） */
export type RuleDefinition = 
  | ValidationRuleDefinition 
  | ComputationRuleDefinition 
  | ActionRuleDefinition;

/** 规则输入（宽松类型，支持任意函数签名） */
export interface RuleInput {
  name: string;
  description?: string;
  message?: string;
  validate?: AnyFunction;
  compute?: AnyFunction;
  action?: AnyFunction;
}

// ==================== Rule DSL ====================

/**
 * 定义规则
 * 
 * @example
 * ```typescript
 * // 验证规则
 * const validateAmount = defineRule({
 *   name: 'validateAmount',
 *   message: '金额必须大于0',
 *   validate: (amount: number) => amount > 0,
 * });
 * 
 * // 计算规则
 * const calculateTotal = defineRule({
 *   name: 'calculateTotal',
 *   compute: (items: Item[]) => items.reduce((sum, item) => sum + item.amount, 0),
 * });
 * 
 * // 状态转换规则
 * const approve = defineRule({
 *   name: 'approve',
 *   action: (order, approver) => { order.status = 'APPROVED'; },
 * });
 * ```
 */
export function defineRule<T extends RuleInput>(input: T): T & { __type: string } {
  let result: T & { __type: string };
  
  if (input.validate) {
    result = {
      ...input,
      __type: 'rule',  // 统一使用 'rule' 类型以便 Metadata Store 识别
    } as T & { __type: string };
  } else if (input.compute) {
    result = {
      ...input,
      __type: 'rule',
    } as T & { __type: string };
  } else if (input.action) {
    result = {
      ...input,
      __type: 'rule',
    } as T & { __type: string };
  } else {
    throw new Error('Rule must have validate, compute, or action');
  }
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== Logic DSL ====================

/** 业务逻辑定义 */
export interface LogicDefinition {
  name: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validations?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computations?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checks?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions?: Record<string, any>;
  __type: 'logic';
}

/**
 * 定义业务逻辑
 * 
 * 配合 *.logic.ts 文件后缀使用
 * 
 * @example
 * ```typescript
 * export const OrderLogic = defineLogic({
 *   name: 'OrderLogic',
 *   validations: {
 *     validateAmount,
 *     validateItems,
 *   },
 *   computations: {
 *     calculateTotal,
 *   },
 *   checks: {
 *     canSubmit,
 *     canApprove,
 *   },
 *   actions: {
 *     submit,
 *     approve,
 *     reject,
 *   },
 * });
 * ```
 */
export function defineLogic(
  definition: Omit<LogicDefinition, '__type'>
): LogicDefinition {
  const result: LogicDefinition = {
    ...definition,
    __type: 'logic',
  };
  
  // 自动注册到 Metadata Store
  registerMetadata(result);
  
  return result;
}

// ==================== 工具函数 ====================

/**
 * 执行验证规则
 */
export function executeValidation(
  rule: ValidationRuleDefinition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): { valid: boolean; message?: string } {
  const valid = rule.validate(...args);
  return {
    valid,
    message: valid ? undefined : rule.message,
  };
}

/**
 * 执行计算规则
 */
export function executeComputation<R>(
  rule: ComputationRuleDefinition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): R {
  return rule.compute(...args);
}

/**
 * 执行状态转换规则
 */
export function executeAction(
  rule: ActionRuleDefinition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): void {
  rule.action(...args);
}

/**
 * 批量执行验证规则
 */
export function validateAll(
  rules: Record<string, ValidationRuleDefinition>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [, rule] of Object.entries(rules)) {
    const result = executeValidation(rule, data);
    if (!result.valid && result.message) {
      errors.push(result.message);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

