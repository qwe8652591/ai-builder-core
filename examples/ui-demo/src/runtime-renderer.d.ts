/**
 * Runtime Renderer 类型增强
 * 
 * 此文件是必需的，它告诉 TypeScript：
 * - 在开发时，@ai-builder/dsl/ui 和 @ai-builder/std-ui 的实现由 @ai-builder/runtime-renderer 提供
 * - 在生产环境，编译器会将 .view.tsx 文件转换为目标框架代码（Vue/React）
 * 
 * 注意：此文件是轻量级的配置文件，所有项目都需要它来启用 Runtime Renderer 功能
 */

declare module '@ai-builder/dsl/ui' {
  export * from '@ai-builder/runtime-renderer';
}

declare module '@ai-builder/std-ui' {
  export * from '@ai-builder/runtime-renderer';
}





