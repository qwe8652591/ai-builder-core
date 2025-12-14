import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to tsconfig issues
  splitting: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['@ai-builder/dsl', 'decimal.js-light', 'mitt'],
});
