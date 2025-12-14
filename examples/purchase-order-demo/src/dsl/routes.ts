/**
 * 路由配置
 * 
 * 🎯 参考 React Router v6 风格，使用 jsx-runtime 提供的路由系统
 * 
 * 优势：
 * 1. 路径集中管理，修改只需改一处
 * 2. 页面和路由绑定，类型安全
 * 3. 支持懒加载、嵌套路由、权限控制
 * 4. 与 DSL 页面系统深度集成
 */

import type { RouteConfig } from '@ai-builder/jsx-runtime';

// 🎯 从 jsx-runtime 导出路由 API（让使用方可以直接从 routes.ts 导入）
export { 
  useNavigate, 
  useParams, 
  useQuery, 
  useLocation,
  createRouter,
  RouterProvider,
  createDSLRouter,
  type RouteConfig,
} from '@ai-builder/jsx-runtime';

// ==================== 路由路径常量（类型安全导航） ====================

/**
 * 路由路径定义
 * 
 * @example
 * Routes.OrderList                              // '/orders'
 * Routes.OrderCreate                            // '/orders/create'
 * Routes.OrderDetail.pattern                    // '/orders/:id'（用于路由配置）
 * Routes.OrderDetail('123')                     // '/orders/123'
 * Routes.OrderDetail('123', { mode: 'edit' })   // '/orders/123?mode=edit'
 */
export const Routes = {
  // 首页
  Home: '/',
  
  // 采购订单模块
  OrderList: '/orders',
  OrderCreate: '/orders/create',
  
  // 带动态参数的路由
  OrderDetail: Object.assign(
    (id: string, query?: { mode?: 'view' | 'edit' }) => {
      const base = `/orders/${id}`;
      if (query?.mode) {
        return `${base}?mode=${query.mode}`;
      }
      return base;
    },
    { pattern: '/orders/:id' }  // 路由模式，用于配置
  ),
  
  // 后续可扩展其他模块
  // ProductList: '/products',
  // ProductDetail: Object.assign(
  //   (id: string) => `/products/${id}`,
  //   { pattern: '/products/:id' }
  // ),
} as const;

// ==================== 路由配置表（参考 React Router v6） ====================

/**
 * 路由配置
 * 
 * 🎯 类似 React Router 的 createBrowserRouter 配置
 * ✅ 页面懒加载
 * ✅ 支持嵌套路由
 * ✅ 支持权限控制
 * ✅ 支持菜单生成
 */
export const routes: RouteConfig[] = [
  // 首页重定向
  {
    path: Routes.Home,
    redirectTo: Routes.OrderList,
  },
  
  // 采购订单模块
  {
    path: Routes.OrderList,
    element: () => import('./pages/OrderList.page'),
    title: '采购订单列表',
    permission: 'purchase:order:list',
    menu: {
      icon: 'OrderedListOutlined',
      order: 10,
      parent: 'PurchaseManagement',
    },
  },
  {
    path: Routes.OrderCreate,
    element: () => import('./pages/OrderDetail.page'),
    title: '新建采购订单',
    permission: 'purchase:order:create',
    menu: { hidden: true },
  },
  {
    path: Routes.OrderDetail.pattern,
    element: () => import('./pages/OrderDetail.page'),
    title: '订单详情',
    permission: 'purchase:order:view',
    menu: { hidden: true },
  },
  
  // 示例：嵌套路由（后续可扩展）
  // {
  //   path: '/settings',
  //   title: '系统设置',
  //   menu: { icon: 'SettingOutlined', order: 100 },
  //   children: [
  //     { path: '/settings/profile', element: () => import('./pages/Profile.page'), title: '个人信息' },
  //     { path: '/settings/password', element: () => import('./pages/Password.page'), title: '修改密码' },
  //   ],
  // },
];

// ==================== 辅助函数 ====================

// 🎯 辅助函数已移至 @ai-builder/jsx-runtime
// 可直接使用：
// - flattenRoutes(routes) - 扁平化嵌套路由
// - getMenuRoutes(routes) - 获取菜单路由
// - filterRoutesByPermission(routes, permissions) - 按权限过滤
// 
// 路由匹配在 createRouter 内部自动处理

