import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiBuilderPlugin } from '@ai-builder/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // AI Builder 插件：在开发时将 DSL 导入替换为 runtime-renderer
    aiBuilderPlugin({
      debug: true,
      importMappings: {
        // 响应式原语：@ai-builder/dsl/ui → runtime-renderer
        '@ai-builder/dsl/ui': '@ai-builder/runtime-renderer',
        // 标准 UI 组件：@ai-builder/std-ui → runtime-renderer
        '@ai-builder/std-ui': '@ai-builder/runtime-renderer',
      },
    }),
  ],
  resolve: {
    alias: {
      // 开发时直接使用源码（更快的热重载）
      '@ai-builder/runtime-renderer': path.resolve(__dirname, '../../packages/runtime-renderer/src/index.ts'),
      '@ai-builder/dsl': path.resolve(__dirname, '../../packages/dsl/src/index.ts'),
      '@ai-builder/std-ui': path.resolve(__dirname, '../../packages/std-ui/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons'],
  },
});

