# 标准 UI 组件使用指南

## 📖 概述

`@ai-builder/std-ui` 提供了 19 个标准 UI 组件的接口定义。这些是"虚拟组件"，在编译时会被替换为具体的 UI 库实现（如 Element Plus 或 Ant Design）。

## 🎯 核心概念

### 1. 虚拟组件 (Virtual Components)

```typescript
// 你写的代码（使用虚拟组件）
<Button type="primary" onClick={handleClick}>提交</Button>

// 编译后（自动替换为具体实现）
// 如果目标是 Element Plus：
<el-button type="primary" @click={handleClick}>提交</el-button>

// 如果目标是 Ant Design：
<a-button type="primary" onClick={handleClick}>提交</a-button>
```

### 2. 类型安全

所有组件都有完整的 TypeScript 类型定义：

```typescript
import type { ButtonProps, TableProps } from '@ai-builder/std-ui';

// 完整的类型提示和检查
const buttonProps: ButtonProps = {
  type: 'primary',    // ✅ 类型正确
  size: 'large',      // ✅ 类型正确
  loading: true,      // ✅ 类型正确
  // type: 'invalid'  // ❌ 编译错误：不是有效的 ButtonType
};
```

## 📦 快速开始

### 安装依赖

```bash
# 安装 DSL 核心包
pnpm add @ai-builder/dsl

# 安装标准组件协议包
pnpm add @ai-builder/std-ui
```

### 基础示例

```tsx
import { definePage, useState } from '@ai-builder/dsl/ui';
import type { ButtonProps } from '@ai-builder/std-ui';

export default definePage({ route: '/demo', title: '演示页面' }, () => {
  const count = useState(0);
  
  return () => (
    <Page title="计数器">
      <Card>
        <p>当前计数：{count.value}</p>
        <Button 
          type="primary" 
          onClick={() => count.value++}
        >
          增加
        </Button>
      </Card>
    </Page>
  );
});
```

## 🧩 组件分类

### 1️⃣ 布局组件

#### Page - 页面容器

```tsx
<Page 
  loading={loading.value}    // 页面加载状态
  title="订单管理"           // 页面标题
  onBack={() => router.back()} // 返回按钮
>
  {/* 页面内容 */}
</Page>
```

#### Card - 卡片容器

```tsx
<Card 
  title="用户信息"
  extra={<Button>操作</Button>}  // 右上角额外内容
  shadow="hover"                 // 阴影效果
  collapsible={true}             // 可折叠
>
  {/* 卡片内容 */}
</Card>
```

#### Row/Col - 栅格布局

```tsx
<Row gutter={16}>  {/* 列间距 */}
  <Col xs={24} sm={12} md={8} lg={6}>  {/* 响应式 */}
    内容 A
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    内容 B
  </Col>
</Row>
```

### 2️⃣ 表单组件

#### Form - 表单容器

```tsx
interface UserForm {
  name: string;
  email: string;
  age: number;
}

const form = useState<UserForm>({ name: '', email: '', age: 0 });

<Form<UserForm>
  model={form.value}
  labelWidth="100px"
  rules={{
    name: [{ required: true, message: '请输入姓名' }],
    email: [{ required: true, type: 'email', message: '请输入邮箱' }],
  }}
  onSubmit={handleSubmit}
>
  {/* 表单项 */}
</Form>
```

#### Input - 输入框

```tsx
const name = useState('');

<Input
  value={name.value}
  placeholder="请输入姓名"
  clearable={true}            // 显示清空按钮
  maxLength={50}              // 最大长度
  onChange={(val) => name.value = val}
/>
```

#### Select - 选择器

```tsx
const city = useState('');

<Select
  value={city.value}
  options={[
    { label: '北京', value: 'beijing' },
    { label: '上海', value: 'shanghai' },
    { label: '深圳', value: 'shenzhen' },
  ]}
  multiple={false}            // 是否多选
  filterable={true}           // 是否可搜索
  onChange={(val) => city.value = val}
/>
```

#### DatePicker - 日期选择

```tsx
const date = useState(new Date());

<DatePicker
  value={date.value}
  type="date"                 // date | datetime | daterange
  format="YYYY-MM-DD"         // 日期格式
  disabledDate={(date) => date < new Date()}  // 禁用日期
  onChange={(val) => date.value = val as Date}
/>
```

#### Upload - 文件上传

```tsx
const fileList = useState<UploadFile[]>([]);

<Upload
  action="/api/upload"        // 上传地址
  fileList={fileList.value}
  multiple={true}             // 支持多选
  accept=".jpg,.png"          // 接受的文件类型
  beforeUpload={(file) => {
    // 上传前验证
    return file.size < 2 * 1024 * 1024; // 小于 2MB
  }}
  onChange={(files) => fileList.value = files}
/>
```

### 3️⃣ 数据展示组件

#### Table - 表格

```tsx
interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
}

const orders = useState<Order[]>([]);
const columns: ColumnDefinition<Order>[] = [
  { prop: 'orderNo', label: '订单号', width: 120 },
  { 
    prop: 'amount', 
    label: '金额', 
    align: 'right',
    formatter: (row) => `¥${row.amount.toFixed(2)}`,
  },
  { prop: 'status', label: '状态' },
];

<Table<Order>
  data={orders.value}
  columns={columns}
  rowKey="id"
  selection={{                // 多选配置
    type: 'multiple',
    selectedRows: [],
    onChange: (rows) => console.log(rows),
  }}
  pagination={{               // 分页配置
    current: 1,
    pageSize: 10,
    total: 100,
  }}
/>
```

#### Tag - 标签

```tsx
<Tag 
  type="success"              // default | primary | success | warning | danger
  closable={true}             // 可关闭
  onClose={() => console.log('关闭')}
>
  已完成
</Tag>
```

#### Descriptions - 描述列表

```tsx
<Descriptions
  title="订单信息"
  column={3}                  // 一行显示 3 列
  bordered={true}
  items={[
    { label: '订单号', content: 'ORD-001' },
    { label: '客户', content: '张三' },
    { label: '金额', content: '¥1,299.00' },
  ]}
/>
```

### 4️⃣ 反馈组件

#### Modal - 对话框

```tsx
const visible = useState(false);

<Modal
  visible={visible.value}
  title="确认删除"
  onOk={() => {
    // 确认操作
    visible.value = false;
  }}
  onCancel={() => visible.value = false}
>
  <p>确定要删除这条记录吗？</p>
</Modal>
```

#### Message - 消息提示（API 方式）

```tsx
import { Message } from '@ai-builder/std-ui';

// 成功消息
Message.success('操作成功');

// 错误消息
Message.error('操作失败');

// 警告消息
Message.warning('请注意');

// 自定义配置
Message({
  type: 'info',
  message: '这是一条消息',
  duration: 3000,
  closable: true,
});
```

#### Notification - 通知（API 方式）

```tsx
import { Notification } from '@ai-builder/std-ui';

// 成功通知
Notification.success('成功', '订单已创建');

// 错误通知
Notification.error('错误', '网络连接失败');

// 自定义配置
Notification({
  type: 'info',
  title: '系统通知',
  message: '您有一条新消息',
  position: 'top-right',
  duration: 4500,
});
```

#### Loading - 加载提示

```tsx
const loading = useState(false);

<Loading loading={loading.value} text="加载中...">
  {/* 需要显示加载状态的内容 */}
  <div>内容区域</div>
</Loading>

// 全屏加载
<Loading loading={loading.value} fullscreen={true} />
```

### 5️⃣ 导航组件

#### Menu - 菜单

```tsx
const activeKey = useState('home');

<Menu
  items={[
    { key: 'home', label: '首页', icon: <Icon name="home" /> },
    { 
      key: 'orders', 
      label: '订单管理',
      children: [
        { key: 'order-list', label: '订单列表' },
        { key: 'order-create', label: '新建订单' },
      ],
    },
  ]}
  activeKey={activeKey.value}
  mode="vertical"             // horizontal | vertical | inline
  collapsed={false}           // 是否折叠
  onSelect={(key) => activeKey.value = key}
/>
```

#### Tabs - 标签页

```tsx
const activeTab = useState('tab1');

<Tabs
  panes={[
    { key: 'tab1', label: '标签页 1', content: <div>内容 1</div> },
    { key: 'tab2', label: '标签页 2', content: <div>内容 2</div> },
  ]}
  activeKey={activeTab.value}
  type="card"                 // line | card | border-card
  onChange={(key) => activeTab.value = key}
/>
```

#### Breadcrumb - 面包屑

```tsx
<Breadcrumb
  items={[
    { label: '首页', path: '/' },
    { label: '订单管理', path: '/orders' },
    { label: '订单详情', active: true },
  ]}
  separator="/"
  onClick={(item) => console.log(item)}
/>
```

### 6️⃣ 基础组件

#### Button - 按钮

```tsx
<Button 
  type="primary"              // default | primary | success | warning | danger
  size="default"              // large | default | small
  loading={loading.value}     // 加载状态
  disabled={false}            // 禁用状态
  danger={false}              // 危险按钮（红色）
  onClick={handleClick}
>
  提交
</Button>
```

#### Icon - 图标

```tsx
<Icon 
  name="user"                 // 图标名称
  size="large"                // large | default | small | 数字 | 字符串
  color="#1890ff"             // 图标颜色
  spin={false}                // 是否旋转
  onClick={() => console.log('点击图标')}
/>
```

#### Link - 链接

```tsx
<Link 
  href="/about"
  type="primary"              // default | primary | success | warning | danger
  underline={true}            // 是否显示下划线
  target="_blank"             // _blank | _self | _parent | _top
  icon={<Icon name="link" />}
>
  了解更多
</Link>
```

## 🎨 完整示例

查看 `examples/order-management/src/views/CompleteExample.view.tsx` 获取完整的组合使用示例。

## 📚 进阶用法

### 泛型支持

```tsx
// Table 泛型
interface Product { id: string; name: string; price: number; }
<Table<Product> data={products} columns={columns} />

// Form 泛型
interface LoginForm { username: string; password: string; }
<Form<LoginForm> model={form} rules={rules} />

// Select 泛型
<Select<string> value={city} options={cityOptions} />
```

### 响应式布局

```tsx
<Row gutter={16}>
  <Col 
    xs={24}    // <576px  - 手机
    sm={12}    // ≥576px  - 平板
    md={8}     // ≥768px  - 小屏电脑
    lg={6}     // ≥992px  - 中屏电脑
    xl={4}     // ≥1200px - 大屏电脑
    xxl={3}    // ≥1600px - 超大屏
  >
    响应式内容
  </Col>
</Row>
```

### 表单验证

```tsx
<Form
  model={form.value}
  rules={{
    username: [
      { required: true, message: '请输入用户名' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符' },
      { pattern: /^[a-zA-Z0-9]+$/, message: '只能包含字母和数字' },
    ],
    email: [
      { required: true, message: '请输入邮箱' },
      { type: 'email', message: '请输入有效的邮箱地址' },
    ],
    age: [
      { 
        validator: (rule, value, callback) => {
          if (value < 18) {
            callback(new Error('年龄必须大于 18 岁'));
          } else {
            callback();
          }
        },
      },
    ],
  }}
>
  {/* 表单项 */}
</Form>
```

## 🔧 编译配置

这些虚拟组件需要通过编译器转换为具体的 UI 库实现：

```typescript
// compiler.config.ts
export default {
  ui: {
    target: 'element-plus',  // 或 'ant-design'
    mapping: {
      Button: 'el-button',
      Table: 'el-table',
      // ... 其他映射
    },
  },
};
```

## 📖 类型导出

```typescript
// 导入所有类型
import type {
  // 布局
  PageProps, CardProps, RowProps, ColProps,
  // 表单
  FormProps, InputProps, SelectProps, DatePickerProps, UploadProps,
  // 数据展示
  TableProps, ColumnDefinition, TagProps, DescriptionsProps,
  // 反馈
  ModalProps, MessageOptions, LoadingProps, NotificationOptions,
  // 导航
  MenuProps, TabsProps, BreadcrumbProps,
  // 基础
  ButtonProps, IconProps, LinkProps,
  // 公共类型
  Size, ButtonType, Children, FormRule,
} from '@ai-builder/std-ui';
```

## 💡 最佳实践

1. **使用类型推导**：让 TypeScript 自动推导类型
2. **组件组合**：将复杂组件拆分为小组件
3. **状态管理**：合理使用 `useState` 和 `useComputed`
4. **事件处理**：统一的事件命名和处理方式
5. **响应式设计**：使用栅格系统实现响应式布局

## 🚀 下一步

- 查看完整示例：`examples/order-management/`
- 阅读架构文档：`TS_Based_MDA_Architecture.md`
- 了解 DSL API：`packages/dsl/README.md`





