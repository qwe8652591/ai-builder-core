/**
 * VNode 工具函数
 */

import { type VNode, type VNodeChild, isVNode } from './types';

/**
 * 遍历 VNode 树
 * 
 * @param node - 根节点
 * @param callback - 回调函数
 */
export function traverseVNode(
  node: VNodeChild,
  callback: (node: VNode, depth: number) => void | false,
  depth = 0
): void {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    // 文本节点，跳过
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      traverseVNode(child, callback, depth);
    }
    return;
  }

  if (isVNode(node)) {
    const result = callback(node, depth);
    if (result === false) {
      return; // 停止遍历子节点
    }

    // 遍历子节点
    const { children } = node.props;
    if (children !== undefined) {
      traverseVNode(children, callback, depth + 1);
    }
  }
}

/**
 * 扁平化子节点
 * 
 * @param children - 子节点
 * @returns 扁平化后的子节点数组
 */
export function flattenChildren(children: VNodeChild): (VNode | string | number)[] {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return [];
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return [children];
  }

  if (isVNode(children)) {
    return [children];
  }

  if (Array.isArray(children)) {
    const result: (VNode | string | number)[] = [];
    for (const child of children) {
      result.push(...flattenChildren(child));
    }
    return result;
  }

  return [];
}

/**
 * 克隆 VNode
 * 
 * @param node - 要克隆的节点
 * @param overrideProps - 要覆盖的属性
 * @returns 克隆的节点
 */
export function cloneVNode(node: VNode, overrideProps?: Partial<VNode['props']>): VNode {
  return {
    ...node,
    props: {
      ...node.props,
      ...overrideProps,
    },
  };
}

/**
 * 获取 VNode 的显示名称（用于调试）
 */
export function getDisplayName(node: VNode): string {
  const { type } = node;
  
  if (typeof type === 'string') {
    return type;
  }
  
  if (typeof type === 'function') {
    return type.name || 'Anonymous';
  }
  
  if (typeof type === 'symbol') {
    return type.description || 'Symbol';
  }
  
  return 'Unknown';
}

