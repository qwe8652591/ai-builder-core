import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // 使用 tsc 单独生成
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
});






