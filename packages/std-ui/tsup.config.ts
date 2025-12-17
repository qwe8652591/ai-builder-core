import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, // 自动生成类型定义
  sourcemap: true,
  clean: true,
  target: 'es2022',
});





