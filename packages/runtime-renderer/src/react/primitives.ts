/**
 * React Runtime 响应式原语适配层
 * 将 @ai-builder/dsl/ui 的响应式 API 映射到 React hooks
 */

import { useState as reactUseState, useMemo, useEffect as reactUseEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ReactiveState as DSLReactiveState, ComputedState as DSLComputedState, EffectCallback as DSLEffectCallback } from '@ai-builder/ui-types/primitives';

// 适配层类型定义：将 React 的类型适配为 DSL 的类型
export type ReactiveState<T> = [T, Dispatch<SetStateAction<T>>];
export type ComputedState<T> = T;
export type EffectCallback = () => void | (() => void);

// 重新导出 DSL 类型（在编译时使用）
export type { DSLReactiveState, DSLComputedState, DSLEffectCallback };

/**
 * 响应式状态
 * DSL: const [count, setCount] = useState(0);
 * React: 直接使用 React.useState
 */
export function useState<T>(initialValue: T): ReactiveState<T> {
  return reactUseState(initialValue);
}

/**
 * 计算属性
 * DSL: const total = useComputed(() => price * quantity, [price, quantity]);
 * React: 使用 React.useMemo
 */
export function useComputed<T>(getter: () => T, deps?: unknown[]): ComputedState<T> {
  return useMemo(getter, deps || []);
}

/**
 * 侦听器
 * DSL: useWatch(() => count, (newVal, oldVal) => { ... });
 * React: 使用 React.useEffect 模拟
 */
export function useWatch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T | undefined) => void,
  options?: { immediate?: boolean; deep?: boolean }
): void {
  const [prevValue, setPrevValue] = reactUseState<T | undefined>(undefined);
  const currentValue = source();

  reactUseEffect(() => {
    if (options?.immediate || prevValue !== undefined) {
      callback(currentValue, prevValue);
    }
    setPrevValue(currentValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);
}

/**
 * 副作用
 * DSL: useEffect(() => { ... }, [dep1, dep2]);
 * React: 直接使用 React.useEffect
 */
export function useEffect(effect: EffectCallback, deps?: unknown[]): void {
  return reactUseEffect(effect, deps);
}

/**
 * 生命周期：组件挂载后
 * DSL: onMounted(() => { ... });
 * React: useEffect(() => { ... }, [])
 */
export function onMounted(callback: () => void): void {
  reactUseEffect(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * 生命周期：组件卸载前
 * DSL: onUnmounted(() => { ... });
 * React: useEffect(() => () => { ... }, [])
 */
export function onUnmounted(callback: () => void): void {
  reactUseEffect(() => {
    return () => {
      callback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * 生命周期：组件挂载前（React 无此概念，直接在函数体执行）
 * DSL: onBeforeMount(() => { ... });
 * React: 在组件函数体中直接执行
 */
export function onBeforeMount(callback: () => void): void {
  // React 中没有 beforeMount 的概念
  // 组件函数体本身就是 "before mount"
  // 这里使用 useLayoutEffect 来尽可能接近 beforeMount 语义
  const isFirstRender = reactUseState(true)[0];
  if (isFirstRender) {
    callback();
  }
}

/**
 * 生命周期：组件卸载前（同 onUnmounted）
 * DSL: onBeforeUnmount(() => { ... });
 * React: useEffect(() => () => { ... }, [])
 */
export function onBeforeUnmount(callback: () => void): void {
  reactUseEffect(() => {
    return () => {
      callback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * definePage - 定义页面组件
 * 支持两种调用方式：
 * 1. definePage(meta, setup) - 两参数形式
 * 2. definePage({ meta, setup }) - 对象形式
 * 
 * DSL: export default definePage({ meta: { title: '订单列表' }, setup() { ... } });
 * React: 转换为普通函数组件（由 Vite 插件处理）
 */
export function definePage<P = Record<string, unknown>>(
  metaOrConfig: unknown,
  setup?: (props: P) => unknown
): React.FC<P> {
  // 两参数形式：definePage(meta, setup)
  if (setup !== undefined) {
    return setup as React.FC<P>;
  }
  
  // 对象形式：definePage({ meta, setup })
  if (
    metaOrConfig &&
    typeof metaOrConfig === 'object' &&
    'setup' in metaOrConfig
  ) {
    const config = metaOrConfig as { setup: (props: P) => unknown };
    return config.setup as React.FC<P>;
  }
  
  throw new Error('definePage: Invalid arguments. Expected either (meta, setup) or ({ meta, setup })');
}

/**
 * defineComponent - 定义可复用组件
 * 支持两种调用方式：
 * 1. defineComponent(options, setup) - 两参数形式
 * 2. defineComponent({ ...options, setup }) - 对象形式
 * 
 * DSL: export const MyComponent = defineComponent({ setup() { ... } });
 * React: 转换为普通函数组件
 */
export function defineComponent<P = Record<string, unknown>>(
  optionsOrConfig: unknown,
  setup?: (props: P) => unknown
): React.FC<P> {
  // 两参数形式：defineComponent(options, setup)
  if (setup !== undefined) {
    return setup as React.FC<P>;
  }
  
  // 对象形式：defineComponent({ ...options, setup })
  if (
    optionsOrConfig &&
    typeof optionsOrConfig === 'object' &&
    'setup' in optionsOrConfig
  ) {
    const config = optionsOrConfig as { setup: (props: P) => unknown };
    return config.setup as React.FC<P>;
  }
  
  throw new Error('defineComponent: Invalid arguments. Expected either (options, setup) or ({ ...options, setup })');
}

