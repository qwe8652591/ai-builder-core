import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    server: 'src/server.ts',
    analyzer: 'src/analyzer.ts',
    'components/index': 'src/components/index.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  external: [
    'react', 
    'react-dom', 
    '@qwe8652591/dsl-core', 
    '@qwe8652591/std-ui',
    '@qwe8652591/vite-plugin',
    'vite',
    '@vitejs/plugin-react',
    'tsx',
    'tsx/esm',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});

