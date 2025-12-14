/**
 * createElement 函数
 * 
 * Classic JSX 模式的入口函数
 * 将 JSX 转换为 VNode
 */

import { VNODE_TYPE, type VNode, type ComponentType, type VNodeChild, type VNodeProps } from './types';

/**
 * 创建虚拟节点
 * 
 * @param type - 组件类型（字符串或函数组件）
 * @param props - 组件属性
 * @param children - 子节点
 * @returns VNode
 * 
 * @example
 * ```tsx
 * // JSX 编译前
 * <Page title="订单">
 *   <Table data={dataSource} />
 * </Page>
 * 
 * // JSX 编译后（Classic 模式）
 * createElement('Page', { title: '订单' },
 *   createElement('Table', { data: dataSource })
 * )
 * ```
 */
export function createElement(
  type: ComponentType,
  props: VNodeProps | null,
  ...children: VNodeChild[]
): VNode {
  const { key = null, ref = null, ...restProps } = props || {};
  
  // 处理 children
  const normalizedChildren = normalizeChildren(children);
  
  // 如果有 children，添加到 props
  const finalProps: VNodeProps = {
    ...restProps,
    ...(normalizedChildren !== undefined && { children: normalizedChildren }),
  };

  return {
    $$typeof: VNODE_TYPE,
    type,
    props: finalProps,
    key: key != null ? String(key) : null,
    ref,
  };
}

/**
 * 规范化子节点
 */
function normalizeChildren(children: VNodeChild[]): VNodeChild | undefined {
  // 过滤掉 null, undefined, boolean
  const filtered = children.filter(child => 
    child !== null && 
    child !== undefined && 
    typeof child !== 'boolean'
  );
  
  if (filtered.length === 0) {
    return undefined;
  }
  
  if (filtered.length === 1) {
    return filtered[0];
  }
  
  return filtered;
}

/**
 * Fragment 组件
 * 用于包裹多个子节点而不产生额外的 DOM 节点
 */
export const Fragment = Symbol.for('ai-builder.fragment');

/**
 * 创建 Fragment
 */
export function createFragment(props: { children?: VNodeChild }): VNode {
  return {
    $$typeof: VNODE_TYPE,
    type: Fragment as any,
    props: props || {},
    key: null,
    ref: null,
  };
}

