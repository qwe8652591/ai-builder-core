# 📖 View 示例文件说明

## ✅ 标准示例（严格 DSL 模式）

### `RealUIExample.view.tsx` ⭐️

**完整的订单管理示例 - 唯一推荐的参考模板！**

展示内容：
- ✅ 完整的订单管理功能（创建、编辑、搜索、分页）
- ✅ 使用所有 19 个标准 UI 组件
- ✅ 完全符合 DSL 规范，可被编译器正确转换
- ✅ 100% 类型安全，零错误
- ✅ 展示真实业务场景的最佳实践

使用的虚拟组件：
```tsx
<Page>
  <Card>
    <Row><Col>...</Col></Row>
    <Input />
    <Button />
    <Table<Order> />
    <Modal>
      <Form<OrderForm>>
        <FormItem>
          <Input />
          <Select />
          <DatePicker />
        </FormItem>
      </Form>
    </Modal>
    <Tag />
    <Descriptions />
    <Breadcrumb />
  </Card>
</Page>
```

---

## 🎯 严格 DSL 模式规则

### 1. 只使用虚拟 UI 组件 ✅

```tsx
import { definePage, useState } from '@ai-builder/dsl/ui';
import { Page, Card, Button, Input } from '@ai-builder/std-ui';

export default definePage({ route: '/demo' }, () => {
  const name = useState('');
  
  return () => (
    <Page title="示例页面">
      <Card>
        <Input value={name.value} onChange={(v) => name.value = v} />
        <Button type="primary" onClick={() => console.log(name.value)}>
          提交
        </Button>
      </Card>
    </Page>
  );
});
```

### 2. 禁止使用原生 HTML 标签 ❌

```tsx
// ❌ 错误的做法
export default definePage({ route: '/demo' }, () => {
  return () => (
    <div>                    {/* ❌ 类型错误 */}
      <input type="text" />  {/* ❌ 不会被编译器转换 */}
      <button>提交</button>   {/* ❌ 不符合 DSL 规范 */}
    </div>
  );
});
```

### 3. 为什么要这样做？

- ✅ **跨框架兼容**：代码可以被编译为 Vue3 或 React
- ✅ **类型安全**：完整的 TypeScript 类型检查
- ✅ **统一接口**：所有项目使用相同的组件 API
- ✅ **可维护性**：标准化的代码结构
- ✅ **DSL 纯粹性**：保证领域特定语言的一致性

---

## 🔧 技术说明

### 虚拟组件系统架构

```
1. 类型定义
   packages/std-ui/src/**/*.ts
   ├── layout/Page.ts      → PageProps
   ├── basic/Button.ts     → ButtonProps
   └── form/Input.ts       → InputProps

2. 运行时声明
   packages/std-ui/src/components.tsx
   export declare const Page: (props: PageProps) => unknown;
   export declare const Button: (props: ButtonProps) => unknown;
   export declare const Input: (props: InputProps) => unknown;

3. 使用方式
   your-page.view.tsx
   import { Page, Button, Input } from '@ai-builder/std-ui';
   <Page><Button /><Input /></Page>  ✅ 自动类型检查
```

### 当前配置说明

- ✅ `global.d.ts` 只声明 JSX runtime（react/jsx-runtime）
- ✅ 虚拟组件通过 `import` + `components.tsx` 获得 JSX 支持
- ✅ 未声明的标签（如原生 HTML）会触发类型错误
- ✅ 实现严格的 DSL 类型检查，确保代码可编译转换

---

## 🚀 未来扩展

如果以后需要支持原生 HTML 标签（混合模式）：

1. 在 `global.d.ts` 中添加 `JSX.IntrinsicElements` 声明
2. 明确列出允许的原生标签及其 Props
3. 更新本文档说明混合模式的使用规则和限制

> **注意**：引入原生 HTML 会削弱 DSL 的跨框架能力，需谨慎评估。

---

## 📚 参考文档

- **标准 UI 组件使用指南**：[packages/std-ui/USAGE_GUIDE.md](../../../../packages/std-ui/USAGE_GUIDE.md)
- **UI DSL 规范**：[specs/003-ui-dsl-implementation/spec.md](../../../../specs/003-ui-dsl-implementation/spec.md)
- **架构设计白皮书**：[TS_Based_MDA_Architecture.md](../../../../TS_Based_MDA_Architecture.md)

---

## 📋 可用的虚拟组件清单

### 布局组件
- `Page` - 页面容器
- `Card` - 卡片容器
- `Row` / `Col` - 栅格布局

### 表单组件
- `Form` / `FormItem` - 表单容器
- `Input` - 文本输入框
- `Select` - 下拉选择器
- `DatePicker` - 日期选择器
- `Upload` - 文件上传

### 数据展示
- `Table` - 数据表格
- `Tag` - 标签
- `Descriptions` - 描述列表

### 反馈组件
- `Modal` - 对话框
- `Loading` - 加载状态

### 导航组件
- `Menu` - 导航菜单
- `Tabs` - 标签页
- `Breadcrumb` - 面包屑

### 基础组件
- `Button` - 按钮
- `Icon` - 图标
- `Link` - 链接

---

**记住：只使用 `@ai-builder/std-ui` 中定义的虚拟组件！** ✨
