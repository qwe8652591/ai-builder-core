/**
 * DSL Runtime
 * 
 * 🎯 负责加载、解析和运行 DSL 项目
 * 
 * 职责：
 * - 开发服务器（Vite）
 * - 数据库初始化（SQLite、MikroORM）
 * - Schema 生成
 * 
 * 使用方式：
 * ```bash
 * # 在 DSL 项目目录下运行
 * npx @ai-builder/dsl-runtime dev
 * ```
 */

// ==================== 开发服务器 ====================
export { loadDSLProject, type DSLProjectConfig } from './loader.js';
export { createDevServer } from './server.js';
export { generateApp } from './app-generator.js';

// ==================== 数据库 ====================
export { 
  initDatabase,
  getDatabaseAdapter,
  getSQLiteAdapter,
  isDatabaseInitialized,
  saveDatabase,
  downloadDatabase,
  reloadMockData,
  clearDatabase,
  closeDatabase,
  resetDatabaseState,
  type DataSourceType,
  type DatabaseConfig,
} from './database.js';

export {
  SQLiteBrowserAdapter,
  createSQLiteBrowserAdapter,
  type SQLiteBrowserConfig,
  type EntityTableConfig,
} from './sqlite-browser-adapter.js';

export {
  MikroORMAdapter,
  createMikroORMAdapter,
  initMikroORM,
  type MikroORMConfig,
} from './mikro-orm-adapter.js';

export {
  getAllEntityTableConfigs,
  generateTableSchema,
  generateAllTableSchemas,
  generateInitSQL,
  getEntityTableConfig,
  getAllEntityClasses,
  type TableSchema,
  type TableColumn,
} from './schema-generator.js';

// ==================== 重新导出核心运行时（从 jsx-runtime） ====================
// 这些也可以直接从 @ai-builder/jsx-runtime 导入

export {
  // 路由
  createDSLRouter,
  useNavigate,
  useParams,
  useLocation,
  getMenuRoutes,
  filterRoutesByPermission,
  createRouter,
  setRouter,
  getRouter,
  type RouteConfig,
  type Router,
  // 状态
  useState,
  useComputed,
  useWatch,
  useEffect,
  // 生命周期
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  // 页面上下文
  PageContext,
  getCurrentContext,
  setCurrentContext,
  runInContext,
  // DSL 引擎
  definePage,
  defineComponent,
  defineApp,
  getMergedAppConfig,
  // 元数据
  registerComponents,
  vnodeToReactElement,
  getMetadataByType,
  getLayeredStats,
} from '@ai-builder/jsx-runtime';
