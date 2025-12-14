/**
 * 浏览器 SQLite 适配器
 * 
 * 🎯 使用 sql.js（SQLite WebAssembly）在浏览器中运行 SQLite
 * 
 * 特性：
 * - 真正的 SQL 数据库，支持复杂查询
 * - 可持久化到 IndexedDB 或 localStorage
 * - 完全在浏览器端运行，无需服务器
 * 
 * 依赖：sql.js
 * 安装：pnpm add sql.js
 * 
 * @example
 * ```typescript
 * import { SQLiteBrowserAdapter, setORMAdapter } from '@ai-builder/jsx-runtime';
 * 
 * // 初始化适配器
 * const adapter = new SQLiteBrowserAdapter();
 * await adapter.initialize({
 *   persistKey: 'my-app-db', // 持久化到 IndexedDB 的 key
 * });
 * 
 * // 注册实体表结构
 * adapter.registerEntity(PurchaseOrderEntity, {
 *   tableName: 'purchase_orders',
 *   columns: {
 *     id: 'TEXT PRIMARY KEY',
 *     orderNo: 'TEXT NOT NULL',
 *     title: 'TEXT',
 *     supplier: 'TEXT', // JSON 字符串
 *     items: 'TEXT',    // JSON 字符串
 *     totalAmount: 'REAL',
 *     status: 'TEXT',
 *     createdBy: 'TEXT',
 *     createdAt: 'TEXT',
 *     updatedAt: 'TEXT',
 *     remark: 'TEXT',
 *   },
 * });
 * 
 * // 设置为活跃适配器
 * setORMAdapter(adapter);
 * 
 * // 现在可以使用 ORM DSL
 * const orders = await query(PurchaseOrderEntity).where({...}).execute();
 * ```
 */

import type {
  IORMAdapter,
  QuerySpec,
  QueryResult,
  SingleResult,
  WhereCondition,
  WhereGroup,
  EntityClass,
} from '@ai-builder/jsx-runtime';

// ==================== 类型定义 ====================

/**
 * sql.js 数据库类型（避免硬依赖）
 */
interface ISqlJsDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
  prepare(sql: string): ISqlJsStatement;
  export(): Uint8Array;
  close(): void;
}

interface ISqlJsStatement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
  run(params?: unknown[]): void;
  reset(): void;
}

interface ISqlJs {
  Database: new (data?: ArrayLike<number>) => ISqlJsDatabase;
}

/**
 * 实体表配置
 */
export interface EntityTableConfig {
  /** 表名 */
  tableName: string;
  /** 列定义 */
  columns: Record<string, string>;
  /** JSON 类型的列（会自动序列化/反序列化） */
  jsonColumns?: string[];
  /** 日期类型的列（会自动转换） */
  dateColumns?: string[];
}

/**
 * SQLite 适配器配置
 */
export interface SQLiteBrowserConfig {
  /** 持久化 key（存储到 IndexedDB） */
  persistKey?: string;
  /** 是否自动保存（每次操作后自动持久化） */
  autoSave?: boolean;
  /** sql.js WASM 文件路径 */
  wasmPath?: string;
  /** 是否开启调试日志 */
  debug?: boolean;
  /** 
   * 外部传入的 sql.js 模块（可选）
   * 如果提供，则直接使用；否则尝试动态加载
   */
  sqlJsModule?: unknown;
}

// ==================== SQLite 浏览器适配器 ====================

/**
 * 浏览器 SQLite 适配器
 * 
 * 使用 sql.js 在浏览器中运行 SQLite
 */
export class SQLiteBrowserAdapter implements IORMAdapter {
  readonly name = 'sqlite-browser';
  
  private db: ISqlJsDatabase | null = null;
  private SQL: ISqlJs | null = null;
  private config: SQLiteBrowserConfig = {};
  private entityConfigs = new Map<string, EntityTableConfig>();
  private initialized = false;
  
  /**
   * 初始化 SQLite
   */
  async initialize(config: SQLiteBrowserConfig = {}): Promise<void> {
    this.config = config;
    
    // 加载 sql.js
    try {
      let initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<ISqlJs>;
      
      // 优先使用外部传入的模块
      if (config.sqlJsModule) {
        initSqlJs = (config.sqlJsModule as { default?: unknown }).default as typeof initSqlJs
          || config.sqlJsModule as typeof initSqlJs;
      } else {
        initSqlJs = await this.loadSqlJs();
      }
      
      this.SQL = await initSqlJs({
        locateFile: (file: string) => config.wasmPath || `https://sql.js.org/dist/${file}`,
      });
    } catch (error) {
      throw new Error(
        'Failed to load sql.js. Please install it:\n' +
        '  pnpm add sql.js\n\n' +
        'Original error: ' + (error as Error).message
      );
    }
    
    // 尝试从 IndexedDB 加载已有数据
    if (config.persistKey) {
      const savedData = await this.loadFromIndexedDB(config.persistKey);
      if (savedData) {
        this.db = new this.SQL.Database(savedData);
        console.log('[SQLite] Loaded existing database from IndexedDB');
      } else {
        this.db = new this.SQL.Database();
        console.log('[SQLite] Created new database');
      }
    } else {
      this.db = new this.SQL.Database();
      console.log('[SQLite] Created in-memory database');
    }
    
    this.initialized = true;
  }
  
  /**
   * 动态加载 sql.js
   * 
   * 🎯 只使用全局变量方式，避免打包器解析 sql.js
   * sql.js 应通过 CDN 或 initDatabase(SQL) 参数传入
   */
  private async loadSqlJs(): Promise<(config: { locateFile: (file: string) => string }) => Promise<ISqlJs>> {
    // 检查全局变量（CDN 加载方式）
    if (typeof window !== 'undefined' && (window as unknown as { initSqlJs?: unknown }).initSqlJs) {
      return (window as unknown as { initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<ISqlJs> }).initSqlJs;
    }
    
    // 不再使用动态 import，避免打包器解析问题
    throw new Error(
      'sql.js not found in window.initSqlJs.\n\n' +
      'Please load it from CDN first:\n' +
      '<script src="https://sql.js.org/dist/sql-wasm.js"></script>\n\n' +
      'Or pass the SQL instance to initDatabase(SQL, initSql)'
    );
  }
  
  /**
   * 注册实体表结构
   */
  registerEntity<T>(entityClass: EntityClass<T>, config: EntityTableConfig): void {
    const entityName = entityClass.name;
    this.entityConfigs.set(entityName, config);
    
    // 创建表
    if (this.db) {
      this.createTable(config);
    }
    
    console.log(`[SQLite] Registered entity: ${entityName} -> ${config.tableName}`);
  }
  
  /**
   * 创建表
   */
  private createTable(config: EntityTableConfig): void {
    const columns = Object.entries(config.columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');
    
    const sql = `CREATE TABLE IF NOT EXISTS ${config.tableName} (${columns})`;
    this.db!.run(sql);
    
    if (this.config.debug) {
      this.logSQL('CREATE TABLE', sql);
    }
  }
  
  /**
   * 获取实体配置
   */
  private getEntityConfig(entityName: string): EntityTableConfig {
    const config = this.entityConfigs.get(entityName);
    if (!config) {
      // 自动生成默认配置
      return {
        tableName: entityName.toLowerCase() + 's',
        columns: { id: 'TEXT PRIMARY KEY' },
        jsonColumns: [],
        dateColumns: ['createdAt', 'updatedAt'],
      };
    }
    return config;
  }
  
  /**
   * 确保表存在
   */
  private ensureTable(entityName: string, data: Record<string, unknown>): EntityTableConfig {
    let config = this.entityConfigs.get(entityName);
    
    if (!config) {
      // 根据数据自动推断表结构
      const columns: Record<string, string> = { id: 'TEXT PRIMARY KEY' };
      const jsonColumns: string[] = [];
      const dateColumns: string[] = [];
      
      for (const [key, value] of Object.entries(data)) {
        if (key === 'id') continue;
        
        if (value instanceof Date) {
          columns[key] = 'TEXT';
          dateColumns.push(key);
        } else if (typeof value === 'object' && value !== null) {
          columns[key] = 'TEXT';
          jsonColumns.push(key);
        } else if (typeof value === 'number') {
          columns[key] = 'REAL';
        } else if (typeof value === 'boolean') {
          columns[key] = 'INTEGER';
        } else {
          columns[key] = 'TEXT';
        }
      }
      
      config = {
        tableName: entityName.toLowerCase() + 's',
        columns,
        jsonColumns,
        dateColumns,
      };
      
      this.entityConfigs.set(entityName, config);
      this.createTable(config);
    }
    
    return config;
  }
  
  /**
   * 序列化数据（用于存储）
   */
  private serializeData(data: Record<string, unknown>, config: EntityTableConfig): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (config.jsonColumns?.includes(key)) {
        result[key] = JSON.stringify(value);
      } else if (config.dateColumns?.includes(key) && value instanceof Date) {
        result[key] = value.toISOString();
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        result[key] = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        result[key] = value ? 1 : 0;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * 反序列化数据（从存储读取）
   */
  private deserializeData(data: Record<string, unknown>, config: EntityTableConfig): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        result[key] = null;
        continue;
      }
      
      if (config.jsonColumns?.includes(key)) {
        try {
          result[key] = JSON.parse(value as string);
        } catch {
          result[key] = value;
        }
      } else if (config.dateColumns?.includes(key)) {
        result[key] = new Date(value as string);
      } else if (typeof value === 'string' && value.startsWith('{') || typeof value === 'string' && value.startsWith('[')) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * 构建 WHERE 子句
   */
  private buildWhereClause<T>(
    conditions: Array<WhereCondition<T> | WhereGroup<T>>,
    config: EntityTableConfig
  ): { sql: string; params: unknown[] } {
    if (conditions.length === 0) {
      return { sql: '', params: [] };
    }
    
    const clauses: string[] = [];
    const params: unknown[] = [];
    
    for (const cond of conditions) {
      if ('type' in cond) {
        // WhereGroup
        const groupResult = this.buildWhereClause(cond.conditions, config);
        if (groupResult.sql) {
          clauses.push(`(${groupResult.sql.replace(/^WHERE /, '')})`);
          params.push(...groupResult.params);
        }
      } else {
        // WhereCondition
        const { clause, value } = this.buildCondition(cond, config);
        clauses.push(clause);
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.push(...value);
          } else {
            params.push(value);
          }
        }
      }
    }
    
    return {
      sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }
  
  /**
   * 构建单个条件
   */
  private buildCondition<T>(
    cond: WhereCondition<T>,
    config: EntityTableConfig
  ): { clause: string; value?: unknown } {
    const field = cond.field as string;
    let value = cond.value;
    
    // 处理嵌套字段（如 supplier.code）- 使用 JSON 提取
    const isNestedField = field.includes('.');
    let fieldExpr: string;
    
    if (isNestedField) {
      const [jsonCol, ...path] = field.split('.');
      fieldExpr = `json_extract(${jsonCol}, '$.${path.join('.')}')`;
    } else {
      fieldExpr = field;
    }
    
    // 序列化值
    if (config.jsonColumns?.includes(field) && typeof value === 'object') {
      value = JSON.stringify(value);
    }
    
    switch (cond.operator) {
      case 'eq':
        return { clause: `${fieldExpr} = ?`, value };
      case 'neq':
        return { clause: `${fieldExpr} != ?`, value };
      case 'gt':
        return { clause: `${fieldExpr} > ?`, value };
      case 'gte':
        return { clause: `${fieldExpr} >= ?`, value };
      case 'lt':
        return { clause: `${fieldExpr} < ?`, value };
      case 'lte':
        return { clause: `${fieldExpr} <= ?`, value };
      case 'in':
        const inPlaceholders = (value as unknown[]).map(() => '?').join(', ');
        return { clause: `${fieldExpr} IN (${inPlaceholders})`, value: value as unknown[] };
      case 'nin':
        const ninPlaceholders = (value as unknown[]).map(() => '?').join(', ');
        return { clause: `${fieldExpr} NOT IN (${ninPlaceholders})`, value: value as unknown[] };
      case 'like':
        return { clause: `${fieldExpr} LIKE ?`, value: `%${value}%` };
      case 'ilike':
        return { clause: `LOWER(${fieldExpr}) LIKE LOWER(?)`, value: `%${value}%` };
      case 'between':
        const [min, max] = value as [unknown, unknown];
        return { clause: `${fieldExpr} BETWEEN ? AND ?`, value: [min, max] };
      case 'isNull':
        return { clause: `${fieldExpr} IS NULL` };
      case 'isNotNull':
        return { clause: `${fieldExpr} IS NOT NULL` };
      default:
        return { clause: `${fieldExpr} = ?`, value };
    }
  }
  
  /**
   * 构建 ORDER BY 子句
   */
  private buildOrderByClause<T>(
    orderBy: Array<{ field: string | keyof T; direction: 'asc' | 'desc' }>
  ): string {
    if (orderBy.length === 0) return '';
    
    const clauses = orderBy.map(o => `${o.field as string} ${o.direction.toUpperCase()}`);
    return `ORDER BY ${clauses.join(', ')}`;
  }
  
  /**
   * 持久化到 IndexedDB
   */
  private async saveToIndexedDB(): Promise<void> {
    if (!this.config.persistKey || !this.db) return;
    
    const data = this.db.export();
    const key = this.config.persistKey;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SqlJsDatabase', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('databases', 'readwrite');
        const store = tx.objectStore('databases');
        store.put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * 从 IndexedDB 加载
   */
  private async loadFromIndexedDB(key: string): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('SqlJsDatabase', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('databases', 'readonly');
        const store = tx.objectStore('databases');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }
  
  /**
   * 自动保存（如果配置了）
   */
  private async autoSave(): Promise<void> {
    if (this.config.autoSave && this.config.persistKey) {
      await this.saveToIndexedDB();
    }
  }
  
  // ==================== IORMAdapter 实现 ====================
  
  async executeQuery<T>(spec: QuerySpec<T>): Promise<QueryResult<T>> {
    if (!this.db) throw new Error('Database not initialized');
    
    const config = this.getEntityConfig(spec.entityName);
    const { sql: whereClause, params } = this.buildWhereClause(spec.where, config);
    const orderByClause = this.buildOrderByClause(spec.orderBy);
    
    // 构建 SQL
    let sql = `SELECT * FROM ${config.tableName} ${whereClause} ${orderByClause}`;
    
    // 分页
    if (spec.pagination) {
      sql += ` LIMIT ${spec.pagination.limit} OFFSET ${spec.pagination.offset}`;
    } else if (spec.limit) {
      sql += ` LIMIT ${spec.limit}`;
      if (spec.skip) sql += ` OFFSET ${spec.skip}`;
    }
    
    if (this.config.debug) {
      this.logSQL('SELECT', sql, params);
    }
    
    // 执行查询
    const stmt = this.db.prepare(sql);
    stmt.bind(params as unknown[]);
    
    const data: T[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      data.push(this.deserializeData(row, config) as T);
    }
    stmt.free();
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as count FROM ${config.tableName} ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    countStmt.bind(params as unknown[]);
    countStmt.step();
    const total = countStmt.getAsObject().count as number;
    countStmt.free();
    
    const result: QueryResult<T> = { data, total };
    
    if (spec.pagination) {
      result.pagination = {
        pageNo: spec.pagination.pageNo,
        pageSize: spec.pagination.pageSize,
        totalPages: Math.ceil(total / spec.pagination.pageSize),
      };
    }
    
    return result;
  }
  
  async executeQueryFirst<T>(spec: QuerySpec<T>): Promise<SingleResult<T>> {
    spec.limit = 1;
    const result = await this.executeQuery(spec);
    return result.data[0] || null;
  }
  
  async executeCount<T>(spec: QuerySpec<T>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const config = this.getEntityConfig(spec.entityName);
    const { sql: whereClause, params } = this.buildWhereClause(spec.where, config);
    
    const sql = `SELECT COUNT(*) as count FROM ${config.tableName} ${whereClause}`;
    
    if (this.config.debug) {
      this.logSQL('COUNT', sql, params);
    }
    
    const stmt = this.db.prepare(sql);
    stmt.bind(params as unknown[]);
    stmt.step();
    const count = stmt.getAsObject().count as number;
    stmt.free();
    
    return count;
  }
  
  async executeCreate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    data: Partial<T>;
  }): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    
    const config = this.ensureTable(spec.entityName, spec.data as Record<string, unknown>);
    
    // 生成 ID（如果没有）
    const data = { ...spec.data } as Record<string, unknown>;
    if (!data.id) {
      data.id = `${spec.entityName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!data.createdAt) {
      data.createdAt = new Date();
    }
    
    const serialized = this.serializeData(data, config);
    const columns = Object.keys(serialized);
    const values = Object.values(serialized);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${config.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    if (this.config.debug) {
      this.logSQL('INSERT', sql, values);
    }
    
    this.db.run(sql, values);
    await this.autoSave();
    
    console.log(`[SQLite] Created ${spec.entityName}:`, data.id);
    return data as T;
  }
  
  async executeUpdate<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
    data: Partial<T>;
  }): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const config = this.getEntityConfig(spec.entityName);
    
    // 添加 updatedAt
    const data = { ...spec.data, updatedAt: new Date() } as Record<string, unknown>;
    const serialized = this.serializeData(data, config);
    
    const setClauses = Object.keys(serialized).map(k => `${k} = ?`).join(', ');
    const setValues = Object.values(serialized);
    
    const { sql: whereClause, params: whereParams } = this.buildWhereClause(spec.where, config);
    
    const sql = `UPDATE ${config.tableName} SET ${setClauses} ${whereClause}`;
    const params = [...setValues, ...whereParams];
    
    if (this.config.debug) {
      this.logSQL('UPDATE', sql, params);
    }
    
    // 先获取受影响的行数
    const countResult = await this.executeCount({ ...spec, entityClass: spec.entityClass });
    
    this.db.run(sql, params);
    await this.autoSave();
    
    console.log(`[SQLite] Updated ${countResult} ${spec.entityName}(s)`);
    return countResult;
  }
  
  async executeDelete<T>(spec: {
    entityClass: EntityClass<T>;
    entityName: string;
    where: Array<WhereCondition<T> | WhereGroup<T>>;
  }): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const config = this.getEntityConfig(spec.entityName);
    const { sql: whereClause, params } = this.buildWhereClause(spec.where, config);
    
    // 先获取受影响的行数
    const countResult = await this.executeCount({ 
      ...spec, 
      entityClass: spec.entityClass,
      include: [],
      select: [],
      orderBy: [],
    });
    
    const sql = `DELETE FROM ${config.tableName} ${whereClause}`;
    
    if (this.config.debug) {
      this.logSQL('DELETE', sql, params);
    }
    
    this.db.run(sql, params);
    await this.autoSave();
    
    console.log(`[SQLite] Deleted ${countResult} ${spec.entityName}(s)`);
    return countResult;
  }
  
  async transactional<R>(callback: () => Promise<R>): Promise<R> {
    if (!this.db) throw new Error('Database not initialized');
    
    this.db.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      this.db.run('COMMIT');
      await this.autoSave();
      return result;
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 手动保存到 IndexedDB
   */
  async save(): Promise<void> {
    await this.saveToIndexedDB();
    console.log('[SQLite] Database saved to IndexedDB');
  }
  
  /**
   * 执行原生 SQL
   */
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }> {
    if (!this.db) throw new Error('Database not initialized');
    
    if (this.config.debug) {
      this.logSQL('EXEC', sql);
    }
    
    return this.db.exec(sql);
  }
  
  /**
   * 打印 SQL 日志
   */
  private logSQL(operation: string, sql: string, params?: unknown[]): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`%c[SQLite ${timestamp}] ${operation}`, 'color: #4CAF50; font-weight: bold');
    console.log(`%c${sql}`, 'color: #2196F3');
    if (params && params.length > 0) {
      console.log('%cParams:', 'color: #FF9800', params);
    }
  }
  
  /**
   * 关闭数据库
   */
  async destroy(): Promise<void> {
    if (this.config.persistKey) {
      await this.saveToIndexedDB();
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    console.log('[SQLite] Database closed');
  }
  
  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    for (const config of this.entityConfigs.values()) {
      this.db.run(`DELETE FROM ${config.tableName}`);
    }
    
    await this.autoSave();
    console.log('[SQLite] All data cleared');
  }
  
  /**
   * 导出数据库为 Uint8Array
   */
  export(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }
  
  /**
   * 导出数据库为 Blob（用于下载）
   */
  exportAsBlob(): Blob {
    const data = this.export();
    return new Blob([data], { type: 'application/x-sqlite3' });
  }
  
  /**
   * 下载数据库文件
   */
  download(filename = 'database.sqlite'): void {
    const blob = this.exportAsBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建浏览器 SQLite 适配器
 * 
 * @example
 * ```typescript
 * const adapter = await createSQLiteBrowserAdapter({
 *   persistKey: 'my-app-db',
 *   autoSave: true,
 * });
 * 
 * setORMAdapter(adapter);
 * ```
 */
export async function createSQLiteBrowserAdapter(
  config: SQLiteBrowserConfig = {}
): Promise<SQLiteBrowserAdapter> {
  const adapter = new SQLiteBrowserAdapter();
  await adapter.initialize(config);
  return adapter;
}

