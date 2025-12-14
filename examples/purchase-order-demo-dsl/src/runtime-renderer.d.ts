/**
 * 开发时类型声明文件
 *
 * 这个文件告诉 TypeScript：@ai-builder/dsl/ui 和 @ai-builder/std-ui
 * 在开发时的类型与 @ai-builder/runtime-renderer 一致。
 *
 * 注意：这是开发时的配置，生产环境会通过编译器转换为目标框架代码。
 */

declare module '@ai-builder/dsl/ui' {
  export * from '@ai-builder/runtime-renderer';
}

declare module '@ai-builder/std-ui' {
  export * from '@ai-builder/runtime-renderer';
}




