/**
 * 将 VNode 渲染为字符串（用于调试和服务端渲染）
 */

import { type VNode, type VNodeChild, isVNode } from './types';
import { Fragment } from './jsx-runtime';
import { getDisplayName, flattenChildren } from './utils';

/**
 * 将 VNode 渲染为字符串
 * 
 * @param node - VNode
 * @param indent - 缩进级别
 * @returns 字符串表示
 */
export function renderToString(node: VNodeChild, indent = 0): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string') {
    return `${getIndent(indent)}${escapeHtml(node)}`;
  }

  if (typeof node === 'number') {
    return `${getIndent(indent)}${node}`;
  }

  if (Array.isArray(node)) {
    return node.map(child => renderToString(child, indent)).filter(Boolean).join('\n');
  }

  if (!isVNode(node)) {
    return '';
  }

  const { type, props } = node;
  const { children, ...restProps } = props;

  // Fragment 特殊处理
  if (typeof type === 'symbol' && type === Fragment) {
    if (children === undefined) return '';
    return renderToString(children, indent);
  }

  // 函数组件
  if (typeof type === 'function') {
    // 获取组件名称
    const componentName = type.name || 'AnonymousComponent';
    
    // 对于虚拟组件（返回 null），直接渲染为标签
    // 因为虚拟组件只是类型定义，不包含实际渲染逻辑
    try {
      const result = type(props);
      if (result === null || result === undefined) {
        // 虚拟组件，使用组件名称作为标签
        const propsStr = renderProps(restProps);
        const childrenStr = children !== undefined ? renderToString(children, indent + 2) : '';
        
        if (!childrenStr) {
          return `${getIndent(indent)}<${componentName}${propsStr} />`;
        }
        
        return [
          `${getIndent(indent)}<${componentName}${propsStr}>`,
          childrenStr,
          `${getIndent(indent)}</${componentName}>`,
        ].join('\n');
      }
      return renderToString(result, indent);
    } catch (e) {
      return `${getIndent(indent)}<!-- Error in ${componentName}: ${e} -->`;
    }
  }

  // 字符串组件
  const displayName = getDisplayName(node);
  const propsStr = renderProps(restProps);
  const childrenStr = children !== undefined ? renderToString(children, indent + 2) : '';

  if (!childrenStr) {
    return `${getIndent(indent)}<${displayName}${propsStr} />`;
  }

  return [
    `${getIndent(indent)}<${displayName}${propsStr}>`,
    childrenStr,
    `${getIndent(indent)}</${displayName}>`,
  ].join('\n');
}

/**
 * 渲染属性为字符串
 */
function renderProps(props: Record<string, any>): string {
  const entries = Object.entries(props).filter(([key, value]) => {
    // 过滤掉 undefined、null、false
    return value !== undefined && value !== null && value !== false;
  });

  if (entries.length === 0) {
    return '';
  }

  const propsStr = entries.map(([key, value]) => {
    if (value === true) {
      return key;
    }
    if (typeof value === 'function') {
      return `${key}={[Function]}`;
    }
    if (typeof value === 'object') {
      return `${key}={${JSON.stringify(value)}}`;
    }
    return `${key}="${escapeHtml(String(value))}"`;
  }).join(' ');

  return ' ' + propsStr;
}

/**
 * 获取缩进字符串
 */
function getIndent(level: number): string {
  return ' '.repeat(level);
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 将 VNode 转为 JSON（用于调试）
 */
export function vnodeToJson(node: VNodeChild): any {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(vnodeToJson).filter(Boolean);
  }

  if (!isVNode(node)) {
    return null;
  }

  const { type, props, key } = node;
  const { children, ...restProps } = props;

  return {
    type: typeof type === 'function' ? type.name || 'Function' : 
          typeof type === 'symbol' ? (type as symbol).description : type,
    props: Object.fromEntries(
      Object.entries(restProps).map(([k, v]) => [
        k,
        typeof v === 'function' ? '[Function]' : v,
      ])
    ),
    key,
    children: children !== undefined ? vnodeToJson(children) : undefined,
  };
}

