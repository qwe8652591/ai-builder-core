/**
 * 生命周期钩子
 * 
 * 提供 useEffect, onMounted 等生命周期管理
 * 支持外部注入实现（用于 React 桥接等）
 */

import { getCurrentContext } from './page-context';

// ==================== Hook 代理系统 ====================

/** Effect Hook 实现接口 */
export interface EffectHookImplementation {
  useEffect(effect: () => void | (() => void), deps?: any[]): void;
}

/** 当前 Effect Hook 实现（可被外部替换） */
let currentEffectHookImpl: EffectHookImplementation | null = null;

/**
 * 设置 Effect Hook 实现
 * 用于 React 桥接器等外部渲染器注入自己的实现
 */
export function setEffectHookImplementation(impl: EffectHookImplementation | null): void {
  currentEffectHookImpl = impl;
}

/**
 * 获取当前 Effect Hook 实现
 */
export function getEffectHookImplementation(): EffectHookImplementation | null {
  return currentEffectHookImpl;
}

/**
 * 副作用钩子
 * 
 * @param effect - 副作用函数
 * @param deps - 依赖数组（空数组表示只执行一次）
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   loadData();
 * }, []);
 * 
 * useEffect(() => {
 *   console.log('status changed:', status);
 * }, [status]);
 * ```
 */
export function useEffect(
  effect: () => void | (() => void) | Promise<void>,
  deps?: any[]
): void {
  // 🎯 如果有外部 Hook 实现（如 React 桥接），使用它
  if (currentEffectHookImpl) {
    currentEffectHookImpl.useEffect(effect as () => void | (() => void), deps);
    return;
  }
  
  const ctx = getCurrentContext();
  
  if (ctx) {
    ctx.registerEffect(effect, deps);
  } else {
    // 无上下文时立即执行
    effect();
  }
}

/**
 * 组件挂载时执行
 * 
 * @param callback - 回调函数
 */
export function onMounted(callback: () => void | Promise<void>): void {
  const ctx = getCurrentContext();
  
  if (ctx) {
    ctx.registerLifecycle('mounted', callback);
  }
}

/**
 * 组件卸载前执行
 * 
 * @param callback - 回调函数
 */
export function onUnmounted(callback: () => void): void {
  const ctx = getCurrentContext();
  
  if (ctx) {
    ctx.registerLifecycle('unmounted', callback);
  }
}

/**
 * 组件挂载前执行
 * 
 * @param callback - 回调函数
 */
export function onBeforeMount(callback: () => void): void {
  const ctx = getCurrentContext();
  
  if (ctx) {
    ctx.registerLifecycle('beforeMount', callback);
  }
}

/**
 * 组件卸载前执行
 * 
 * @param callback - 回调函数
 */
export function onBeforeUnmount(callback: () => void): void {
  const ctx = getCurrentContext();
  
  if (ctx) {
    ctx.registerLifecycle('beforeUnmount', callback);
  }
}

