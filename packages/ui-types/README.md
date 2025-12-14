# @ai-builder/ui-types

AI Builder UI 组件和原语的共享 TypeScript 类型定义。

## 📦 包含内容

### 组件类型 (`components.ts`)
定义了所有标准 UI 组件的 Props 接口：
- 布局组件：`Page`, `Card`, `Row`, `Col`, `Space`
- 表单组件：`Form`, `Input`, `Select`, `DatePicker`, `Upload`
- 数据展示：`Table`, `Tag`, `Descriptions`
- 反馈组件：`Modal`, `Loading`, `Message`, `Notification`
- 导航组件：`Menu`, `Tabs`, `Breadcrumb`
- 基础组件：`Button`, `Icon`, `Link`

### 原语类型 (`primitives.ts`)
定义了 UI DSL 的响应式原语类型：
- `ReactiveState<T>` - 响应式状态
- `ComputedState<T>` - 计算属性
- `EffectCallback` - 副作用回调
- `WatchOptions` - 监听选项

## 🎯 设计理念

这个包是 AI Builder UI 类型系统的**单一来源（Single Source of Truth）**：

```
@ai-builder/ui-types (类型定义)
        ↓
    ┌───┴───┬─────────┐
    ↓       ↓         ↓
  dsl    std-ui  runtime-renderer
```

### 优点
- ✅ 避免类型定义重复
- ✅ 保证类型一致性
- ✅ 易于维护和更新
- ✅ 清晰的依赖关系

## 📖 使用方法

### 安装
```bash
pnpm add @ai-builder/ui-types
```

### 导入类型
```typescript
// 导入所有类型
import type { ButtonProps, PageProps, ReactiveState } from '@ai-builder/ui-types';

// 或者按需导入
import type { ButtonProps } from '@ai-builder/ui-types/components';
import type { ReactiveState } from '@ai-builder/ui-types/primitives';
```

## 🔗 相关包

- **[@ai-builder/dsl](../dsl)** - 使用这些类型定义 UI DSL
- **[@ai-builder/std-ui](../std-ui)** - 使用这些类型定义标准组件协议
- **[@ai-builder/runtime-renderer](../runtime-renderer)** - 使用这些类型实现运行时渲染

## 📝 添加新类型

当需要添加新的 UI 组件或原语时：

1. 在相应的文件中添加类型定义
2. 从 `index.ts` 导出
3. 运行 `pnpm build` 构建
4. 相关包会自动获得新类型

## 🎨 架构原则

### 框架无关
类型定义独立于具体实现框架（React/Vue/Angular）

### 协议优先
定义的是**接口协议**，不是具体实现

### 最小依赖
这个包不依赖任何其他 AI Builder 包，只有纯类型定义

## 📄 许可证

MIT





