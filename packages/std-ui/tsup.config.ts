import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // 我们用 tsc 单独生成类型
  sourcemap: true,
  clean: true,
  target: 'es2022',
});





