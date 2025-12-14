/**
 * 全局类型声明
 * 
 * 这个文件会被自动加载到使用 @ai-builder/runtime-renderer 的项目中。
 * 
 * 它告诉 TypeScript：在开发环境中，@ai-builder/dsl/ui 和 @ai-builder/std-ui
 * 的类型定义与 @ai-builder/runtime-renderer 完全一致。
 */

declare module '@ai-builder/dsl/ui' {
  export * from '@ai-builder/runtime-renderer/react';
}

declare module '@ai-builder/std-ui' {
  export * from '@ai-builder/runtime-renderer/react';
}





