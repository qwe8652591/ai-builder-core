/**
 * 响应式 API
 * 
 * 提供 useState, useComputed, useWatch 等响应式原语。
 * 
 * @packageDocumentation
 */

import type { ReactiveState, ComputedState, WatchOptions } from './types';

/**
 * 创建响应式状态
 * 
 * 返回一个响应式状态对象，包含 `.value` 属性用于读写状态值。
 * 当状态值变化时，所有依赖该状态的计算属性和渲染函数会自动重新执行。
 * 
 * 类似于 Vue 3 的 `ref()` 或 React 的 `useState()`。
 * 
 * @template T - 状态值的类型
 * @param initialValue - 初始状态值
 * @returns 响应式状态对象
 * 
 * @example
 * ```tsx
 * // 基础用法
 * const count = useState(0);
 * console.log(count.value); // 读取: 0
 * count.value++;            // 写入: 触发更新
 * 
 * // 复杂类型
 * interface User {
 *   name: string;
 *   age: number;
 * }
 * const user = useState<User>({ name: 'Alice', age: 30 });
 * user.value.age = 31;      // 深层响应式
 * 
 * // 可选初始值
 * const data = useState<string>();
 * console.log(data.value);  // undefined
 * data.value = 'Hello';     // 赋值后有值
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 编译器会根据目标框架（Vue 3 / React）生成对应的响应式代码。
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { ref } from 'vue';
 * const count = ref(0);
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * import { useState } from 'react';
 * const [countValue, setCount] = useState(0);
 * // 编译器会将 count.value 读取转换为 countValue
 * // 将 count.value = x 写入转换为 setCount(x)
 * ```
 */
export function useState<T>(initialValue: T): ReactiveState<T>;

/**
 * 创建响应式状态（无初始值）
 * 
 * @template T - 状态值的类型
 * @returns 响应式状态对象，初始值为 undefined
 * 
 * @example
 * ```tsx
 * const data = useState<User>();
 * if (data.value) {
 *   console.log(data.value.name);
 * }
 * ```
 */
export function useState<T = undefined>(): ReactiveState<T | undefined>;

// 实现签名（运行时占位）
export function useState<T>(_initialValue?: T): ReactiveState<T | undefined> {
  throw new Error(
    'useState() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 创建计算属性
 * 
 * 返回一个只读的计算属性对象，其值由 getter 函数计算得出。
 * 系统会自动追踪 getter 中访问的所有响应式状态，当任一依赖变化时自动重新计算。
 * 计算结果会被缓存，重复访问 `.value` 时不会重新执行 getter，直到依赖变化。
 * 
 * 类似于 Vue 3 的 `computed()` 或 React 的 `useMemo()`。
 * 
 * @template T - 计算结果的类型
 * @param getter - 计算函数，返回计算结果
 * @returns 计算属性对象（只读）
 * 
 * @example
 * ```tsx
 * // 基础用法
 * const count = useState(5);
 * const doubled = useComputed(() => count.value * 2);
 * console.log(doubled.value); // 10
 * count.value = 10;
 * console.log(doubled.value); // 20 (自动重新计算)
 * 
 * // 依赖多个状态
 * const firstName = useState('John');
 * const lastName = useState('Doe');
 * const fullName = useComputed(() => `${firstName.value} ${lastName.value}`);
 * console.log(fullName.value); // "John Doe"
 * 
 * // 复杂计算
 * const items = useState<Item[]>([...]);
 * const discountRate = useState(0.1);
 * const totalPrice = useComputed(() => {
 *   const sum = items.value.reduce((acc, item) => acc + item.price * item.quantity, 0);
 *   return sum * (1 - discountRate.value);
 * });
 * 
 * // 嵌套计算属性
 * const priceA = useState(100);
 * const priceB = useState(200);
 * const sum = useComputed(() => priceA.value + priceB.value);
 * const average = useComputed(() => sum.value / 2); // 依赖另一个计算属性
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 编译器会根据目标框架生成对应的计算属性代码。
 * 
 * **依赖追踪原理**:
 * - Vue 3: 使用 Proxy 自动追踪，无需手动声明依赖
 * - React: 编译器会分析 getter 函数，生成依赖数组传给 useMemo
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { computed } from 'vue';
 * const doubled = computed(() => count.value * 2);
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * import { useMemo } from 'react';
 * const doubled = useMemo(() => count * 2, [count]);
 * ```
 * 
 * **性能提示**:
 * - 计算属性会缓存结果，避免重复计算
 * - 只在依赖变化时重新计算，不访问 `.value` 时不会执行
 * - 适合用于复杂的派生状态计算
 */
export function useComputed<T>(_getter: () => T): ComputedState<T> {
  throw new Error(
    'useComputed() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 监听响应式状态或计算属性的变化
 * 
 * 当 source 的值变化时，执行 callback 回调函数。
 * 可以监听单个状态、计算属性或 getter 函数的返回值。
 * 
 * 类似于 Vue 3 的 `watch()` 或 React 的 `useEffect()` 结合依赖数组。
 * 
 * @template T - 监听值的类型
 * @param source - 监听源（响应式状态、计算属性或 getter 函数）
 * @param callback - 变化回调函数，接收新值和旧值
 * @param options - 监听选项
 * @returns 停止监听的函数
 * 
 * @example
 * ```tsx
 * // 监听单个状态
 * const count = useState(0);
 * useWatch(count, (newValue, oldValue) => {
 *   console.log(`count changed from ${oldValue} to ${newValue}`);
 * });
 * 
 * // 监听计算属性
 * const doubled = useComputed(() => count.value * 2);
 * useWatch(doubled, (newValue) => {
 *   console.log(`doubled value is now ${newValue}`);
 * });
 * 
 * // 监听 getter 函数
 * const user = useState({ name: 'Alice', age: 30 });
 * useWatch(
 *   () => user.value.age,
 *   (newAge, oldAge) => {
 *     console.log(`Age changed from ${oldAge} to ${newAge}`);
 *   }
 * );
 * 
 * // 立即执行
 * useWatch(count, (value) => {
 *   console.log('Current count:', value);
 * }, { immediate: true }); // 组件挂载时立即执行一次
 * 
 * // 深度监听
 * const data = useState({ nested: { value: 1 } });
 * useWatch(data, () => {
 *   console.log('Deep change detected');
 * }, { deep: true }); // 监听对象内部任意属性的变化
 * 
 * // 停止监听
 * const stopWatch = useWatch(count, (value) => {
 *   if (value > 10) {
 *     stopWatch(); // 停止监听
 *   }
 * });
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { watch } from 'vue';
 * const stopWatch = watch(count, (newValue, oldValue) => {
 *   console.log('changed');
 * }, { immediate: true, deep: true });
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * import { useEffect, useRef } from 'react';
 * const prevValueRef = useRef(count);
 * useEffect(() => {
 *   const oldValue = prevValueRef.current;
 *   prevValueRef.current = count;
 *   callback(count, oldValue);
 * }, [count]);
 * ```
 * 
 * **与 useEffect 的区别**:
 * - `useWatch`: 专门用于监听特定状态的变化
 * - `useEffect`: 用于执行副作用（如数据加载、订阅），可依赖多个状态
 */
export function useWatch<T>(
  _source: ReactiveState<T> | ComputedState<T> | (() => T),
  _callback: (newValue: T, oldValue: T) => void,
  _options?: WatchOptions
): () => void {
  throw new Error(
    'useWatch() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}



