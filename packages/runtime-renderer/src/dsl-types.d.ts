/**
 * DSL 协议类型声明
 * 
 * 在开发环境中，@ai-builder/dsl/ui 和 @ai-builder/std-ui 的导入
 * 会在运行时被 Vite 插件替换为 @ai-builder/runtime-renderer。
 * 
 * 这个文件告诉 TypeScript：这些模块的类型定义与 runtime-renderer 一致。
 * 
 * 使用 runtime-renderer 的项目会自动获得这些类型声明。
 */

declare module '@ai-builder/dsl/ui' {
  export * from '@ai-builder/runtime-renderer';
}

declare module '@ai-builder/std-ui' {
  export * from '@ai-builder/runtime-renderer';
}





