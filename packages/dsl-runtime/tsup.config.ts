import { defineConfig } from 'tsup';

// Node.js 内置模块
const nodeBuiltins = [
  'fs', 'path', 'url', 'os', 'util', 'stream', 'events', 'buffer',
  'crypto', 'http', 'https', 'net', 'tls', 'dns', 'child_process',
  'cluster', 'dgram', 'readline', 'repl', 'vm', 'zlib', 'assert',
  'tty', 'string_decoder', 'querystring', 'punycode', 'module',
  'fs/promises', 'node:fs', 'node:path', 'node:url', 'node:os',
  'node:util', 'node:stream', 'node:events', 'node:buffer',
  'node:crypto', 'node:http', 'node:https', 'node:child_process',
  'node:fs/promises', 'node:module', 'perf_hooks', 'worker_threads',
];

// 公共外部依赖
const commonExternal = [
  ...nodeBuiltins,
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
  'glob',
  'chalk',
  'commander',
  'esbuild',
  'tsx',
  '@qwe8652591/dsl-core',
  '@qwe8652591/std-ui',
];

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
    platform: 'node',
    external: commonExternal,
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
    platform: 'node',
    external: commonExternal,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);

