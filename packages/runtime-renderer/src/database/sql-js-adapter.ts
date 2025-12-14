/**
 * SQL.js 适配器
 * 
 * 将 sql.js (SQLite WASM) 包装成 Kysely SqliteDialect 兼容的接口
 * 
 * 使用方式：
 * ```typescript
 * import initSqlJs from 'sql.js';
 * import { SqlJsAdapter } from '@ai-builder/runtime-renderer';
 * 
 * const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
 * const sqlJsDb = new SQL.Database();
 * const adapter = new SqlJsAdapter(sqlJsDb);
 * 
 * const dialect = new SqliteDialect({ database: adapter as any });
 * const db = new Kysely({ dialect });
 * ```
 */

import type { Database as SqlJsDatabase } from './sql-js';

/**
 * Kysely SqliteDialect 兼容的 sql.js 包装器
 * 
 * 关键发现：Kysely 的 SqliteDialect 只调用 run() 方法！
 * 它期望 run() 返回一个 Statement-like 对象，该对象是一个 iterable。
 * 
 * better-sqlite3 的 Statement.run() 返回的对象有：
 * - changes: number
 * - lastInsertRowid: number/bigint  
 * - 对于 SELECT，Statement 本身是 iterable，可以用 for...of 遍历行
 * 
 * 因此我们需要让 run() 返回一个可迭代的对象。
 */
export class SqlJsAdapter {
  constructor(private db: SqlJsDatabase) {}

  prepare(sql: string) {
    const db = this.db;
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    console.log('[SQLite] prepare called:', sql.substring(0, 60));
    
    // 创建一个 Statement-like 对象
    // better-sqlite3 的 Statement 有以下关键方法和属性：
    // - run(params): 执行语句，返回 { changes, lastInsertRowid }
    // - all(params): 返回所有行
    // - get(params): 返回第一行
    // - iterate(params): 返回迭代器
    // - Statement 本身也是可迭代的
    
    const statement = {
      reader: isSelect,  // better-sqlite3 使用此属性判断是否为 SELECT
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run: (...params: any[]): any => {
        console.log('[SQLite] run called with', params.length, 'params');
        try {
          const stmt = db.prepare(sql);
          const bindParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          if (bindParams && bindParams.length > 0) {
            stmt.bind(bindParams);
          }
          
          if (isSelect) {
            // 对于 SELECT，run() 应该执行查询但返回元信息
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows: any[] = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject());
            }
            stmt.free();
            console.log('[SQLite] SELECT via run():', sql.substring(0, 50), '... rows:', rows.length);
            
            // 返回带有迭代器的结果对象
            const result = {
              changes: 0,
              lastInsertRowid: BigInt(0),
              // Kysely 会使用 for...of 遍历结果
              [Symbol.iterator]: function* () {
                for (const row of rows) {
                  yield row;
                }
              }
            };
            return result;
          } else {
            // INSERT/UPDATE/DELETE
            stmt.step();
            stmt.free();
            const changes = db.getRowsModified();
            console.log('[SQLite] DML via run():', sql.substring(0, 50), '... changes:', changes);
            return {
              changes,
              lastInsertRowid: BigInt(0),
              [Symbol.iterator]: function* () { /* empty */ }
            };
          }
        } catch (error) {
          console.error('[SQLite] Error in run():', sql, params, error);
          throw error;
        }
      },
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      all: (...params: any[]): any[] => {
        console.log('[SQLite] all() called');
        const stmt = db.prepare(sql);
        const bindParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        if (bindParams && bindParams.length > 0) {
          stmt.bind(bindParams);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        console.log('[SQLite] all() returned', rows.length, 'rows');
        return rows;
      },
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (...params: any[]): any => {
        console.log('[SQLite] get() called');
        const stmt = db.prepare(sql);
        const bindParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        if (bindParams && bindParams.length > 0) {
          stmt.bind(bindParams);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        console.log('[SQLite] get() returned:', result);
        return result;
      },
      
      // iterate 方法 - Kysely 可能使用这个
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iterate: (...params: any[]): IterableIterator<any> => {
        console.log('[SQLite] iterate() called');
        const stmt = db.prepare(sql);
        const bindParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        if (bindParams && bindParams.length > 0) {
          stmt.bind(bindParams);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        console.log('[SQLite] iterate() collected', rows.length, 'rows');
        
        return (function* () {
          for (const row of rows) {
            yield row;
          }
        })();
      }
    };
    
    return statement;
  }

  close() {
    this.db.close();
  }

  /**
   * 获取原始 sql.js 数据库实例
   */
  getRawDatabase(): SqlJsDatabase {
    return this.db;
  }

  /**
   * 导出数据库为二进制数据
   */
  export(): Uint8Array {
    return this.db.export();
  }
}

