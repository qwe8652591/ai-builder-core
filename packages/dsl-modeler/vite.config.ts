/**
 * Vite 配置 - 用于独立运行的建模工作台
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // 强制使用 React 的 JSX runtime，而不是 dsl-core 的
      jsxImportSource: 'react',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    // 确保 esbuild 也使用 React 的 JSX runtime
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons'],
    // 排除 dsl-core，避免被预构建时使用 dsl-core 的 JSX
    exclude: ['@qwe8652591/dsl-core', '@qwe8652591/std-ui'],
  },
});

