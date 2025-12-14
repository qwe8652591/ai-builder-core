import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@ai-builder/dsl': path.resolve(__dirname, '../../packages/dsl/src'),
      '@ai-builder/std-ui': path.resolve(__dirname, '../../packages/std-ui/src'),
      '@ai-builder/runtime': path.resolve(__dirname, '../../packages/runtime/src'),
    },
  },
  server: {
    port: 3002,
    open: true,
  },
});

