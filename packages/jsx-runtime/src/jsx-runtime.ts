/**
 * JSX Automatic Runtime
 * 
 * React 17+ 自动模式的 JSX 运行时
 * 导出 jsx, jsxs, Fragment 函数
 */

import { VNODE_TYPE, type VNode, type ComponentType, type VNodeProps, type VNodeChild } from './types';

/** Fragment 标识 */
export const Fragment = Symbol.for('ai-builder.fragment');

/**
 * jsx 函数 - 用于单个子节点或无子节点
 * 
 * 自动模式下，编译器会生成：
 * - jsx(type, props, key) - 单个或无子节点
 * - jsxs(type, props, key) - 多个静态子节点
 */
export function jsx(
  type: ComponentType,
  props: VNodeProps,
  key?: string | number
): VNode {
  const { ref = null, ...restProps } = props || {};
  
  return {
    $$typeof: VNODE_TYPE,
    type,
    props: restProps,
    key: key != null ? String(key) : null,
    ref,
  };
}

/**
 * jsxs 函数 - 用于多个静态子节点
 * 
 * 与 jsx 相同，但编译器会在有多个静态子节点时使用
 */
export function jsxs(
  type: ComponentType,
  props: VNodeProps,
  key?: string | number
): VNode {
  return jsx(type, props, key);
}

/**
 * jsxDEV 函数 - 开发模式
 * 
 * 包含额外的调试信息（源码位置等）
 */
export function jsxDEV(
  type: ComponentType,
  props: VNodeProps,
  key: string | number | undefined,
  _isStaticChildren: boolean,
  _source: { fileName: string; lineNumber: number; columnNumber: number },
  _self: unknown
): VNode {
  return jsx(type, props, key);
}

// 导出类型
export type { VNode, VNodeProps, VNodeChild, ComponentType };

// ==================== JSX 命名空间声明 ====================

/**
 * JSX 命名空间声明
 * 
 * 🎯 告诉 TypeScript JSX 元素的类型是 VNode
 * 当 tsconfig.json 配置 jsxImportSource: "@ai-builder/jsx-runtime" 时生效
 */
export namespace JSX {
  // JSX 元素类型
  export type Element = VNode;
  
  // 元素类（用于类组件，我们不使用）
  export interface ElementClass {
    render(): Element | null;
  }
  
  // 内置属性
  export interface IntrinsicAttributes {
    key?: string | number;
  }
  
  // 允许任意元素名称
  export interface IntrinsicElements {
    [elemName: string]: VNodeProps;
  }
  
  // 属性获取方式
  export interface ElementAttributesProperty {
    props: object;
  }
  
  // 子元素属性名
  export interface ElementChildrenAttribute {
    children: object;
  }
}

