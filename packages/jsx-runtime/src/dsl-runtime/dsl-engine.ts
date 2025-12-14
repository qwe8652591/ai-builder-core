/**
 * DSL 引擎
 * 
 * 解释执行 DSL 定义，管理页面生命周期
 */

import type { VNode, VNodeChild } from '../types';
import { PageContext, runInContext, type PageMeta, type IPageContext } from './page-context';
import { registerMetadata } from './metadata-store';

/** JSX 返回类型（兼容 React JSX.Element） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JSXReturn = VNodeChild | any;

/** 页面定义参数 */
export interface PageDefinition<P = {}> {
  meta: PageMeta;
  setup: (props: P) => JSXReturn;
}

/** 服务类型 */
export type ServiceClass<T> = new (...args: unknown[]) => T;

/** DSL 引擎配置 */
export interface DSLEngineConfig {
  /** 服务获取函数（支持类类型或字符串名称） */
  getService?: <T>(serviceClass: ServiceClass<T> | string) => T;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * DSL 引擎
 */
export class DSLEngine {
  private config: DSLEngineConfig;
  private pages = new Map<string, PageContext>();
  
  constructor(config: DSLEngineConfig = {}) {
    this.config = config;
  }
  
  /**
   * 创建页面实例
   * 
   * @param definition - 页面定义
   * @param props - 页面属性
   * @returns 页面上下文
   */
  createPage<P = {}>(definition: PageDefinition<P>, props: P = {} as P): PageContext {
    const ctx = new PageContext(definition.meta);
    
    // 注入服务获取函数
    if (this.config.getService) {
      const getService = this.config.getService;
      ctx.getService = <T>(name: string) => getService<T>(name);
    }
    
    // 在上下文中执行 setup
    const vnode = runInContext(ctx, () => definition.setup(props));
    ctx.setRenderResult(vnode as VNode);
    
    // 注册页面
    if (definition.meta.route) {
      this.pages.set(definition.meta.route, ctx);
    }
    
    return ctx;
  }
  
  /**
   * 挂载页面
   * 
   * @param ctx - 页面上下文
   */
  async mountPage(ctx: PageContext): Promise<void> {
    if (this.config.debug) {
      console.log('[DSLEngine] Mounting page:', ctx.meta.title);
    }
    
    await ctx.mount();
    
    if (this.config.debug) {
      console.log('[DSLEngine] Page mounted:', ctx.meta.title);
    }
  }
  
  /**
   * 卸载页面
   * 
   * @param ctx - 页面上下文
   */
  async unmountPage(ctx: PageContext): Promise<void> {
    if (this.config.debug) {
      console.log('[DSLEngine] Unmounting page:', ctx.meta.title);
    }
    
    await ctx.unmount();
    
    // 从注册表中移除
    if (ctx.meta.route) {
      this.pages.delete(ctx.meta.route);
    }
    
    ctx.destroy();
    
    if (this.config.debug) {
      console.log('[DSLEngine] Page unmounted:', ctx.meta.title);
    }
  }
  
  /**
   * 获取页面的渲染结果（VNode 树）
   * 
   * @param ctx - 页面上下文
   * @returns VNode 树
   */
  getRenderResult(ctx: PageContext): VNode | null {
    return ctx.renderResult;
  }
  
  /**
   * 销毁引擎
   */
  destroy(): void {
    for (const ctx of this.pages.values()) {
      ctx.destroy();
    }
    this.pages.clear();
  }
}

/** 全局 DSL 引擎实例 */
let globalEngine: DSLEngine | null = null;

/**
 * 获取或创建全局 DSL 引擎
 */
export function getEngine(config?: DSLEngineConfig): DSLEngine {
  if (!globalEngine) {
    globalEngine = new DSLEngine(config);
  }
  return globalEngine;
}

/**
 * 设置全局 DSL 引擎
 */
export function setEngine(engine: DSLEngine): void {
  globalEngine = engine;
}

/**
 * definePage - 定义页面
 * 
 * 编译时 DSL 原语，在运行时由引擎执行
 * 
 * @example
 * ```tsx
 * export default definePage({
 *   meta: { title: '订单列表', route: '/orders' },
 *   setup() {
 *     const [data, setData] = useState([]);
 *     
 *     useEffect(() => {
 *       loadData();
 *     }, []);
 *     
 *     return (
 *       <Page title="订单">
 *         <Table data={data} />
 *       </Page>
 *     );
 *   }
 * });
 * ```
 */
// 页面注册表（用于路由自动匹配）
const pageRegistry = new Map<string, PageDefinition<any>>();

export function definePage<P = {}>(
  meta: PageMeta,
  setup: (props: P) => JSXReturn
): PageDefinition<P> {
  const definition: PageDefinition<P> = { meta, setup };
  
  // 自动注册到页面注册表（用于路由匹配）
  if (meta.route) {
    pageRegistry.set(meta.route, definition);
    console.log(`[PageRegistry] 已注册页面: ${meta.title || meta.route} -> ${meta.route}`);
  }
  
  // 🎯 注册到 Metadata Store（用于架构展示）
  registerMetadata({
    __type: 'page',
    name: meta.title || meta.route || 'AnonymousPage',
    meta,
    description: meta.description,
    definition,
  });
  
  return definition;
}

/**
 * 根据路由获取页面定义
 */
export function getPageByRoute(route: string): PageDefinition<any> | undefined {
  // 精确匹配
  if (pageRegistry.has(route)) {
    return pageRegistry.get(route);
  }
  
  // 模糊匹配（支持 /orders/:id 这种格式）
  for (const [pattern, page] of pageRegistry.entries()) {
    if (matchRoute(pattern, route)) {
      return page;
    }
  }
  
  return undefined;
}

/**
 * 获取所有已注册的页面
 */
export function getAllPages(): Map<string, PageDefinition<any>> {
  return new Map(pageRegistry);
}

/**
 * 获取默认页面（第一个注册的页面或 "/" 路由）
 */
export function getDefaultPage(): PageDefinition<any> | undefined {
  if (pageRegistry.has('/')) {
    return pageRegistry.get('/');
  }
  // 返回第一个注册的页面
  const first = pageRegistry.values().next();
  return first.done ? undefined : first.value;
}

/**
 * 简单的路由匹配（支持 :param 参数）
 */
function matchRoute(pattern: string, route: string): boolean {
  const patternParts = pattern.split('/');
  const routeParts = route.split('/');
  
  if (patternParts.length !== routeParts.length) return false;
  
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    const r = routeParts[i];
    
    // 参数匹配
    if (p.startsWith(':')) continue;
    
    // 精确匹配
    if (p !== r) return false;
  }
  
  return true;
}

// ==================== 组件注册表 ====================

/** 组件元数据 */
export interface ComponentMeta {
  name: string;
  description?: string;
  props?: string[];
  category?: string;  // 分类：'layout' | 'form' | 'data' | 'feedback' | 'business'
}

/** 组件定义接口 */
export interface ComponentDefinitionBase<P = Record<string, unknown>> {
  meta: ComponentMeta;
  props?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (props: P) => () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (props: P) => any;
}

/** 
 * 组件定义类型 - 既是函数又有元数据
 * 可以直接作为 JSX 标签使用：<MyComponent prop="value" />
 */
export type ComponentDefinition<P = Record<string, unknown>> = 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((props: P) => any) & ComponentDefinitionBase<P>;

/** 组件注册表 */
const componentRegistry = new Map<string, ComponentDefinition<unknown>>();

/**
 * defineComponent - 定义组件（自动注册）
 * 
 * @example
 * ```tsx
 * export const OrderCard = defineComponent({
 *   meta: { name: 'OrderCard', category: 'business' },
 *   props: ['order'],
 *   setup(props: { order: Order }) {
 *     return () => (
 *       <Card title={props.order.title}>
 *         <div>{props.order.amount}</div>
 *       </Card>
 *     );
 *   }
 * });
 * ```
 */
export function defineComponent<P = Record<string, unknown>>(options: {
  meta?: ComponentMeta;
  props?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (props: P) => () => any;
}): ComponentDefinition<P> {
  // 渲染函数
  const render = (props: P) => {
    const ctx = new PageContext({});
    const renderFn = runInContext(ctx, () => options.setup(props));
    return renderFn() as VNode | null;
  };
  
  // 🎯 核心：创建一个既是函数又有属性的对象
  // 这样可以直接作为 JSX 标签使用：<MyComponent prop="value" />
  const Component = function(props: P) {
    return render(props);
  } as ComponentDefinition<P>;
  
  // 附加元数据
  Component.meta = options.meta || { name: 'Anonymous' };
  Component.props = options.props;
  Component.setup = options.setup;
  Component.render = render;
  
  // 设置函数名称（用于调试）
  Object.defineProperty(Component, 'name', { 
    value: options.meta?.name || 'AnonymousComponent',
    writable: false 
  });
  
  // 自动注册到组件注册表
  if (options.meta?.name) {
    componentRegistry.set(options.meta.name, Component as ComponentDefinition<unknown>);
    console.log(`[ComponentRegistry] 已注册组件: ${options.meta.name}`);
    
    // 🎯 注册到 Metadata Store（用于架构展示）
    registerMetadata({
      __type: 'component',
      name: options.meta.name,
      meta: options.meta,
      description: options.meta.description,
      props: options.props,
      definition: Component,
    });
  }
  
  return Component;
}

/**
 * 根据名称获取组件
 */
export function getComponent<P = unknown>(name: string): ComponentDefinition<P> | undefined {
  return componentRegistry.get(name) as ComponentDefinition<P> | undefined;
}

/**
 * 获取所有已注册的组件
 */
export function getAllComponents(): Map<string, ComponentDefinition<unknown>> {
  return new Map(componentRegistry);
}

/**
 * 按分类获取组件
 */
export function getComponentsByCategory(category: string): Map<string, ComponentDefinition<unknown>> {
  const result = new Map<string, ComponentDefinition<unknown>>();
  for (const [name, comp] of componentRegistry.entries()) {
    if (comp.meta.category === category) {
      result.set(name, comp);
    }
  }
  return result;
}

