/**
 * Kysely 数据库实例配置
 */

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './database.schema';

/**
 * 数据库配置
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'purchase_order_demo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,  // 连接池最大连接数
};

/**
 * 创建 PostgreSQL 连接池
 */
const pool = new Pool(dbConfig);

/**
 * 创建 Kysely 数据库实例
 * 
 * 这个实例提供完全类型安全的查询构建器
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
  // 开发环境下打印 SQL 日志
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

/**
 * 优雅关闭数据库连接
 */
export async function closeDatabase() {
  await db.destroy();
}

/**
 * 健康检查
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.selectFrom('purchase_orders').select('id').limit(1).execute();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

