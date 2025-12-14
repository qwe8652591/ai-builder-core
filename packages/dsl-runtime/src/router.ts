/**
 * 路由 DSL 模块
 * 
 * 🎯 参考 React Router v6 风格，实现 DSL 原生路由系统
 * 
 * 功能：
 * - useNavigate: 导航 hook
 * - useParams: 获取路由参数
 * - useQuery: 获取查询参数
 * - useLocation: 获取当前位置信息
 * - createRouter: 创建路由实例（类似 createBrowserRouter）
 * - 路由适配器机制：便于切换底层路由实现
 * 
 * @example
 * ```ts
 * // routes.ts - 定义路由配置
 * export const routes: RouteConfig[] = [
 *   { path: '/', redirectTo: '/orders' },
 *   { path: '/orders', element: () => import('./pages/OrderList.page'), title: '订单列表' },
 *   { path: '/orders/:id', element: () => import('./pages/OrderDetail.page'), title: '订单详情' },
 * ];
 * 
 * // main.tsx - 创建路由并渲染
 * const router = createRouter(routes);
 * render(<RouterProvider router={router} />);
 * ```
 */

import type { PageDefinition } from '@qwe8652591/dsl-core';

// ==================== 路由配置类型（参考 React Router v6） ====================

/**
 * 路由配置项
 * 
 * 🎯 参考 React Router 的 RouteObject，适配 DSL 页面系统
 */
export interface RouteConfig {
  /** 路由路径（支持动态参数 :id） */
  path: string;
  /** 页面组件（懒加载） */
  element?: () => Promise<{ default: PageDefinition }>;
  /** 重定向目标 */
  redirectTo?: string;
  /** 页面标题 */
  title?: string;
  /** 权限标识 */
  permission?: string;
  /** 是否需要登录 */
  auth?: boolean;
  /** 菜单配置 */
  menu?: {
    /** 菜单图标 */
    icon?: string;
    /** 菜单名称（默认使用 title） */
    label?: string;
    /** 是否在菜单中隐藏 */
    hidden?: boolean;
    /** 排序权重 */
    order?: number;
    /** 父菜单 key */
    parent?: string;
  };
  /** 子路由 */
  children?: RouteConfig[];
  /** 路由元信息（可扩展） */
  meta?: Record<string, unknown>;
}

/**
 * 路由实例
 */
export interface Router {
  /** 路由配置 */
  routes: RouteConfig[];
  /** 当前匹配的路由 */
  currentRoute: RouteConfig | null;
  /** 当前路由参数 */
  params: Record<string, string>;
  /** 导航到指定路径 */
  navigate: (to: string | number, options?: NavigateOptions) => void;
  /** 获取当前位置 */
  getLocation: () => LocationInfo;
  /** 匹配路由 */
  matchRoute: (pathname: string) => { route: RouteConfig; params: Record<string, string> } | null;
  /** 监听路由变化 */
  subscribe: (listener: (location: LocationInfo, route: RouteConfig | null) => void) => () => void;
  /** 加载页面组件 */
  loadPage: (route: RouteConfig) => Promise<PageDefinition | null>;
}

// ==================== 基础类型定义 ====================

/**
 * 导航选项
 */
export interface NavigateOptions {
  /** 是否替换当前历史记录（而不是 push） */
  replace?: boolean;
  /** 额外的状态数据 */
  state?: Record<string, unknown>;
}

/**
 * 位置信息
 */
export interface LocationInfo {
  /** 路径名，如 /orders/123 */
  pathname: string;
  /** 查询参数对象 */
  query: Record<string, string>;
  /** 原始查询字符串，如 ?mode=edit */
  search: string;
  /** hash 部分（不含 #） */
  hash: string;
  /** 完整的原始 URL */
  href: string;
}

/**
 * 路由匹配结果
 */
export interface RouteMatch {
  /** 是否匹配 */
  matched: boolean;
  /** 路由参数 */
  params: Record<string, string>;
  /** 匹配的路由模式 */
  pattern?: string;
}

/**
 * 路由适配器接口
 * 
 * 实现此接口以支持不同的路由库
 */
export interface RouterAdapter {
  /** 适配器名称 */
  name: string;
  
  /** 导航到指定路径 */
  navigate(to: string | number, options?: NavigateOptions): void;
  
  /** 获取路由参数（从 /orders/:id 中获取 id） */
  getParams(): Record<string, string>;
  
  /** 获取查询参数（从 ?mode=edit 中获取） */
  getQuery(): Record<string, string>;
  
  /** 获取当前位置信息 */
  getLocation(): LocationInfo;
  
  /** 监听路由变化 */
  listen(callback: (location: LocationInfo) => void): () => void;
  
  /** 匹配路由 */
  matchRoute(pattern: string, path: string): RouteMatch;
}

// ==================== Hash 路由适配器（默认） ====================

/**
 * 解析 hash URL
 */
function parseHashUrl(hash: string): LocationInfo {
  // 移除开头的 # 和 /
  const cleanHash = hash.replace(/^#\/?/, '/');
  
  // 分离路径和查询参数
  const [pathWithHash, ...hashParts] = cleanHash.split('#');
  const [pathname, search = ''] = pathWithHash.split('?');
  
  // 解析查询参数
  const query: Record<string, string> = {};
  if (search) {
    const searchParams = new URLSearchParams(search);
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
  }
  
  return {
    pathname: pathname || '/',
    query,
    search: search ? `?${search}` : '',
    hash: hashParts.join('#'),
    href: window.location.href,
  };
}

/**
 * 匹配路由模式
 * 
 * @example
 * matchRoute('/orders/:id', '/orders/123') 
 * // => { matched: true, params: { id: '123' } }
 */
function matchRoutePattern(pattern: string, path: string): RouteMatch {
  // 移除查询参数
  const cleanPath = path.split('?')[0];
  
  // 将模式转换为正则表达式
  const paramNames: string[] = [];
  const regexPattern = pattern
    .replace(/\/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '/([^/]+)';
    })
    .replace(/\//g, '\\/');
  
  const regex = new RegExp(`^${regexPattern}$`);
  const match = cleanPath.match(regex);
  
  if (!match) {
    return { matched: false, params: {} };
  }
  
  // 提取参数
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  
  return { matched: true, params, pattern };
}

/**
 * Hash 路由适配器
 * 
 * 使用 window.location.hash 进行路由管理
 */
export class HashRouterAdapter implements RouterAdapter {
  name = 'hash';
  
  private currentPattern: string = '';
  private cachedParams: Record<string, string> = {};
  
  /**
   * 设置当前匹配的路由模式（由 DSLAppRenderer 调用）
   */
  setCurrentPattern(pattern: string): void {
    this.currentPattern = pattern;
    this.updateCachedParams();
  }
  
  private updateCachedParams(): void {
    if (this.currentPattern) {
      const location = this.getLocation();
      const match = this.matchRoute(this.currentPattern, location.pathname);
      this.cachedParams = match.params;
    }
  }
  
  navigate(to: string | number, options?: NavigateOptions): void {
    if (typeof to === 'number') {
      // 后退/前进
      window.history.go(to);
      return;
    }
    
    // 处理路径
    let targetPath = to;
    if (!targetPath.startsWith('#')) {
      targetPath = `#${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;
    }
    
    if (options?.replace) {
      // 替换当前记录
      const newUrl = `${window.location.origin}${window.location.pathname}${targetPath}`;
      window.history.replaceState(options?.state || null, '', newUrl);
      // 手动触发 hashchange 事件
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      // 正常跳转
      window.location.hash = targetPath;
    }
  }
  
  getParams(): Record<string, string> {
    return { ...this.cachedParams };
  }
  
  getQuery(): Record<string, string> {
    return this.getLocation().query;
  }
  
  getLocation(): LocationInfo {
    return parseHashUrl(window.location.hash);
  }
  
  listen(callback: (location: LocationInfo) => void): () => void {
    const handler = () => {
      this.updateCachedParams();
      callback(this.getLocation());
    };
    
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }
  
  matchRoute(pattern: string, path: string): RouteMatch {
    return matchRoutePattern(pattern, path);
  }
}

// ==================== 路由管理器 ====================

/**
 * 全局路由适配器实例
 */
let currentAdapter: RouterAdapter = new HashRouterAdapter();

/**
 * 路由变化监听器
 */
const routeListeners: Set<(location: LocationInfo) => void> = new Set();
let unsubscribe: (() => void) | null = null;

/**
 * 初始化路由监听
 */
function initRouteListening(): void {
  if (unsubscribe) return;
  
  unsubscribe = currentAdapter.listen((location) => {
    routeListeners.forEach(listener => listener(location));
  });
}

/**
 * 设置路由适配器
 * 
 * @example
 * // 使用自定义适配器
 * setRouterAdapter(new ReactRouterAdapter(router));
 */
export function setRouterAdapter(adapter: RouterAdapter): void {
  // 清理旧的监听
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  
  currentAdapter = adapter;
  
  // 重新初始化监听
  if (routeListeners.size > 0) {
    initRouteListening();
  }
}

/**
 * 获取当前路由适配器
 */
export function getRouterAdapter(): RouterAdapter {
  return currentAdapter;
}

// ==================== 路由 Hooks ====================

/**
 * 导航 Hook
 * 
 * @example
 * const navigate = useNavigate();
 * navigate('/orders');                    // 跳转到列表
 * navigate('/orders/123');                // 跳转到详情
 * navigate('/orders', { replace: true }); // 替换当前记录
 * navigate(-1);                           // 后退
 */
export function useNavigate(): (to: string | number, options?: NavigateOptions) => void {
  return (to: string | number, options?: NavigateOptions) => {
    currentAdapter.navigate(to, options);
  };
}

/**
 * 获取路由参数 Hook
 * 
 * @example
 * // 路由: /orders/:id
 * // URL: /orders/123
 * const { id } = useParams<{ id: string }>();
 * console.log(id); // '123'
 */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return currentAdapter.getParams() as T;
}

/**
 * 获取查询参数 Hook
 * 
 * @example
 * // URL: /orders/123?mode=edit&tab=items
 * const { mode, tab } = useQuery<{ mode?: string; tab?: string }>();
 * console.log(mode); // 'edit'
 */
export function useQuery<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return currentAdapter.getQuery() as T;
}

/**
 * 获取当前位置信息 Hook
 * 
 * @example
 * const location = useLocation();
 * console.log(location.pathname); // '/orders/123'
 * console.log(location.query);    // { mode: 'edit' }
 */
export function useLocation(): LocationInfo {
  return currentAdapter.getLocation();
}

// ==================== 路由配置覆盖 ====================

/**
 * 路由守卫函数类型
 */
export type RouteGuard = (to: LocationInfo, from: LocationInfo | null) => boolean | string | Promise<boolean | string>;

/**
 * 路由配置覆盖
 */
export interface RouteOverride {
  /** 路由守卫 */
  guards?: RouteGuard[];
  /** 页面过渡动画 */
  transition?: string;
  /** 额外元数据 */
  meta?: Record<string, unknown>;
}

/**
 * 路由覆盖配置存储
 */
const routeOverrides = new Map<string, RouteOverride>();

/**
 * 定义路由覆盖配置
 * 
 * @example
 * defineRouteOverrides({
 *   '/orders/:id': {
 *     guards: [authGuard],
 *     transition: 'slide-left',
 *   },
 *   '/admin/*': {
 *     guards: [authGuard, adminGuard],
 *   },
 * });
 */
export function defineRouteOverrides(overrides: Record<string, RouteOverride>): void {
  Object.entries(overrides).forEach(([path, config]) => {
    routeOverrides.set(path, config);
  });
}

/**
 * 获取路由覆盖配置
 */
export function getRouteOverride(path: string): RouteOverride | undefined {
  // 精确匹配
  if (routeOverrides.has(path)) {
    return routeOverrides.get(path);
  }
  
  // 模式匹配
  for (const [pattern, config] of routeOverrides.entries()) {
    const match = matchRoutePattern(pattern, path);
    if (match.matched) {
      return config;
    }
  }
  
  return undefined;
}

/**
 * 清除所有路由覆盖配置
 */
export function clearRouteOverrides(): void {
  routeOverrides.clear();
}

// ==================== 辅助函数 ====================

/**
 * 构建带查询参数的 URL
 * 
 * @example
 * buildUrl('/orders/:id', { id: '123' }, { mode: 'edit' });
 * // => '/orders/123?mode=edit'
 */
export function buildUrl(
  pattern: string, 
  params?: Record<string, string>, 
  query?: Record<string, string | undefined>
): string {
  // 替换路径参数
  let url = pattern;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  // 添加查询参数
  if (query) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}

/**
 * 解析 URL 获取参数
 * 
 * @example
 * parseUrl('/orders/:id', '/orders/123?mode=edit');
 * // => { params: { id: '123' }, query: { mode: 'edit' } }
 */
export function parseUrl(pattern: string, url: string): {
  params: Record<string, string>;
  query: Record<string, string>;
} {
  const [path, search = ''] = url.split('?');
  const match = matchRoutePattern(pattern, path);
  
  const query: Record<string, string> = {};
  if (search) {
    const searchParams = new URLSearchParams(search);
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
  }
  
  return {
    params: match.params,
    query,
  };
}

// ==================== 路由配置辅助函数 ====================

/**
 * 扁平化路由配置（处理嵌套路由）
 */
export function flattenRoutes(configs: RouteConfig[]): RouteConfig[] {
  const result: RouteConfig[] = [];
  
  for (const route of configs) {
    result.push(route);
    if (route.children) {
      result.push(...flattenRoutes(route.children));
    }
  }
  
  return result;
}

/**
 * 获取菜单路由（用于生成菜单）
 */
export function getMenuRoutes(configs: RouteConfig[]): RouteConfig[] {
  return configs
    .filter(r => r.menu && !r.menu.hidden && r.title)
    .sort((a, b) => (a.menu?.order || 0) - (b.menu?.order || 0));
}

/**
 * 根据权限过滤路由
 */
export function filterRoutesByPermission(
  configs: RouteConfig[],
  permissions: string[]
): RouteConfig[] {
  return configs.filter(r => !r.permission || permissions.includes(r.permission));
}

// ==================== 路由实例创建（类似 createBrowserRouter） ====================

/** 页面缓存 */
const pageCache = new Map<string, PageDefinition>();

/**
 * 创建路由实例
 * 
 * 🎯 类似 React Router 的 createBrowserRouter
 * 
 * @example
 * const router = createRouter([
 *   { path: '/', redirectTo: '/orders' },
 *   { path: '/orders', element: () => import('./pages/OrderList.page') },
 *   { path: '/orders/:id', element: () => import('./pages/OrderDetail.page') },
 * ]);
 */
export function createRouter(routes: RouteConfig[]): Router {
  const flatRoutes = flattenRoutes(routes);
  const listeners = new Set<(location: LocationInfo, route: RouteConfig | null) => void>();
  
  let currentRoute: RouteConfig | null = null;
  let currentParams: Record<string, string> = {};
  
  /**
   * 匹配路由
   */
  const matchRoute = (pathname: string): { route: RouteConfig; params: Record<string, string> } | null => {
    for (const route of flatRoutes) {
      const match = matchRoutePattern(route.path, pathname);
      if (match.matched) {
        return { route, params: match.params };
      }
    }
    return null;
  };
  
  /**
   * 处理路由变化
   */
  const handleRouteChange = (location: LocationInfo): void => {
    const result = matchRoute(location.pathname);
    
    if (result) {
      const { route, params } = result;
      
      // 处理重定向
      if (route.redirectTo) {
        currentAdapter.navigate(route.redirectTo, { replace: true });
        return;
      }
      
      currentRoute = route;
      currentParams = params;
      
      // 更新文档标题
      if (route.title && typeof document !== 'undefined') {
        document.title = route.title;
      }
      
      // 更新路由适配器的当前模式
      if (currentAdapter instanceof HashRouterAdapter) {
        currentAdapter.setCurrentPattern(route.path);
      }
    } else {
      currentRoute = null;
      currentParams = {};
    }
    
    // 通知监听器
    listeners.forEach(listener => listener(location, currentRoute));
  };
  
  /**
   * 加载页面组件
   */
  const loadPage = async (route: RouteConfig): Promise<PageDefinition | null> => {
    if (!route.element) return null;
    
    // 检查缓存
    if (pageCache.has(route.path)) {
      return pageCache.get(route.path)!;
    }
    
    try {
      const module = await route.element();
      const page = module.default;
      pageCache.set(route.path, page);
      return page;
    } catch (error) {
      console.error(`[Router] Failed to load page for ${route.path}:`, error);
      return null;
    }
  };
  
  // 初始化：监听路由变化
  currentAdapter.listen(handleRouteChange);
  
  // 处理初始路由
  handleRouteChange(currentAdapter.getLocation());
  
  return {
    routes,
    get currentRoute() { return currentRoute; },
    get params() { return { ...currentParams }; },
    navigate: (to, options) => currentAdapter.navigate(to, options),
    getLocation: () => currentAdapter.getLocation(),
    matchRoute,
    subscribe: (listener) => {
      listeners.add(listener);
      // 立即调用一次
      listener(currentAdapter.getLocation(), currentRoute);
      return () => listeners.delete(listener);
    },
    loadPage,
  };
}

// ==================== 全局路由实例 ====================

/** 全局路由实例 */
let globalRouter: Router | null = null;

/**
 * 设置全局路由实例
 */
export function setRouter(router: Router): void {
  globalRouter = router;
}

/**
 * 获取全局路由实例
 */
export function getRouter(): Router | null {
  return globalRouter;
}

/**
 * 清除页面缓存
 */
export function clearPageCache(): void {
  pageCache.clear();
}
