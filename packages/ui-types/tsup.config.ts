import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'components': 'src/components.ts',
    'primitives': 'src/primitives.ts',
  },
  format: ['cjs', 'esm'],
  dts: true, // 使用 tsup 生成 DTS
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});

