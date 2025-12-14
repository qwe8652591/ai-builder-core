# Runtime Renderer 使用指南

## 快速开始

### 1. 安装依赖

```bash
pnpm add @ai-builder/runtime-renderer
pnpm add -D @ai-builder/vite-plugin
```

### 2. 配置类型声明

在你的项目 `src` 目录下创建 `types.d.ts` 文件（或其他 `.d.ts` 文件）：

```typescript
// src/types.d.ts
/**
 * 开发时类型声明
 * 告诉 TypeScript：DSL 协议在开发时使用 runtime-renderer 的类型
 */

declare module '@ai-builder/dsl/ui' {
  export * from '@ai-builder/runtime-renderer';
}

declare module '@ai-builder/std-ui' {
  export * from '@ai-builder/runtime-renderer';
}
```

> **为什么需要这个文件？**  
> 在开发环境中，Vite 插件会在运行时将 `@ai-builder/dsl/ui` 和 `@ai-builder/std-ui` 
> 的导入替换为 `@ai-builder/runtime-renderer`。但 TypeScript 在编译时检查类型，
> 需要这个声明文件来告诉它这些模块的类型定义是一致的。

### 3. 配置 Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiBuilderPlugin } from '@ai-builder/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    aiBuilderPlugin({
      debug: true, // 可选：启用调试日志
    }),
  ],
  resolve: {
    alias: {
      // 开发时直接使用源码（更快的热重载）
      '@ai-builder/runtime-renderer': path.resolve(
        __dirname, 
        '../../packages/runtime-renderer/src/index.ts'
      ),
      '@ai-builder/dsl': path.resolve(
        __dirname, 
        '../../packages/dsl/src/index.ts'
      ),
      '@ai-builder/std-ui': path.resolve(
        __dirname, 
        '../../packages/std-ui/src/index.ts'
      ),
    },
  },
});
```

### 4. 编写 DSL 代码

```typescript
// src/views/OrderList.view.tsx
import { useState } from '@ai-builder/dsl/ui';
import { Page, Card, Button, Table } from '@ai-builder/std-ui';

export default function OrderListPage() {
  const [count, setCount] = useState(0);

  return (
    <Page title="订单列表">
      <Card title="示例">
        <Button onClick={() => setCount(count + 1)}>
          点击次数: {count}
        </Button>
      </Card>
    </Page>
  );
}
```

## 工作原理

```
┌─────────────────────────────────────────────────┐
│  开发阶段（Development）                         │
│                                                 │
│  1. 编写 DSL 代码                                │
│     import { Page } from '@ai-builder/std-ui'   │
│                                                 │
│  2. Vite 插件运行时替换                          │
│     → '@ai-builder/runtime-renderer'           │
│                                                 │
│  3. 渲染到浏览器                                 │
│     → React 18 + Ant Design 5                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  生产阶段（Production）- 未来实现                 │
│                                                 │
│  1. DSL 代码                                    │
│     ↓                                           │
│  2. AI Builder Compiler                        │
│     ↓                                           │
│  3. 目标框架代码                                 │
│     - Vue 3 + Element Plus                     │
│     - React + Ant Design                       │
│     - 其他框架...                               │
└─────────────────────────────────────────────────┘
```

## 常见问题

### Q: 为什么不能直接导入 `@ai-builder/runtime-renderer`？

A: 为了保持 DSL 代码的框架无关性。你的代码应该只依赖 DSL 协议（`@ai-builder/dsl/ui` 和 `@ai-builder/std-ui`），
   而不是具体的实现。这样，未来通过编译器可以将相同的代码编译到不同的目标框架。

### Q: `types.d.ts` 文件可以放在其他位置吗？

A: 可以，只要在你的 `tsconfig.json` 的 `include` 范围内即可。通常放在 `src` 目录下最方便。

### Q: 生产环境怎么办？

A: 目前是开发阶段，生产环境的编译器还在开发中。届时会提供 `@ai-builder/compiler` 来生成目标框架的代码。

## 示例项目

参考 `examples/ui-demo` 目录查看完整的示例项目。

## 架构图

```
DSL 协议层（开发时）
├── @ai-builder/dsl/ui       (响应式原语)
└── @ai-builder/std-ui       (标准 UI 组件)
         ↓
         ↓ Vite Plugin (运行时替换)
         ↓
Runtime Renderer（开发时实现）
├── @ai-builder/runtime-renderer
    ├── React Hooks 实现
    └── Ant Design 5 组件映射
         ↓
         ↓
浏览器渲染（React 18 + Ant Design 5）
```

## 相关文档

- [Vite Plugin 文档](../vite-plugin-ai-builder/README.md)
- [DSL API 文档](../dsl/README.md)
- [标准 UI 组件文档](../std-ui/README.md)





