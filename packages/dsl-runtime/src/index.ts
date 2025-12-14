/**
 * DSL Runtime
 * 
 * 🎯 负责加载、解析和运行 DSL 项目
 * 
 * 使用方式：
 * ```bash
 * # 在 DSL 项目目录下运行
 * npx @ai-builder/dsl-runtime dev
 * 
 * # 或指定 DSL 项目路径
 * npx @ai-builder/dsl-runtime dev ./examples/purchase-order-demo
 * ```
 */

export { loadDSLProject, type DSLProjectConfig } from './loader.js';
export { createDevServer } from './server.js';
export { generateApp } from './app-generator.js';
