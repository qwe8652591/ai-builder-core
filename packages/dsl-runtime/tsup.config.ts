import { defineConfig } from 'tsup';

export default defineConfig([
  // 主入口
  {
    entry: {
      'index': 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'node18',
    external: [
      'reflect-metadata',
      'vite',
      '@vitejs/plugin-react',
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'dayjs',
      'sql.js',
    ],
  },
  // CLI 入口（需要 shebang）
  {
    entry: {
      'cli': 'src/cli.ts',
    },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    target: 'node18',
    external: [
      'reflect-metadata',
      'vite',
      '@vitejs/plugin-react',
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'dayjs',
      'sql.js',
    ],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);

