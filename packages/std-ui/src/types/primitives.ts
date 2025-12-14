/**
 * DSL 原语类型定义
 * 
 * 这些类型定义了 UI DSL 的核心响应式原语
 * 独立于具体的实现框架（React/Vue）
 * 
 * 🎯 VNode 类型在这里定义，被以下包使用：
 * - @qwe8652591/std-ui - 组件返回类型
 * - @qwe8652591/dsl-core - VNode 创建和转换
 */

// ==================== VNode 类型定义 ====================

/** VNode 类型标识符 */
export const VNODE_TYPE = Symbol.for('ai-builder.vnode');

/**
 * VNode 子节点类型
 */
export type VNodeChild = 
  | VNode 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | VNodeChild[];

/**
 * VNode 属性类型
 */
export interface VNodeProps {
  key?: string | number;
  ref?: unknown;
  children?: VNodeChild;
  [key: string]: unknown;
}

/**
 * 组件类型
 */
export type ComponentType<P = VNodeProps> = 
  | string 
  | symbol
  | ((props: P) => VNode | VNode[] | null);

/**
 * 虚拟节点类型
 * 
 * 框架无关的 VNode 定义，可以编译为 React 或 Vue
 */
export interface VNode {
  /** 类型标识 */
  $$typeof: typeof VNODE_TYPE;
  /** 节点类型：字符串（HTML 元素）或组件函数 */
  type: ComponentType;
  /** 节点属性 */
  props: VNodeProps;
  /** 唯一标识 */
  key: string | number | null;
  /** 引用 */
  ref?: unknown;
}

/**
 * JSX 元素类型（VNode 或 null）
 */
export type JSXElement = VNode | null;

/**
 * 判断是否是 VNode
 */
export function isVNode(value: unknown): value is VNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as VNode).$$typeof === VNODE_TYPE
  );
}

/**
 * 判断是否是有效的子节点
 */
export function isValidChild(child: unknown): child is VNodeChild {
  return (
    child === null ||
    child === undefined ||
    typeof child === 'string' ||
    typeof child === 'number' ||
    typeof child === 'boolean' ||
    isVNode(child) ||
    Array.isArray(child)
  );
}

// ==================== 响应式原语类型 ====================

/**
 * 响应式状态类型
 * 在不同框架中有不同的实现：
 * - React: [value, setValue]
 * - Vue: Ref<T>
 */
export type ReactiveState<T> = unknown;

/**
 * 计算属性类型
 * 在不同框架中有不同的实现：
 * - React: T (useMemo)
 * - Vue: ComputedRef<T>
 */
export type ComputedState<T> = unknown;

/**
 * 副作用回调类型
 */
export type EffectCallback = () => void | (() => void);

/**
 * 清理函数类型
 */
export type CleanupFunction = () => void;

/**
 * 依赖列表类型
 */
export type DependencyList = ReadonlyArray<unknown>;

/**
 * 监听选项
 */
export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
}





