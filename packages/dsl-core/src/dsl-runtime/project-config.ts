/**
 * DSL 项目配置类型
 * 
 * 用于 dsl.config.ts 文件的类型定义
 */

export interface DSLProjectConfig {
  /** 项目名称（用于数据库持久化 key 等） */
  name?: string;
  
  /** 项目根目录（运行时自动设置） */
  root: string;
  
  /** 
   * DSL 源码目录（相对于 root）
   * @default 'src/dsl' - 约定优于配置
   */
  srcDir: string;
  
  /** 
   * DSL 入口文件（相对于 srcDir）
   * @default 'index.ts' - 约定优于配置
   */
  entry: string;
  
  /**
   * 自定义入口文件（相对于 root）
   * 如果提供，将使用此文件作为应用入口，否则自动生成
   * @example 'src/main.tsx'
   */
  customEntry?: string;
  
  /** 数据库配置 */
  database?: {
    /** 
     * 初始化 SQL 文件路径（相对于 root）
     * ⚠️ 必须在项目目录内，会进行安全检查
     */
    initSql?: string;
    
    /** 检查表名（用于判断数据库是否需要加载初始数据） */
    checkTable?: string;
    
    /** IndexedDB 持久化 key（浏览器端自动生成，可自定义） */
    persistKey?: string;
    
    /** 是否开启调试日志 */
    debug?: boolean;
  };
  
  /** 开发服务器配置 */
  server?: {
    port: number;
    host?: string;
  };
}
