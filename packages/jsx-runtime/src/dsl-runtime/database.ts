/**
 * 数据库初始化模块
 * 
 * 🎯 通用的数据库初始化能力，支持多种数据源
 * 
 * 特点：
 * - 自动从 Metadata Store 获取所有 Entity
 * - 自动生成表结构
 * - 支持 mock 数据加载
 * - 支持 SQLite 持久化
 * 
 * @example
 * ```typescript
 * import { initDatabase } from '@ai-builder/jsx-runtime';
 * import initSqlJs from 'sql.js';
 * 
 * // 初始化 SQLite 数据库
 * await initDatabase({
 *   type: 'sqlite',
 *   sqlJsModule: initSqlJs,
 *   persistKey: 'my-app-db',
 *   mockDataSQL: '...', // SQL 字符串
 *   debug: true,
 * });
 * ```
 */

import {
  setORMAdapter,
  InMemoryORMAdapter,
} from './orm-dsl';
import {
  createSQLiteBrowserAdapter,
  type SQLiteBrowserAdapter,
} from './sqlite-browser-adapter';
import { getAllEntityTableConfigs } from './schema-generator';

// ==================== 类型定义 ====================

export type DataSourceType = 'memory' | 'sqlite';

export interface DatabaseConfig {
  /** 数据源类型 */
  type: DataSourceType;
  
  /** sql.js 模块（sqlite 模式必需，从项目中导入 sql.js 并传入） */
  sqlJsModule?: unknown;
  
  /** 持久化 key（sqlite 模式，存储到 IndexedDB） */
  persistKey?: string;
  
  /** Mock 数据 SQL 字符串（可选，用于初始化数据） */
  mockDataSQL?: string;
  
  /** 是否加载 mock 数据（仅当数据库为空时加载） */
  loadMockData?: boolean;
  
  /** 检查表名（用于判断数据库是否为空） */
  checkTable?: string;
  
  /** 是否开启调试日志 */
  debug?: boolean;
  
  /** sql.js WASM 文件路径 */
  wasmPath?: string;
  
  /** 自动保存（sqlite 模式） */
  autoSave?: boolean;
}

// ==================== 状态管理 ====================

let currentAdapter: InMemoryORMAdapter | SQLiteBrowserAdapter | null = null;
let isInitialized = false;

// ==================== 核心函数 ====================

/**
 * 初始化数据库
 * 
 * 🎯 通用的数据库初始化入口
 * 
 * @example
 * ```typescript
 * // SQLite 模式（推荐，数据持久化）
 * await initDatabase({
 *   type: 'sqlite',
 *   sqlJsModule: initSqlJs,
 *   persistKey: 'my-app-db',
 *   mockDataSQL: dataSqlContent,
 *   loadMockData: true,
 *   checkTable: 'purchase_orders',
 *   debug: true,
 * });
 * 
 * // 内存模式（刷新后数据丢失）
 * await initDatabase({
 *   type: 'memory',
 * });
 * ```
 */
export async function initDatabase(config: DatabaseConfig): Promise<void> {
  if (isInitialized) {
    console.log('[Database] Already initialized');
    return;
  }
  
  const { type = 'memory' } = config;
  
  switch (type) {
    case 'memory':
      await initMemoryDatabase(config);
      break;
      
    case 'sqlite':
      await initSQLiteDatabase(config);
      break;
      
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
  
  isInitialized = true;
}

/**
 * 初始化内存数据库
 */
async function initMemoryDatabase(config: DatabaseConfig): Promise<void> {
  const adapter = new InMemoryORMAdapter();
  setORMAdapter(adapter);
  currentAdapter = adapter;
  
  if (config.debug) {
    console.log('[Database] Initialized with InMemory adapter');
  }
}

/**
 * 初始化 SQLite 浏览器数据库
 */
async function initSQLiteDatabase(config: DatabaseConfig): Promise<void> {
  const {
    sqlJsModule,
    persistKey = 'app-database',
    autoSave = true,
    debug = false,
    wasmPath,
    mockDataSQL,
    loadMockData = false,
    checkTable,
  } = config;
  
  if (!sqlJsModule) {
    throw new Error(
      'sqlJsModule is required for SQLite mode.\n' +
      'Please import sql.js in your project and pass it:\n\n' +
      "import initSqlJs from 'sql.js';\n" +
      "await initDatabase({ type: 'sqlite', sqlJsModule: initSqlJs, ... });"
    );
  }
  
  // 创建适配器
  const adapter = await createSQLiteBrowserAdapter({
    persistKey,
    autoSave,
    debug,
    wasmPath,
    sqlJsModule,
  });
  
  // 🎯 自动从 Metadata Store 获取所有 Entity 并生成表结构
  const entityConfigs = getAllEntityTableConfigs();
  
  for (const { entityClass, config: entityConfig } of entityConfigs) {
    adapter.registerEntity(entityClass, entityConfig);
    if (debug) {
      console.log(`[Database] Registered entity: ${entityClass.name} -> ${entityConfig.tableName}`);
    }
  }
  
  if (debug) {
    console.log(`[Database] Total ${entityConfigs.length} entities registered`);
  }
  
  setORMAdapter(adapter);
  currentAdapter = adapter;
  
  // 加载 mock 数据（如果需要且数据库为空）
  if (loadMockData && mockDataSQL && checkTable) {
    await loadMockDataIfEmpty(adapter, mockDataSQL, checkTable, debug);
  }
  
  if (debug) {
    console.log('[Database] Initialized with SQLite Browser adapter');
    console.log('[Database] Data will be persisted to IndexedDB');
  }
}

/**
 * 加载 Mock 数据（如果数据库为空）
 */
async function loadMockDataIfEmpty(
  adapter: SQLiteBrowserAdapter,
  mockDataSQL: string,
  checkTable: string,
  debug: boolean
): Promise<void> {
  try {
    // 检查是否有数据
    const result = adapter.exec(`SELECT COUNT(*) as count FROM ${checkTable}`);
    const count = result[0]?.values[0]?.[0] as number || 0;
    
    if (count === 0) {
      if (debug) {
        console.log('[Database] Loading mock data...');
      }
      
      // 执行 mock 数据 SQL
      adapter.exec(mockDataSQL);
      
      // 持久化
      await adapter.save();
      
      if (debug) {
        console.log('[Database] Mock data loaded successfully');
      }
    } else {
      if (debug) {
        console.log(`[Database] Database already has ${count} records, skipping mock data`);
      }
    }
  } catch (error) {
    console.warn('[Database] Failed to load mock data:', error);
  }
}

// ==================== 工具函数 ====================

/**
 * 获取当前适配器
 */
export function getDatabaseAdapter(): InMemoryORMAdapter | SQLiteBrowserAdapter | null {
  return currentAdapter;
}

/**
 * 获取 SQLite 适配器（用于高级操作）
 */
export function getSQLiteAdapter(): SQLiteBrowserAdapter | null {
  if (currentAdapter && 'exec' in currentAdapter) {
    return currentAdapter as SQLiteBrowserAdapter;
  }
  return null;
}

/**
 * 检查数据库是否已初始化
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}

/**
 * 手动保存数据库（SQLite）
 */
export async function saveDatabase(): Promise<void> {
  const sqlite = getSQLiteAdapter();
  if (sqlite) {
    await sqlite.save();
    console.log('[Database] Saved');
  }
}

/**
 * 下载数据库文件（SQLite）
 */
export function downloadDatabase(filename = 'database.sqlite'): void {
  const sqlite = getSQLiteAdapter();
  if (sqlite) {
    sqlite.download(filename);
  } else {
    console.warn('[Database] Download only available for SQLite adapter');
  }
}

/**
 * 重新加载 Mock 数据
 */
export async function reloadMockData(mockDataSQL: string, tables?: string[]): Promise<void> {
  const sqlite = getSQLiteAdapter();
  if (sqlite) {
    // 清空指定表
    if (tables) {
      for (const table of tables) {
        sqlite.exec(`DELETE FROM ${table}`);
      }
    }
    
    // 重新加载
    sqlite.exec(mockDataSQL);
    await sqlite.save();
    console.log('[Database] Mock data reloaded');
  } else {
    console.warn('[Database] Reload only available for SQLite adapter');
  }
}

/**
 * 清空所有数据
 */
export async function clearDatabase(): Promise<void> {
  if (currentAdapter) {
    if ('clearAll' in currentAdapter) {
      await (currentAdapter as SQLiteBrowserAdapter).clearAll();
    } else {
      (currentAdapter as InMemoryORMAdapter).clearAll();
    }
    console.log('[Database] All data cleared');
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (currentAdapter && 'destroy' in currentAdapter) {
    await (currentAdapter as SQLiteBrowserAdapter).destroy();
  }
  currentAdapter = null;
  isInitialized = false;
  console.log('[Database] Connection closed');
}

/**
 * 重置数据库状态（用于测试）
 */
export function resetDatabaseState(): void {
  currentAdapter = null;
  isInitialized = false;
}

