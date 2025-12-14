import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/primitives/index.ts',
    'src/types/index.ts',
    'src/decorators/index.ts',
    'src/ui/index.ts',
    'src/utils/metadata.ts',
    'src/extension/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to tsconfig composite issues
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // 开发阶段不压缩，方便调试
  external: ['ts-morph', 'glob'], // 标记为外部依赖（由使用者提供）
});

