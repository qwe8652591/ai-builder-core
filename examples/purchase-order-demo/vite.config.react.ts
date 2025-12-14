/**
 * Vite 配置 - React 渲染模式
 * 
 * 使用 React 作为渲染引擎
 */
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // 使用 React 默认配置（让 Vite 自动处理 JSX）
  resolve: {
    alias: {
      // 包别名
      '@ai-builder/jsx-runtime': path.resolve(__dirname, '../../packages/jsx-runtime/src'),
      '@ai-builder/dsl': path.resolve(__dirname, '../../packages/dsl/dist/index.mjs'),
      '@ai-builder/runtime': path.resolve(__dirname, '../../packages/runtime/dist/index.js'),
      '@ai-builder/runtime-renderer': path.resolve(__dirname, '../../packages/runtime-renderer/dist/index.js'),
      '@ai-builder/std-ui': path.resolve(__dirname, '../../packages/std-ui/src'),
      '@ai-builder/ui-types': path.resolve(__dirname, '../../packages/ui-types/src'),
    },
  },
  
  server: {
    port: 3004, // 使用不同端口
    open: true,
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd'],
  },
  
  esbuild: {
    // 使用 React JSX 运行时
    jsx: 'automatic',
    // 确保装饰器正常工作
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
});

