# @ai-builder/dsl-std-ui

**Standard UI Component Protocol** for AI Builder DSL

框架无关的 UI 组件接口定义，支持编译时根据目标框架（Vue 3 / React）和 UI 库（Element Plus / Ant Design）自动替换为具体实现。

## 概述

`@ai-builder/dsl-std-ui` 定义了一套统一的 UI 组件协议，开发者在 DSL 中使用这些标准组件编写界面，编译器会根据配置自动生成目标框架的代码。

### 核心理念

- **一次编写，多框架生成**: 同一份 DSL 代码可编译为 Vue 3 或 React
- **UI 库无关**: 统一的组件接口抹平 Element Plus 和 Ant Design 的 API 差异
- **类型安全**: 所有组件 Props 都有严格的 TypeScript 类型定义
- **纯类型定义**: 本包不包含运行时实现，仅提供类型声明和接口规范

## 安装

```bash
pnpm add @ai-builder/dsl @ai-builder/dsl-std-ui
```

## 使用示例

```tsx
import { definePage, useState } from '@ai-builder/dsl/ui';
import { Page, Table, Button, Form, Input } from '@ai-builder/dsl-std-ui';

export default definePage({
  route: '/users',
  title: '用户列表',
  permission: 'user:list'
}, () => {
  const users = useState<User[]>([]);
  const loading = useState(false);

  return () => (
    <Page loading={loading.value}>
      <Table 
        data={users.value}
        columns={[
          { prop: 'name', label: '姓名' },
          { prop: 'email', label: '邮箱' }
        ]}
      />
      <Button type="primary" onClick={handleAdd}>添加用户</Button>
    </Page>
  );
});
```

## 支持的组件

### 布局组件 (Layout)

- `<Page>` - 页面容器，支持 loading 状态和标题
- `<Card>` - 卡片容器
- `<Row>` / `<Col>` - 栅格布局

### 表单组件 (Form)

- `<Form>` - 表单容器，支持数据绑定和验证
- `<Input>` - 输入框
- `<Select>` - 下拉选择
- `<DatePicker>` - 日期选择器
- `<Upload>` - 文件上传

### 数据展示 (Data)

- `<Table>` - 数据表格，支持分页、排序、选择
- `<Pagination>` - 分页器
- `<Tag>` - 标签
- `<Descriptions>` - 描述列表

### 反馈组件 (Feedback)

- `<Modal>` - 对话框
- `Message` - 消息提示（函数式 API）
- `<Loading>` - 加载指示器
- `Notification` - 通知提示（函数式 API）

### 导航组件 (Navigation)

- `<Menu>` - 导航菜单
- `<Tabs>` - 标签页
- `<Breadcrumb>` - 面包屑

### 基础组件 (Basic)

- `<Button>` - 按钮
- `<Icon>` - 图标
- `<Link>` - 链接

## 编译配置

在 `ai-builder.config.ts` 中配置目标框架和 UI 库：

```typescript
export default {
  compiler: {
    target: 'vue3', // 'vue3' | 'react'
    uiLibrary: 'element-plus' // 'element-plus' | 'ant-design'
  }
};
```

## 类型推导

所有组件都支持泛型类型推导：

```tsx
interface User {
  id: string;
  name: string;
}

// Table<User> 的 columns 会自动推导 prop 只能是 User 的键名
<Table<User>
  data={users.value}
  columns={[
    { prop: 'name', label: '姓名' } // ✅ 正确
    // { prop: 'xxx', label: '错误' } // ❌ 类型错误
  ]}
/>
```

## 组件映射

编译器内置以下映射关系：

| 标准组件 | Vue 3 + Element Plus | React + Ant Design |
|---------|---------------------|-------------------|
| `<Page>` | `<el-container>` | `<div className="page">` |
| `<Table>` | `<el-table>` | `<Table>` |
| `<Button>` | `<el-button>` | `<Button>` |
| `<Form>` | `<el-form>` | `<Form>` |

## 扩展原生属性

如需使用特定 UI 库的专有属性，可通过 `nativeProps` 透传：

```tsx
<Table
  data={users}
  columns={columns}
  nativeProps={{
    // Element Plus 专有属性
    highlightCurrentRow: true
  }}
/>
```

## 开发说明

本包是纯类型定义包，所有组件函数体都是：

```typescript
export function Button(props: ButtonProps): JSX.Element {
  throw new Error('Runtime not implemented - this is a compile-time DSL');
}
```

请勿在运行时直接调用这些组件，它们仅用于编译时的类型检查和代码生成。

## 贡献指南

欢迎贡献新的组件接口定义！请确保：

1. 组件接口是框架无关的
2. 所有 Props 有完整的 TypeScript 类型
3. 提供 JSDoc 文档注释
4. 更新本 README 的组件列表

## 许可证

MIT License - Copyright (c) 2025 AI Builder Team





