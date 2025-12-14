/**
 * React 桥接器
 * 
 * 将 DSL 响应式原语桥接到 React，实现真正的运行时渲染
 * 
 * 原理：
 * 1. DSL 页面定义使用 DSL 的 useState/useEffect
 * 2. 桥接器在 React 上下文中执行 DSL 页面
 * 3. 将 DSL 的状态变化同步到 React 状态
 * 4. 将 VNode 转换为 React 元素
 */

import React from 'react';
import type { VNode, VNodeChild } from './types';
import { Fragment } from './create-element';
import type { PageDefinition, ComponentDefinition } from './dsl-runtime/dsl-engine';
import { getPageByRoute, getDefaultPage, getAllComponents } from './dsl-runtime/dsl-engine';
import { setHookImplementation, type HookImplementation, type StateSetter } from './dsl-runtime/state';
import { setEffectHookImplementation, type EffectHookImplementation } from './dsl-runtime/lifecycle';
import { 
  getRouterAdapter, 
  HashRouterAdapter,
  createRouter,
  setRouter,
  getRouter,
  type Router,
  type RouteConfig,
} from './dsl-runtime/router';

// ==================== 类型定义 ====================

interface DSLBridgeState {
  /** 状态存储 */
  states: Map<number, any>;
  /** 状态更新触发器 */
  forceUpdate: () => void;
  /** 当前状态索引 */
  stateIndex: number;
  /** Effect 清理函数 */
  effectCleanups: Map<number, () => void>;
  /** Effect 依赖 */
  effectDeps: Map<number, any[]>;
  /** Effect 索引 */
  effectIndex: number;
  /** 是否已挂载 */
  mounted: boolean;
}

// 当前执行上下文
let currentBridgeState: DSLBridgeState | null = null;

// ==================== DSL Hook 实现（桥接到 React） ====================

/**
 * DSL useState - 桥接到 React 状态
 */
export function useBridgedState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  if (!currentBridgeState) {
    throw new Error('useBridgedState must be called within DSL context');
  }
  
  const state = currentBridgeState;
  const index = state.stateIndex++;
  
  // 初始化状态
  if (!state.states.has(index)) {
    state.states.set(index, typeof initialValue === 'function' ? initialValue() : initialValue);
  }
  
  const currentValue = state.states.get(index) as T;
  
  const setValue = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' 
      ? (value as (prev: T) => T)(state.states.get(index))
      : value;
    
    if (newValue !== state.states.get(index)) {
      state.states.set(index, newValue);
      state.forceUpdate();
    }
  };
  
  return [currentValue, setValue];
}

/**
 * DSL useEffect - 桥接到 React 效果
 */
export function useBridgedEffect(effect: () => void | (() => void), deps?: any[]): void {
  if (!currentBridgeState) {
    throw new Error('useBridgedEffect must be called within DSL context');
  }
  
  const state = currentBridgeState;
  const index = state.effectIndex++;
  
  // 检查依赖是否变化
  const prevDeps = state.effectDeps.get(index);
  const depsChanged = !prevDeps || !deps || deps.some((d, i) => d !== prevDeps[i]);
  
  if (depsChanged && state.mounted) {
    // 清理之前的 effect
    const cleanup = state.effectCleanups.get(index);
    if (cleanup) {
      cleanup();
    }
    
    // 执行新的 effect
    const newCleanup = effect();
    if (typeof newCleanup === 'function') {
      state.effectCleanups.set(index, newCleanup);
    }
    
    state.effectDeps.set(index, deps || []);
  }
}

/**
 * DSL useComputed - 计算属性
 */
export function useBridgedComputed<T>(compute: () => T, deps: any[]): T {
  if (!currentBridgeState) {
    throw new Error('useBridgedComputed must be called within DSL context');
  }
  
  // 简单实现：每次都重新计算
  // 优化版本可以缓存结果
  return compute();
}

// ==================== VNode 到 React 转换 ====================

// Ant Design 组件映射（需要外部注册）
let componentMapping: Record<string, React.ComponentType<any>> = {};

/**
 * 注册组件映射
 */
export function registerComponents(mapping: Record<string, React.ComponentType<any>>) {
  componentMapping = { ...componentMapping, ...mapping };
}

/**
 * 将 VNode 转换为 React 元素
 */
export function vnodeToReactElement(vnode: VNodeChild): React.ReactNode {
  // 处理 null/undefined
  if (vnode === null || vnode === undefined) {
    return null;
  }
  
  // 处理原始类型
  if (typeof vnode === 'string' || typeof vnode === 'number' || typeof vnode === 'boolean') {
    return vnode;
  }
  
  // 🎯 处理渲染函数（DSL 组件的 setup 返回 () => VNode）
  if (typeof vnode === 'function') {
    try {
      const result = (vnode as Function)();
      return vnodeToReactElement(result);
    } catch (e) {
      console.error('[ReactBridge] Error calling render function:', e);
      return null;
    }
  }
  
  // 处理数组
  if (Array.isArray(vnode)) {
    return React.createElement(
      React.Fragment,
      null,
      ...vnode.map((child, index) => {
        const result = vnodeToReactElement(child);
        if (React.isValidElement(result) && result.key === null) {
          return React.cloneElement(result, { key: index });
        }
        return result;
      })
    );
  }
  
  // 处理 VNode 对象
  if (typeof vnode === 'object' && vnode !== null) {
    // 检查是否有 $$typeof 或 type 属性（VNode 对象）
    if (!('type' in vnode)) {
      console.warn('[ReactBridge] Object without type:', vnode);
      return null;
    }
    
    const node = vnode as VNode;
    const { type, props, key } = node;
    
    // Fragment
    if (type === Fragment || (typeof type === 'symbol' && String(type).includes('Fragment'))) {
      const children = props?.children;
      return React.createElement(
        React.Fragment,
        { key },
        children ? vnodeToReactElement(children) : null
      );
    }
    
    // 字符串类型（HTML 元素或自定义组件名）
    if (typeof type === 'string') {
      // 检查是否是注册的组件
      const Component = componentMapping[type];
      
      if (Component) {
        return createReactElement(Component, props, key);
      } else {
        // 普通 HTML 元素
        return createReactElement(type, props, key);
      }
    }
    
    // 函数组件
    if (typeof type === 'function') {
      // 获取函数名用于组件映射
      const funcName = type.name || '';
      
      // 检查是否有对应的 Ant Design 组件映射
      if (componentMapping[funcName]) {
        return createReactElement(componentMapping[funcName], props, key);
      }
      
      // 检查是否是 DSL 组件（有 meta 属性）
      if ('meta' in type && 'setup' in type) {
        // DSL 组件：调用 setup 并递归转换结果
        try {
          const componentDef = type as any;
          const result = componentDef.setup(props);
          return vnodeToReactElement(result);
        } catch (e) {
          console.error('[ReactBridge] Error rendering DSL component:', e);
          return null;
        }
      }
      
      // 虚拟组件（@ai-builder/std-ui）：返回 null 的占位符
      // 尝试通过函数名查找映射
      if (funcName && componentMapping[funcName]) {
        return createReactElement(componentMapping[funcName], props, key);
      }
      
      // 未知函数组件 - 尝试调用它
      try {
        const result = (type as Function)(props);
        if (result === null || result === undefined) {
          // 这是虚拟组件，返回一个占位符
          console.warn(`[ReactBridge] Virtual component "${funcName}" returned null, using fallback`);
          return createFallbackElement(funcName, props, key);
        }
        return vnodeToReactElement(result);
      } catch (e) {
        console.error('[ReactBridge] Error rendering function:', e);
        return null;
      }
    }
    
    console.warn('[ReactBridge] Unknown VNode type:', type);
    return null;
  }
  
  console.warn('[ReactBridge] Unknown vnode:', vnode);
  return null;
}

/**
 * 创建回退元素（用于未映射的虚拟组件）
 */
function createFallbackElement(
  componentName: string,
  props: Record<string, any> | null,
  key: string | number | null | undefined
): React.ReactElement {
  const { children, ...restProps } = props || {};
  
  // 根据组件名创建简单的 HTML 元素
  const tagMap: Record<string, string> = {
    Page: 'div',
    Card: 'div',
    Row: 'div',
    Col: 'div',
    Space: 'div',
    Button: 'button',
    Input: 'input',
    Select: 'select',
    Table: 'table',
    Form: 'form',
    FormItem: 'div',
    Tag: 'span',
    Modal: 'div',
    Loading: 'div',
  };
  
  const tag = tagMap[componentName] || 'div';
  
  return React.createElement(
    tag,
    {
      key,
      className: `dsl-${componentName.toLowerCase()}`,
      'data-component': componentName,
      ...restProps,
    },
    children ? vnodeToReactElement(children) : null
  );
}

/**
 * 创建 React 元素，处理 props 转换
 */
function createReactElement(
  type: string | React.ComponentType<any>,
  props: Record<string, any> | null,
  key: string | number | null | undefined
): React.ReactElement {
  const reactProps: Record<string, any> = {};
  
  if (props) {
    for (const [propKey, value] of Object.entries(props)) {
      if (propKey === 'children') {
        reactProps.children = vnodeToReactElement(value);
      } else if (propKey === 'class') {
        reactProps.className = value;
      } else if (propKey === 'for') {
        reactProps.htmlFor = value;
      } else {
        reactProps[propKey] = value;
      }
    }
  }
  
  if (key !== null && key !== undefined) {
    reactProps.key = key;
  }
  
  return React.createElement(type, reactProps);
}

// ==================== DSL 页面渲染器 ====================

interface DSLPageRendererProps {
  /** 页面定义 */
  page: PageDefinition<any>;
  /** 页面 props */
  pageProps?: Record<string, any>;
  /** 服务获取函数 */
  getService?: <T>(serviceClass: any) => T;
}

/**
 * DSL 页面渲染器
 * 
 * 将 DSL 页面定义渲染为 React 组件
 * 通过注入 Hook 实现，让 DSL 代码使用 React 的响应式系统
 */
export const DSLPageRenderer: React.FC<DSLPageRendererProps> = ({ 
  page, 
  pageProps = {},
  getService 
}) => {
  // 强制更新计数器
  const [updateCount, setUpdateCount] = React.useState(0);
  const forceUpdate = React.useCallback(() => {
    console.log('[DSLPageRenderer] Force update triggered');
    setUpdateCount(c => c + 1);
  }, []);
  
  // 桥接状态存储
  const bridgeStateRef = React.useRef<DSLBridgeState>({
    states: new Map(),
    forceUpdate,
    stateIndex: 0,
    effectCleanups: new Map(),
    effectDeps: new Map(),
    effectIndex: 0,
    mounted: false,
  });
  
  // 更新 forceUpdate 引用
  bridgeStateRef.current.forceUpdate = forceUpdate;
  
  // 🎯 关键：当 page 变化时，重置状态
  const prevPageRef = React.useRef(page);
  if (prevPageRef.current !== page) {
    console.log('[DSLPageRenderer] Page changed, resetting state');
    bridgeStateRef.current.states.clear();
    bridgeStateRef.current.effectCleanups.forEach(cleanup => cleanup());
    bridgeStateRef.current.effectCleanups.clear();
    bridgeStateRef.current.effectDeps.clear();
    bridgeStateRef.current.mounted = false;
    prevPageRef.current = page;
  }
  
  // 注入服务获取函数到 props
  const enrichedProps = React.useMemo(() => ({
    ...pageProps,
    getService,
  }), [pageProps, getService]);
  
  // 🎯 创建 React Hook 实现并注入到 DSL 运行时
  const hookImpl: HookImplementation = React.useMemo(() => ({
    useState: <T,>(initial: T): [T, StateSetter<T>] => {
      const state = bridgeStateRef.current;
      const index = state.stateIndex++;
      
      // 初始化状态
      if (!state.states.has(index)) {
        const initValue = typeof initial === 'function' ? (initial as () => T)() : initial;
        state.states.set(index, initValue);
      }
      
      const currentValue = state.states.get(index) as T;
      
      const setValue: StateSetter<T> = (value) => {
        const newValue = typeof value === 'function' 
          ? (value as (prev: T) => T)(state.states.get(index))
          : value;
        
        if (newValue !== state.states.get(index)) {
          console.log(`[DSLPageRenderer] State ${index} changed:`, state.states.get(index), '->', newValue);
          state.states.set(index, newValue);
          state.forceUpdate();
        }
      };
      
      return [currentValue, setValue];
    },
    
    useComputed: <T,>(compute: () => T, deps?: any[]): T => {
      return compute();
    },
  }), []);
  
  // 🎯 创建 Effect Hook 实现
  const effectHookImpl: EffectHookImplementation = React.useMemo(() => ({
    useEffect: (effect: () => void | (() => void), deps?: any[]): void => {
      const state = bridgeStateRef.current;
      const index = state.effectIndex++;
      
      // 检查依赖是否变化
      const prevDeps = state.effectDeps.get(index);
      const depsChanged = !prevDeps || !deps || 
        deps.length !== prevDeps.length ||
        deps.some((d, i) => d !== prevDeps[i]);
      
      if (depsChanged && state.mounted) {
        // 清理之前的 effect
        const cleanup = state.effectCleanups.get(index);
        if (cleanup) {
          cleanup();
        }
        
        // 执行新的 effect
        console.log(`[DSLPageRenderer] Executing effect ${index}`);
        const newCleanup = effect();
        if (typeof newCleanup === 'function') {
          state.effectCleanups.set(index, newCleanup);
        }
        
        state.effectDeps.set(index, deps || []);
      }
    },
  }), []);
  
  // 执行 DSL 页面的 setup 函数
  const vnode = React.useMemo(() => {
    const state = bridgeStateRef.current;
    state.stateIndex = 0;
    state.effectIndex = 0;
    
    // 🎯 注入 Hook 实现到 DSL 运行时
    setHookImplementation(hookImpl);
    setEffectHookImplementation(effectHookImpl);
    
    try {
      console.log('[DSLPageRenderer] Executing page setup...');
      // 执行 DSL 页面的 setup 函数
      const result = page.setup(enrichedProps);
      console.log('[DSLPageRenderer] Page setup result:', result);
      return result;
    } finally {
      // 恢复默认实现
      setHookImplementation(null);
      setEffectHookImplementation(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, enrichedProps, hookImpl, effectHookImpl, updateCount]);
  
  // 挂载后标记并触发 effects
  React.useEffect(() => {
    const state = bridgeStateRef.current;
    state.mounted = true;
    console.log('[DSLPageRenderer] Component mounted, triggering effects...');
    
    // 重新执行以触发 effects
    state.stateIndex = 0;
    state.effectIndex = 0;
    
    setHookImplementation(hookImpl);
    setEffectHookImplementation(effectHookImpl);
    
    try {
      page.setup(enrichedProps);
    } finally {
      setHookImplementation(null);
      setEffectHookImplementation(null);
    }
    
    // 清理函数
    return () => {
      console.log('[DSLPageRenderer] Component unmounting, cleaning up...');
      state.mounted = false;
      state.effectCleanups.forEach(cleanup => cleanup());
      state.effectCleanups.clear();
    };
  }, [page, enrichedProps, hookImpl, effectHookImpl]);
  
  // 转换 VNode 为 React 元素
  const reactElement = React.useMemo(() => {
    if (!vnode) {
      console.log('[DSLPageRenderer] VNode is null');
      return null;
    }
    console.log('[DSLPageRenderer] Converting VNode to React element...');
    return vnodeToReactElement(vnode);
  }, [vnode]);
  
  return reactElement as React.ReactElement;
};

// ==================== DSL 应用渲染器 ====================

interface DSLAppRendererProps {
  /** 服务获取函数 */
  getService: <T>(serviceClass: any) => T;
  /** 初始路由 */
  initialRoute?: string;
}

/**
 * DSL 应用渲染器（传统模式）
 * 
 * 自动根据路由加载 DSL 页面并渲染
 * 使用 definePage 注册的页面
 * 
 * @deprecated 推荐使用 RouterProvider + createRouter
 */
export const DSLAppRenderer: React.FC<DSLAppRendererProps> = ({
  getService,
  initialRoute,
}) => {
  const routerAdapter = getRouterAdapter();
  
  const [currentRoute, setCurrentRoute] = React.useState(() => {
    if (initialRoute) return initialRoute;
    const location = routerAdapter.getLocation();
    return location.pathname || '/orders';
  });
  
  // 监听路由变化（使用路由适配器）
  React.useEffect(() => {
    const unsubscribe = routerAdapter.listen((location) => {
      console.log('[DSLAppRenderer] Route changed:', location.pathname);
      setCurrentRoute(location.pathname);
    });
    
    return unsubscribe;
  }, [routerAdapter]);
  
  // 获取页面定义并更新路由适配器的当前模式
  const page = React.useMemo(() => {
    const p = getPageByRoute(currentRoute) || getDefaultPage();
    console.log('[DSLAppRenderer] Page for route:', currentRoute, p?.meta.title);
    
    // 更新路由适配器的当前路由模式（用于 useParams）
    if (p && p.meta.route && routerAdapter instanceof HashRouterAdapter) {
      routerAdapter.setCurrentPattern(p.meta.route);
    }
    
    return p;
  }, [currentRoute, routerAdapter]);
  
  if (!page) {
    return React.createElement('div', { className: 'dsl-error' }, `未找到页面: ${currentRoute}`);
  }
  
  return React.createElement(DSLPageRenderer, {
    page,
    getService,
  });
};

// ==================== RouterProvider（推荐方式） ====================

interface RouterProviderProps {
  /** 路由实例（通过 createRouter 创建） */
  router: Router;
  /** 服务获取函数 */
  getService?: <T>(serviceClass: any) => T;
  /** 加载中显示的内容 */
  fallback?: React.ReactNode;
  /** 404 页面内容 */
  notFound?: React.ReactNode;
}

/**
 * 路由提供者组件
 * 
 * 🎯 类似 React Router 的 RouterProvider
 * 
 * @example
 * ```tsx
 * import { createRouter, RouterProvider } from '@ai-builder/jsx-runtime';
 * import { routes } from './routes';
 * 
 * const router = createRouter(routes);
 * 
 * function App() {
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export const RouterProvider: React.FC<RouterProviderProps> = ({
  router,
  getService,
  fallback = React.createElement('div', { className: 'dsl-loading' }, '加载中...'),
  notFound = React.createElement('div', { className: 'dsl-not-found' }, '页面未找到'),
}) => {
  // 设置全局路由实例
  React.useEffect(() => {
    setRouter(router);
    return () => setRouter(null as any);
  }, [router]);
  
  // 当前路由状态
  const [currentRoute, setCurrentRoute] = React.useState<RouteConfig | null>(router.currentRoute);
  const [currentPage, setCurrentPage] = React.useState<PageDefinition<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // 监听路由变化
  React.useEffect(() => {
    const unsubscribe = router.subscribe(async (location, route) => {
      console.log('[RouterProvider] Route changed:', location.pathname, route?.title);
      setCurrentRoute(route);
      
      if (route) {
        setLoading(true);
        const page = await router.loadPage(route);
        setCurrentPage(page);
        setLoading(false);
      } else {
        setCurrentPage(null);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, [router]);
  
  // 加载中
  if (loading) {
    return fallback as React.ReactElement;
  }
  
  // 未找到路由
  if (!currentRoute || !currentPage) {
    return notFound as React.ReactElement;
  }
  
  // 渲染页面
  return React.createElement(DSLPageRenderer, {
    page: currentPage,
    getService,
  });
};

// ==================== 便捷函数 ====================

/**
 * 创建 DSL 应用
 * 
 * 🎯 一站式创建路由和应用
 * 
 * @example
 * ```tsx
 * import { createDSLRouter } from '@ai-builder/jsx-runtime';
 * import { routes } from './routes';
 * 
 * const { router, Provider } = createDSLRouter(routes);
 * 
 * // 在 React 中使用
 * <Provider />
 * ```
 */
export function createDSLRouter(
  routes: RouteConfig[],
  options?: {
    getService?: <T>(serviceClass: any) => T;
    fallback?: React.ReactNode;
    notFound?: React.ReactNode;
  }
): {
  router: Router;
  Provider: React.FC;
} {
  const router = createRouter(routes);
  
  const Provider: React.FC = () => {
    return React.createElement(RouterProvider, {
      router,
      getService: options?.getService,
      fallback: options?.fallback,
      notFound: options?.notFound,
    });
  };
  
  return { router, Provider };
}

// ==================== 导出 ====================

export {
  useBridgedState as useState,
  useBridgedEffect as useEffect,
  useBridgedComputed as useComputed,
};

