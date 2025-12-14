/**
 * 响应式状态管理
 * 
 * 提供 useState, useComputed 等响应式原语
 * 支持外部注入实现（用于 React 桥接等）
 */

import { getCurrentContext } from './page-context';

/** 状态引用 */
export interface StateRef<T> {
  value: T;
}

/** 状态更新函数 */
export type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

/** 内部状态存储 */
interface InternalState<T> {
  value: T;
  subscribers: Set<() => void>;
}

// ==================== Hook 代理系统 ====================

/** Hook 实现接口 */
export interface HookImplementation {
  useState<T>(initial: T): [T, StateSetter<T>];
  useComputed<T>(compute: () => T, deps?: any[]): T;
}

/** 当前 Hook 实现（可被外部替换） */
let currentHookImpl: HookImplementation | null = null;

/**
 * 设置 Hook 实现
 * 用于 React 桥接器等外部渲染器注入自己的实现
 */
export function setHookImplementation(impl: HookImplementation | null): void {
  currentHookImpl = impl;
}

/**
 * 获取当前 Hook 实现
 */
export function getHookImplementation(): HookImplementation | null {
  return currentHookImpl;
}

/**
 * 创建响应式状态
 * 
 * @param initial - 初始值
 * @returns [当前值, 设置函数]
 * 
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * setCount(1);
 * setCount(prev => prev + 1);
 * ```
 */
export function useState<T>(initial: T): [T, StateSetter<T>] {
  // 🎯 如果有外部 Hook 实现（如 React 桥接），使用它
  if (currentHookImpl) {
    return currentHookImpl.useState(initial);
  }
  
  const ctx = getCurrentContext();
  
  if (ctx) {
    // 在页面上下文中，注册到状态管理器
    const stateId = ctx.registerState(initial);
    
    const getter = () => ctx.getState<T>(stateId);
    const setter: StateSetter<T> = (value) => {
      const newValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(ctx.getState<T>(stateId))
        : value;
      ctx.setState(stateId, newValue);
    };
    
    // 返回元组时，getter 返回当前值
    return [getter(), setter];
  }
  
  // 无上下文时的简单实现（用于测试）
  let currentValue = initial;
  const setter: StateSetter<T> = (value) => {
    currentValue = typeof value === 'function'
      ? (value as (prev: T) => T)(currentValue)
      : value;
  };
  
  return [currentValue, setter];
}

/**
 * 创建计算属性
 * 
 * @param compute - 计算函数
 * @param deps - 依赖数组（可选）
 * @returns 计算值
 * 
 * @example
 * ```tsx
 * const doubleCount = useComputed(() => count * 2, [count]);
 * ```
 */
export function useComputed<T>(compute: () => T, deps?: any[]): T {
  // 🎯 如果有外部 Hook 实现（如 React 桥接），使用它
  if (currentHookImpl) {
    return currentHookImpl.useComputed(compute, deps);
  }
  
  const ctx = getCurrentContext();
  
  if (ctx) {
    // 在页面上下文中，注册计算属性
    const computedId = ctx.registerComputed(compute, deps);
    return ctx.getComputed<T>(computedId);
  }
  
  // 无上下文时直接计算
  return compute();
}

/**
 * 监听状态变化
 * 
 * @param source - 要监听的值或 getter 函数
 * @param callback - 变化时的回调
 * @param options - 选项
 */
export function useWatch<T>(
  source: T | (() => T),
  callback: (newValue: T, oldValue: T) => void,
  options?: { immediate?: boolean }
): void {
  const ctx = getCurrentContext();
  
  if (ctx) {
    const getter = typeof source === 'function' ? source : () => source;
    ctx.registerWatch(getter as () => T, callback, options);
  }
}

