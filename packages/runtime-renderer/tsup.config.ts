import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['esm'],
  dts: false, // 禁用 tsup 的 DTS 生成，使用 tsc
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react', 
    'react-dom', 
    'antd', 
    '@ant-design/icons', 
    '@ai-builder/dsl', 
    '@ai-builder/std-ui',
    '@ai-builder/jsx-runtime',
    '@ai-builder/ui-types',
  ],
  treeshake: true,
});

