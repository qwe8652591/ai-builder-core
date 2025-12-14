/**
 * React 渲染器
 * 
 * 将 VNode 转换为 React 元素进行渲染
 * 这是方案 A：复用 React 生态实现快速渲染
 */

import React from 'react';
import type { VNode, VNodeChild } from '@qwe8652591/dsl-core';
import { Fragment } from '@qwe8652591/dsl-core';

// Ant Design 组件映射
let antdComponents: Record<string, React.ComponentType<any>> | null = null;

/**
 * 注册 Ant Design 组件
 * 在应用启动时调用
 */
export function registerAntdComponents(components: Record<string, React.ComponentType<any>>) {
  antdComponents = components;
}

/**
 * 获取组件映射
 */
function getComponentMapping(): Record<string, React.ComponentType<any>> {
  return antdComponents || {};
}

/**
 * 将 VNode 转换为 React 元素
 */
export function vnodeToReact(vnode: VNodeChild): React.ReactNode {
  // 处理 null/undefined
  if (vnode === null || vnode === undefined) {
    return null;
  }
  
  // 处理原始类型
  if (typeof vnode === 'string' || typeof vnode === 'number' || typeof vnode === 'boolean') {
    return vnode;
  }
  
  // 处理数组
  if (Array.isArray(vnode)) {
    return vnode.map((child, index) => {
      const result = vnodeToReact(child);
      // 给数组元素添加 key
      if (React.isValidElement(result) && result.key === null) {
        return React.cloneElement(result, { key: index });
      }
      return result;
    });
  }
  
  // 处理 VNode 对象
  if (typeof vnode === 'object' && '$$typeof' in vnode) {
    const node = vnode as VNode;
    const { type, props, key, ref } = node;
    
    // Fragment
    if (type === Fragment || type === React.Fragment || (typeof type === 'symbol' && type.description === 'Fragment')) {
      const children = props?.children;
      return React.createElement(
        React.Fragment,
        { key },
        children ? vnodeToReact(children) : null
      );
    }
    
    // 字符串类型（HTML 元素或自定义组件名）
    if (typeof type === 'string') {
      const componentMap = getComponentMapping();
      const Component = componentMap[type];
      
      if (Component) {
        // 使用映射的 Ant Design 组件
        return createReactElement(Component, props, key, ref);
      } else {
        // 普通 HTML 元素
        return createReactElement(type, props, key, ref);
      }
    }
    
    // 函数组件（自定义 DSL 组件）
    if (typeof type === 'function') {
      // 检查是否是 DSL 组件（有 render 方法）
      if ('render' in type && typeof (type as any).render === 'function') {
        // 调用 DSL 组件的 render 方法获取 VNode
        const dslVNode = (type as any).render(props);
        return vnodeToReact(dslVNode);
      }
      
      // 普通函数组件
      try {
        const result = (type as Function)(props);
        return vnodeToReact(result);
      } catch (e) {
        console.error('[ReactRenderer] Error rendering function component:', e);
        return null;
      }
    }
    
    // 其他类型
    console.warn('[ReactRenderer] Unknown VNode type:', type);
    return null;
  }
  
  // 未知类型
  console.warn('[ReactRenderer] Unknown vnode:', vnode);
  return null;
}

/**
 * 创建 React 元素，处理 props 转换
 */
function createReactElement(
  type: string | React.ComponentType<any>,
  props: Record<string, any> | null,
  key: string | number | null | undefined,
  ref: any
): React.ReactElement {
  const reactProps: Record<string, any> = {};
  
  if (props) {
    for (const [propKey, value] of Object.entries(props)) {
      if (propKey === 'children') {
        // 递归转换子元素
        reactProps.children = vnodeToReact(value);
      } else if (propKey === 'class') {
        // class → className
        reactProps.className = value;
      } else if (propKey === 'for') {
        // for → htmlFor
        reactProps.htmlFor = value;
      } else if (propKey.startsWith('on') && typeof value === 'function') {
        // 事件处理器保持不变
        reactProps[propKey] = value;
      } else if (propKey === 'style' && typeof value === 'object') {
        // 样式对象保持不变
        reactProps.style = value;
      } else {
        reactProps[propKey] = value;
      }
    }
  }
  
  if (key !== null && key !== undefined) {
    reactProps.key = key;
  }
  
  if (ref) {
    reactProps.ref = ref;
  }
  
  return React.createElement(type, reactProps);
}

/**
 * DSL 页面包装组件
 * 用于渲染 DSL 页面定义
 */
interface DSLPageRendererProps {
  vnode: VNode | null;
}

export const DSLPageRenderer: React.FC<DSLPageRendererProps> = ({ vnode }) => {
  if (!vnode) {
    return React.createElement('div', { className: 'dsl-page-empty' }, '页面为空');
  }
  
  return vnodeToReact(vnode) as React.ReactElement;
};

/**
 * 创建 DSL 应用根组件
 */
interface DSLAppProps {
  engine: any; // DSLEngine
  initialRoute?: string;
}

export function createDSLApp(getPageByRoute: (route: string) => any, getDefaultPage: () => any) {
  const DSLApp: React.FC<DSLAppProps> = ({ engine, initialRoute }) => {
    const [currentRoute, setCurrentRoute] = React.useState(
      initialRoute || window.location.hash.replace('#', '') || '/orders'
    );
    const [vnode, setVnode] = React.useState<VNode | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
      const loadPage = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const page = getPageByRoute(currentRoute) || getDefaultPage();
          if (!page) {
            setError(`未找到页面: ${currentRoute}`);
            return;
          }
          
          const pageCtx = engine.createPage(page, {});
          const result = engine.getRenderResult(pageCtx);
          setVnode(result);
          
          // 挂载页面（触发生命周期）
          await engine.mountPage(pageCtx);
        } catch (e: any) {
          console.error('[DSLApp] Error loading page:', e);
          setError(e.message || '加载页面失败');
        } finally {
          setLoading(false);
        }
      };
      
      loadPage();
    }, [currentRoute, engine]);
    
    // 监听路由变化
    React.useEffect(() => {
      const handleHashChange = () => {
        const newRoute = window.location.hash.replace('#', '') || '/orders';
        setCurrentRoute(newRoute);
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    if (loading) {
      return React.createElement('div', { className: 'dsl-loading' }, '加载中...');
    }
    
    if (error) {
      return React.createElement('div', { className: 'dsl-error' }, `错误: ${error}`);
    }
    
    return React.createElement(DSLPageRenderer, { vnode });
  };
  
  return DSLApp;
}

