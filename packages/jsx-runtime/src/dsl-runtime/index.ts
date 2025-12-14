/**
 * DSL 定义层 + 核心运行时原语
 * 
 * 职责：
 * - DSL 定义 API（definePage, defineEntity 等）
 * - 元数据管理
 * - 核心运行时原语（状态、生命周期、路由）
 * 
 * 注：数据库、ORM 适配器等实现在 @ai-builder/dsl-runtime
 */

// 状态管理
export * from './state';

// 生命周期
export * from './lifecycle';

// 页面上下文
export * from './page-context';

// 路由 DSL
export * from './router';

// DSL 引擎
export * from './dsl-engine';

// 应用级 DSL
export * from './app-dsl';

// 服务层 DSL
export * from './service-dsl';

// 模型层 DSL
export * from './model-dsl';

// DTO 层 DSL
export * from './dto-dsl';

// 领域逻辑 DSL
export * from './domain-dsl';

// Metadata Store
export * from './metadata-store';

// 装饰器
export * from './decorators';

// 类型系统
export * from './type-system';

// ORM DSL
export * from './orm-dsl';
