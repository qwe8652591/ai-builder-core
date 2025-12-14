import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  esbuild: {
    // 将目标版本设为 es2021 或更低，迫使 esbuild 转译装饰器语法
    target: 'es2021', 
  }
});
