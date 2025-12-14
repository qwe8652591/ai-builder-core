/**
 * DSL 项目配置
 */

import type { DSLProjectConfig } from '@qwe8652591/dsl-core';

const config: Partial<DSLProjectConfig> = {
  // 数据库配置
  database: {
    initSql: 'resources/data.sql',
    checkTable: 'purchase_orders',
    debug: true,
  },
  
  // 开发服务器
  server: {
    port: 3004,
  },
};

export default config;
