/**
 * 生命周期钩子模块
 * 
 * 提供组件生命周期相关的钩子函数，用于处理副作用、数据加载、订阅等操作。
 * 这些是编译期 DSL，会被编译器转换为目标框架的生命周期 API。
 * 
 * @module lifecycle
 */

import type { EffectCallback, DependencyList, CleanupFunction } from './types';

/**
 * 副作用钩子
 * 
 * 用于处理副作用操作（数据加载、订阅、定时器等）。
 * 支持依赖数组和清理函数，类似于 React 的 `useEffect` 或 Vue 的 `watchEffect`。
 * 
 * @param effect - 副作用函数，可以返回清理函数或 Promise
 * @param deps - 可选的依赖数组，当依赖变化时重新执行副作用
 * @returns 清理函数（可选）
 * 
 * @example
 * ```tsx
 * // 基础用法：组件挂载时执行
 * useEffect(() => {
 *   console.log('组件已挂载');
 * }, []); // 空依赖数组 = 只执行一次
 * 
 * // 依赖追踪：当 userId 变化时重新执行
 * const userId = useState('123');
 * useEffect(() => {
 *   console.log('用户ID变化:', userId.value);
 *   // 加载用户数据
 *   fetchUser(userId.value);
 * }, [userId.value]);
 * 
 * // 清理函数：组件卸载或副作用重新执行前调用
 * useEffect(() => {
 *   const timer = setInterval(() => {
 *     console.log('tick');
 *   }, 1000);
 *   
 *   // 返回清理函数
 *   return () => {
 *     clearInterval(timer);
 *   };
 * }, []);
 * 
 * // 使用 onCleanup 注册清理函数（推荐）
 * useEffect((onCleanup) => {
 *   const subscription = eventBus.subscribe('message', handler);
 *   
 *   onCleanup(() => {
 *     subscription.unsubscribe();
 *   });
 * }, []);
 * 
 * // 异步副作用
 * useEffect(async (onCleanup) => {
 *   const data = await fetchData();
 *   console.log('数据加载完成:', data);
 *   
 *   // 异步函数中也可以注册清理
 *   onCleanup(() => {
 *     console.log('清理');
 *   });
 * }, []);
 * 
 * // 实际应用：数据加载
 * const orderId = useState('ORD-001');
 * const order = useState<Order | null>(null);
 * const loading = useState(true);
 * 
 * useEffect(async (onCleanup) => {
 *   loading.value = true;
 *   let cancelled = false;
 *   
 *   onCleanup(() => {
 *     cancelled = true;
 *   });
 *   
 *   try {
 *     const data = await orderService.getById(orderId.value);
 *     if (!cancelled) {
 *       order.value = data;
 *     }
 *   } finally {
 *     if (!cancelled) {
 *       loading.value = false;
 *     }
 *   }
 * }, [orderId.value]);
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **依赖数组规则**:
 * - 不传依赖数组: 每次组件更新都执行
 * - 空数组 `[]`: 只在挂载时执行一次
 * - 有依赖 `[a, b]`: 当 a 或 b 变化时执行
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { watchEffect, onBeforeUnmount } from 'vue';
 * 
 * // 无依赖数组 -> watchEffect
 * watchEffect(() => {
 *   console.log('执行副作用');
 * });
 * 
 * // 有依赖数组 -> watch
 * watch([userId], async () => {
 *   await fetchUser(userId.value);
 * });
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * import { useEffect } from 'react';
 * 
 * useEffect(() => {
 *   console.log('执行副作用');
 *   return () => {
 *     console.log('清理');
 *   };
 * }, [userId]);
 * ```
 * 
 * **执行时机**:
 * - Vue 3: 默认在组件渲染后（DOM 更新后）
 * - React: 在组件渲染后（commit 阶段）
 * 
 * **最佳实践**:
 * 1. 始终声明所有依赖项，避免闭包陷阱
 * 2. 对于异步操作，检查组件是否已卸载（cancelled 标志）
 * 3. 及时清理副作用（定时器、订阅、请求）
 * 4. 避免在副作用中直接修改响应式状态可能导致无限循环
 */
export function useEffect(
  _effect: EffectCallback,
  _deps?: DependencyList
): void {
  throw new Error(
    'useEffect() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 组件挂载钩子
 * 
 * 在组件挂载完成后（DOM 已插入）立即执行。
 * 等价于 `useEffect(() => { ... }, [])`，但语义更清晰。
 * 
 * @param callback - 挂载时执行的回调函数
 * 
 * @example
 * ```tsx
 * // 基础用法
 * onMounted(() => {
 *   console.log('组件已挂载，DOM 已准备好');
 * });
 * 
 * // 初始化数据
 * const data = useState<Data[]>([]);
 * 
 * onMounted(async () => {
 *   data.value = await fetchData();
 * });
 * 
 * // 访问 DOM 元素
 * const chartRef = useRef<HTMLDivElement>();
 * 
 * onMounted(() => {
 *   if (chartRef.value) {
 *     initChart(chartRef.value);
 *   }
 * });
 * 
 * // 注册全局事件
 * onMounted(() => {
 *   window.addEventListener('resize', handleResize);
 * });
 * 
 * // 返回清理函数（组件卸载时执行）
 * onMounted(() => {
 *   const timer = setInterval(updateTime, 1000);
 *   
 *   return () => {
 *     clearInterval(timer);
 *   };
 * });
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { onMounted } from 'vue';
 * 
 * onMounted(() => {
 *   console.log('组件已挂载');
 * });
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * import { useEffect } from 'react';
 * 
 * useEffect(() => {
 *   console.log('组件已挂载');
 * }, []);
 * ```
 * 
 * **执行时机**:
 * - 在组件 DOM 插入到页面后执行
 * - 此时可以安全地访问 DOM 元素
 * - 子组件的 onMounted 先于父组件执行
 * 
 * **与 useEffect 的区别**:
 * - `onMounted`: 只在挂载时执行一次，语义清晰
 * - `useEffect(fn, [])`: 功能相同，但需要显式传递空依赖数组
 */
export function onMounted(
  _callback: () => void | CleanupFunction | Promise<void | CleanupFunction>
): void {
  throw new Error(
    'onMounted() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 组件卸载钩子
 * 
 * 在组件卸载前执行，用于清理资源（定时器、订阅、事件监听器等）。
 * 
 * @param callback - 卸载前执行的回调函数
 * 
 * @example
 * ```tsx
 * // 清理定时器
 * const timer = setInterval(() => {
 *   console.log('tick');
 * }, 1000);
 * 
 * onUnmounted(() => {
 *   clearInterval(timer);
 * });
 * 
 * // 取消订阅
 * const subscription = eventBus.subscribe('event', handler);
 * 
 * onUnmounted(() => {
 *   subscription.unsubscribe();
 * });
 * 
 * // 移除全局事件监听器
 * const handleResize = () => { ... };
 * window.addEventListener('resize', handleResize);
 * 
 * onUnmounted(() => {
 *   window.removeEventListener('resize', handleResize);
 * });
 * 
 * // 取消未完成的请求
 * const controller = new AbortController();
 * 
 * fetch('/api/data', { signal: controller.signal });
 * 
 * onUnmounted(() => {
 *   controller.abort();
 * });
 * 
 * // 清理 WebSocket 连接
 * const ws = new WebSocket('ws://localhost:8080');
 * 
 * onUnmounted(() => {
 *   ws.close();
 * });
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { onUnmounted } from 'vue';
 * 
 * onUnmounted(() => {
 *   console.log('组件即将卸载');
 * });
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * import { useEffect } from 'react';
 * 
 * useEffect(() => {
 *   return () => {
 *     console.log('组件即将卸载');
 *   };
 * }, []);
 * ```
 * 
 * **执行时机**:
 * - 在组件从 DOM 中移除之前执行
 * - 父组件的 onUnmounted 先于子组件执行
 * - 此时组件状态仍然可访问
 * 
 * **最佳实践**:
 * 1. 始终清理在 `onMounted` 或 `useEffect` 中创建的资源
 * 2. 取消所有异步操作和订阅
 * 3. 避免在卸载钩子中执行耗时操作
 */
export function onUnmounted(_callback: () => void | Promise<void>): void {
  throw new Error(
    'onUnmounted() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 组件挂载前钩子
 * 
 * 在组件挂载前（DOM 插入前）执行。
 * 适用于需要在 DOM 渲染前执行的初始化逻辑。
 * 
 * @param callback - 挂载前执行的回调函数
 * 
 * @example
 * ```tsx
 * // 挂载前初始化
 * onBeforeMount(() => {
 *   console.log('组件即将挂载，DOM 尚未创建');
 * });
 * 
 * // 准备初始数据
 * const data = useState<Data | null>(null);
 * 
 * onBeforeMount(async () => {
 *   // 预加载数据，避免首次渲染闪烁
 *   data.value = await loadInitialData();
 * });
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { onBeforeMount } from 'vue';
 * 
 * onBeforeMount(() => {
 *   console.log('组件即将挂载');
 * });
 * ```
 * 
 * **React 编译产物**:
 * React 没有直接对应的钩子，编译器会在组件函数顶层直接执行：
 * ```typescript
 * // 直接在组件函数中执行（渲染前）
 * console.log('组件即将挂载');
 * ```
 * 
 * **执行时机**:
 * - 在组件实例创建后、DOM 渲染前执行
 * - 此时无法访问 DOM 元素
 * - 适合执行不依赖 DOM 的初始化操作
 * 
 * **注意事项**:
 * - 在 React 中，此钩子会在每次渲染时执行（除非编译器优化）
 * - 避免在此钩子中执行副作用操作，优先使用 `useEffect`
 */
export function onBeforeMount(_callback: () => void | Promise<void>): void {
  throw new Error(
    'onBeforeMount() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 组件卸载前钩子
 * 
 * 在组件卸载前（DOM 移除前）执行。
 * 适用于需要在 DOM 移除前执行的清理逻辑。
 * 
 * @param callback - 卸载前执行的回调函数
 * 
 * @example
 * ```tsx
 * // 卸载前保存状态
 * onBeforeUnmount(() => {
 *   saveComponentState();
 * });
 * 
 * // 卸载前确认
 * const hasUnsavedChanges = useState(false);
 * 
 * onBeforeUnmount(() => {
 *   if (hasUnsavedChanges.value) {
 *     const confirmed = confirm('有未保存的更改，确定离开吗？');
 *     if (!confirmed) {
 *       // 取消卸载（仅 Vue 支持）
 *       throw new Error('User cancelled');
 *     }
 *   }
 * });
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { onBeforeUnmount } from 'vue';
 * 
 * onBeforeUnmount(() => {
 *   console.log('组件即将卸载');
 * });
 * ```
 * 
 * **React 编译产物**:
 * React 没有严格对应的钩子，编译为 `useEffect` 的清理函数：
 * ```typescript
 * import { useEffect } from 'react';
 * 
 * useEffect(() => {
 *   return () => {
 *     console.log('组件即将卸载');
 *   };
 * }, []);
 * ```
 * 
 * **执行时机**:
 * - 在组件卸载流程开始时、DOM 移除前执行
 * - 此时组件状态和 DOM 仍然可访问
 * 
 * **与 onUnmounted 的区别**:
 * - `onBeforeUnmount`: 卸载流程开始时，DOM 尚未移除
 * - `onUnmounted`: 卸载完成后，DOM 已移除
 * - 实际使用中，两者差异较小，优先使用 `onUnmounted`
 */
export function onBeforeUnmount(_callback: () => void | Promise<void>): void {
  throw new Error(
    'onBeforeUnmount() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}





