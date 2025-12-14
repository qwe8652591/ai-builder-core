# @ai-builder/runtime-renderer

Runtime renderer for AI Builder UI DSL, providing React + Ant Design 5 implementations for development.

## 概述

这个包为 AI Builder UI DSL 提供运行时渲染能力：
- **开发阶段**：将 DSL 原语（`@ai-builder/dsl/ui`）和标准 UI 组件（`@ai-builder/std-ui`）映射到 React + Ant Design 5
- **生产阶段**：通过编译器将 `.view.tsx` 文件转换为目标框架代码（Vue/React）

## 安装

```bash
pnpm add @ai-builder/runtime-renderer @ai-builder/dsl @ai-builder/std-ui
pnpm add react react-dom antd @ant-design/icons
```

## 使用方法

### 1. 安装 Vite 插件

```bash
pnpm add -D @ai-builder/vite-plugin
```

### 2. 配置 Vite

在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiBuilderPlugin } from '@ai-builder/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    aiBuilderPlugin(), // 自动将 DSL 导入重定向到 runtime-renderer
  ],
});
```

### 3. 创建类型声明文件（必需）

在项目的 `src` 目录下创建 `runtime-renderer.d.ts` 文件：

```typescript
/**
 * Runtime Renderer 类型增强
 * 
 * 此文件是必需的，它告诉 TypeScript：
 * - 在开发时，@ai-builder/dsl/ui 和 @ai-builder/std-ui 的实现由 @ai-builder/runtime-renderer 提供
 * - 在生产环境，编译器会将 .view.tsx 文件转换为目标框架代码（Vue/React）
 * 
 * 注意：此文件是轻量级的配置文件，所有项目都需要它来启用 Runtime Renderer 功能
 */

declare module '@ai-builder/dsl/ui' {
  export * from '@ai-builder/runtime-renderer';
}

declare module '@ai-builder/std-ui' {
  export * from '@ai-builder/runtime-renderer';
}
```

**为什么需要这个文件？**

TypeScript 的模块增强（module augmentation）无法在 npm 包内部自动生效。这是 TypeScript 的设计限制，为了类型安全，需要在每个使用项目中显式声明模块映射关系。

这是一个轻量级的配置文件（仅 ~20 行），是业界标准做法（类似于 Vue、React 等框架的类型声明方式）。

### 4. 编写 UI DSL 代码

创建 `.view.tsx` 文件，使用 DSL 原语和标准 UI 组件：

```typescript
// src/App.view.tsx
import { useState, useComputed } from '@ai-builder/dsl/ui';
import { Page, Card, Button, Table } from '@ai-builder/std-ui';

export default function App() {
  const [count, setCount] = useState(0);
  const doubleCount = useComputed(() => count.value * 2);

  return (
    <Page title="示例页面">
      <Card title="计数器">
        <p>Count: {count.value}</p>
        <p>Double: {doubleCount.value}</p>
        <Button type="primary" onClick={() => setCount(count.value + 1)}>
          Increment
        </Button>
      </Card>
    </Page>
  );
}
```

### 5. 运行开发服务器

```bash
pnpm dev
```

## 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                        开发阶段                              │
│  .view.tsx                                                  │
│     ↓ import from @ai-builder/dsl/ui & @ai-builder/std-ui  │
│     ↓ (Vite Plugin 重定向)                                  │
│  @ai-builder/runtime-renderer                               │
│     ├─ React Hooks (useState, useEffect, etc.)              │
│     └─ Ant Design 5 Components (Button, Table, etc.)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        生产阶段                              │
│  .view.tsx                                                  │
│     ↓ 编译器转换                                            │
│  目标框架代码 (Vue 3 / React)                               │
│     └─ 目标 UI 库 (Element Plus / Ant Design)              │
└─────────────────────────────────────────────────────────────┘
```

## API 文档

### 响应式原语

- `useState<T>(initialValue: T): ReactiveState<T>` - 响应式状态
- `useComputed<T>(getter: () => T): ComputedState<T>` - 计算属性
- `useWatch(source, callback, options?)` - 监听变化
- `useEffect(callback, deps?)` - 副作用
- `onMounted(callback)` - 挂载时执行
- `onUnmounted(callback)` - 卸载时执行

### 标准 UI 组件（19个）

#### 布局组件
- `Page` - 页面容器
- `Card` - 卡片
- `Row` / `Col` - 栅格布局
- `Space` - 间距

#### 表单组件
- `Form` / `FormItem` - 表单
- `Input` - 输入框
- `Select` - 选择器
- `DatePicker` - 日期选择器
- `Upload` - 上传

#### 数据展示
- `Table` - 表格
- `Tag` - 标签
- `Descriptions` - 描述列表

#### 反馈组件
- `Modal` - 对话框
- `Loading` - 加载中
- `Message` - 消息提示
- `Notification` - 通知

#### 导航组件
- `Menu` - 菜单
- `Tabs` - 标签页
- `Breadcrumb` - 面包屑

#### 基础组件
- `Button` - 按钮
- `Icon` - 图标
- `Link` - 链接

## 示例项目

参考 `examples/ui-demo` 查看完整示例。

## 注意事项

1. **类型声明文件是必需的**：每个项目都需要创建 `src/runtime-renderer.d.ts` 文件
2. **Vite 插件是必需的**：确保在 `vite.config.ts` 中添加 `aiBuilderPlugin()`
3. **仅用于开发**：生产环境应使用编译器生成优化后的目标框架代码
4. **类型安全**：所有组件和原语都有完整的 TypeScript 类型定义

## 许可证

MIT
