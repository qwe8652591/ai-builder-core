# Implementation Plan: UI DSL 层实现

**Branch**: `003-ui-dsl-implementation` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)

## Summary

实现 ai-builder 的前端 UI DSL 层，包括两个核心包：

1. **`@ai-builder/dsl/ui`** - 逻辑原语层：提供跨框架的响应式能力、生命周期抽象、路由和服务调用封装，抹平 Vue 3 和 React 的差异
2. **`@ai-builder/dsl/std-ui`** - 标准 UI 组件协议层：定义框架无关的虚组件接口（Page, Table, Form, Button 等），编译时根据目标框架和 UI 库自动替换为具体实现

**技术方法**: 采用函数式组件风格（对标 Vue 3 Composition API 和 React Hooks），通过 TypeScript 类型系统提供完整的类型推导和智能提示。所有 API 仅作为类型定义和接口规范，具体实现由编译器在生成目标代码时注入。

## Technical Context

**Language/Version**: TypeScript 5.0+  
**Primary Dependencies**: 
- 无运行时依赖（纯类型定义包）
- 开发依赖：`typescript`, `@types/node`

**Storage**: N/A（不涉及持久化）  
**Testing**: Vitest（类型测试 + 示例代码验证）  
**Target Platform**: 
- 编译目标：Vue 3.3+ / React 18+
- 浏览器：现代浏览器（支持 ES2020+ 和 Proxy）

**Project Type**: Monorepo 包（`packages/dsl/src/ui/**` 和独立 `packages/std-ui/**`）  
**Performance Goals**: 
- 类型检查时间 < 3s（对于包含 1000+ 组件的项目）
- IDE 智能提示响应 < 100ms
- 编译器解析 UI DSL 文件速度 > 10 files/s

**Constraints**: 
- 必须保持与 `@ai-builder/dsl` 核心包的版本兼容
- 必须与 Vue 3 Composition API 和 React Hooks 的 API 命名保持一致
- 类型定义必须足够精确以支持泛型推导，但不能过于复杂导致 IDE 卡顿
- 标准组件接口必须覆盖 Element Plus 和 Ant Design 90% 的常用组件

**Scale/Scope**: 
- 预计支持 30+ 标准 UI 组件
- 预计 15+ 逻辑原语 API
- 目标：单个 ERP 项目包含 200+ 页面时仍保持良好的类型检查性能

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 架构约束检查

#### ✅ DSL 分层约束
- **符合**: UI DSL 属于 DSL 层的扩展，不引入新的架构层级
- **验证**: `packages/dsl/src/ui/` 和 `packages/std-ui/` 都位于 DSL 包内，不违反分层原则

#### ✅ 依赖方向
- **符合**: UI DSL 仅依赖 `@ai-builder/dsl` 核心包，不依赖 runtime 或 compiler
- **验证**: 将在 `package.json` 中明确 `peerDependencies` 为 `@ai-builder/dsl`

#### ✅ 纯类型定义
- **符合**: UI DSL 包仅提供 TypeScript 类型定义和接口，无运行时逻辑
- **验证**: 所有导出的 API 都是 `interface`、`type` 或函数签名，函数体为 `throw new Error('Runtime not implemented')`

#### ✅ 编译器契约
- **符合**: UI DSL 的实现细节由编译器负责，DSL 包只定义契约
- **验证**: 将在文档中明确说明这是编译期 DSL，开发者不应依赖运行时行为

#### ⚠️ 复杂度控制
- **风险**: TypeScript 类型系统可能因为过度泛型化导致复杂度爆炸
- **缓解**: 
  1. 限制泛型嵌套深度不超过 3 层
  2. 为复杂类型提供简化版别名（如 `SimpleState<T>` vs `ReactiveState<T, Dependencies>`）
  3. 使用 `@ts-ignore` + 注释明确标记性能关键区域的类型简化

### 命名规范检查

#### ✅ 文件命名
- **符合**: UI DSL 包位于 `packages/dsl/src/ui/`，子模块按功能分类
- **结构**:
  ```
  packages/dsl/src/ui/
  ├── index.ts           # 主导出
  ├── reactive.ts        # useState, useComputed, useWatch
  ├── lifecycle.ts       # useEffect, onMounted, onUnmounted
  ├── component.ts       # definePage, defineComponent
  ├── router.ts          # useRouter, useRoute, useParams
  └── query.ts           # useQuery, useMutation
  ```

#### ✅ API 命名
- **符合**: 所有 API 采用 `use*` 前缀（Hooks 约定）或 `define*` 前缀（定义器约定）
- **示例**: `useState`, `useComputed`, `definePage`, `defineComponent`

#### ✅ 导出规范
- **符合**: 通过 `packages/dsl/src/index.ts` 统一导出：
  ```typescript
  export * from './ui';
  export * as UI from './ui';
  ```

### ESLint 规则检查

#### ✅ 分层引用约束
- **符合**: UI DSL 文件（`*.ui.ts`）可以引用 core DSL，但不能引用 runtime 或 compiler
- **验证**: 将在 `.eslintrc.js` 中添加 `ui.ts` 文件的引用约束规则

#### ✅ 实现约束
- **符合**: UI DSL 文件禁止包含实现逻辑，只能是类型定义
- **验证**: 通过 ESLint 自定义规则检测函数体内容（除了 `throw new Error` 外不能有其他语句）

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-dsl-implementation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - 响应式系统和组件协议设计研究
├── data-model.md        # Phase 1 output - UI DSL 的类型系统和接口契约
├── quickstart.md        # Phase 1 output - UI DSL 快速上手指南
├── contracts/           # Phase 1 output - API 契约和类型定义示例
│   ├── reactive-api.md  # 响应式 API 契约
│   ├── lifecycle-api.md # 生命周期 API 契约
│   ├── component-api.md # 组件定义 API 契约
│   └── std-ui-api.md    # 标准组件协议契约
├── checklists/
│   └── requirements.md  # 规范质量检查清单（已完成）
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── dsl/
│   ├── src/
│   │   ├── ui/                    # 🆕 UI 逻辑原语包
│   │   │   ├── index.ts           # UI 模块主导出
│   │   │   ├── reactive.ts        # useState, useComputed, useWatch
│   │   │   ├── lifecycle.ts       # useEffect, onMounted, onUnmounted
│   │   │   ├── component.ts       # definePage, defineComponent
│   │   │   ├── router.ts          # useRouter, useRoute, useParams
│   │   │   ├── query.ts           # useQuery, useMutation
│   │   │   └── types.ts           # UI 层的公共类型定义
│   │   │
│   │   ├── decorators/            # 现有：实体和服务装饰器
│   │   ├── primitives/            # 现有：Decimal, Repo 等
│   │   ├── types/                 # 现有：Command, View, Query 等
│   │   └── index.ts               # 🔄 更新：导出 ui 模块
│   │
│   ├── tests/
│   │   └── ui/                    # 🆕 UI DSL 测试
│   │       ├── reactive.test.ts   # 响应式 API 类型测试
│   │       ├── lifecycle.test.ts  # 生命周期 API 类型测试
│   │       ├── component.test.ts  # 组件定义 API 类型测试
│   │       └── integration.test.ts # 完整示例代码验证
│   │
│   ├── package.json               # 🔄 更新：添加 ui 相关导出路径
│   └── tsconfig.json              # 现有配置
│
├── std-ui/                        # 🆕 标准 UI 组件协议包
│   ├── src/
│   │   ├── index.ts               # 主导出
│   │   ├── layout/                # 布局组件协议
│   │   │   ├── Page.ts            # Page 组件接口
│   │   │   ├── Card.ts            # Card 组件接口
│   │   │   ├── Row.ts             # Row 组件接口
│   │   │   └── Col.ts             # Col 组件接口
│   │   │
│   │   ├── form/                  # 表单组件协议
│   │   │   ├── Form.ts            # Form 组件接口
│   │   │   ├── Input.ts           # Input 组件接口
│   │   │   ├── Select.ts          # Select 组件接口
│   │   │   ├── DatePicker.ts      # DatePicker 组件接口
│   │   │   └── Upload.ts          # Upload 组件接口
│   │   │
│   │   ├── data/                  # 数据展示组件协议
│   │   │   ├── Table.ts           # Table 组件接口
│   │   │   ├── Pagination.ts      # Pagination 组件接口
│   │   │   ├── Tag.ts             # Tag 组件接口
│   │   │   └── Descriptions.ts    # Descriptions 组件接口
│   │   │
│   │   ├── feedback/              # 反馈组件协议
│   │   │   ├── Modal.ts           # Modal 组件接口
│   │   │   ├── Message.ts         # Message 组件接口
│   │   │   ├── Loading.ts         # Loading 组件接口
│   │   │   └── Notification.ts    # Notification 组件接口
│   │   │
│   │   ├── navigation/            # 导航组件协议
│   │   │   ├── Menu.ts            # Menu 组件接口
│   │   │   ├── Tabs.ts            # Tabs 组件接口
│   │   │   └── Breadcrumb.ts      # Breadcrumb 组件接口
│   │   │
│   │   ├── basic/                 # 基础组件协议
│   │   │   ├── Button.ts          # Button 组件接口
│   │   │   ├── Icon.ts            # Icon 组件接口
│   │   │   └── Link.ts            # Link 组件接口
│   │   │
│   │   └── types.ts               # 公共类型定义（Props 基类等）
│   │
│   ├── tests/
│   │   └── type-check.test.ts    # 类型兼容性测试
│   │
│   ├── package.json               # 包定义
│   ├── tsconfig.json              # TypeScript 配置
│   ├── README.md                  # 使用文档
│   └── .gitignore
│
├── runtime/                       # 现有：运行时包（暂不涉及）
├── eslint-plugin/                 # 现有：ESLint 插件
└── ...

examples/
└── order-management/
    └── src/
        ├── domain/                # 现有：实体和领域逻辑
        ├── application/           # 现有：应用服务
        └── views/                 # 🆕 UI DSL 示例
            ├── OrderList.view.tsx # 订单列表页面示例
            ├── OrderDetail.view.tsx # 订单详情页面示例
            └── components/        # 可复用组件示例
                └── OrderStatus.tsx

.eslintrc.js                       # 🔄 更新：添加 ui.ts 文件的约束规则
```

**Structure Decision**: 

选择 **Monorepo 多包结构**，理由：

1. **`packages/dsl/src/ui/`**: 作为 `@ai-builder/dsl` 包的子模块，通过 `@ai-builder/dsl/ui` 路径导出，保持与核心 DSL 的版本一致性
2. **`packages/std-ui/`**: 作为独立包 `@ai-builder/dsl/std-ui`，可以独立版本管理，因为标准组件协议的变化频率可能与核心 DSL 不同
3. **示例项目**: 在 `examples/order-management` 中添加 `views/` 目录，演示 UI DSL 的实际使用

这种结构的优势：
- 清晰的职责分离（逻辑原语 vs 组件协议）
- 支持独立版本管理（`std-ui` 可以更频繁更新而不影响核心）
- 便于编译器识别和处理（通过 import 路径区分）

## Complexity Tracking

无需填写 - 本特性符合所有架构约束，未引入额外复杂度。

---

## Phase 0: Research

**Status**: 🔄 待执行  
**Output**: `research.md`

### 研究目标

1. **响应式系统设计模式**
   - 研究 Vue 3 Reactivity API 的实现原理（Proxy-based, effect tracking, scheduler）
   - 研究 React Hooks 的实现原理（fiber reconciliation, dependency arrays, state batching）
   - 分析两者的差异点和统一抽象的可能性
   - 产出：响应式系统的统一接口设计和编译策略

2. **组件模型对比分析**
   - 对比 Vue 3 的 `defineComponent + setup` 和 React 的函数组件 + Hooks
   - 分析 props 传递、事件处理、插槽/children 的差异
   - 产出：统一的组件定义接口和编译时转换规则

3. **UI 组件库 API 差异**
   - 对比 Element Plus 和 Ant Design 的常用组件 API
   - 识别可以统一抽象的部分和必须特殊处理的部分
   - 产出：标准组件协议设计和映射配置格式

4. **类型系统设计**
   - 研究 TypeScript 泛型推导的最佳实践（避免过度复杂）
   - 分析 Vue 3 和 React 的类型定义文件，学习其类型技巧
   - 产出：UI DSL 的类型定义策略和泛型边界

5. **性能优化策略**
   - 研究大型项目中的类型检查性能瓶颈
   - 分析响应式系统的性能优化技术（浅层响应式、批量更新）
   - 产出：性能目标和优化指南

### 研究方法

- 阅读 Vue 3 和 React 的官方文档和源码（重点关注 `@vue/reactivity` 和 `react-reconciler`）
- 分析 Element Plus 和 Ant Design 的组件 Props 定义（至少覆盖 30 个常用组件）
- 创建 POC（Proof of Concept）项目验证统一抽象的可行性
- 参考业界类似项目（如 Solid.js, Svelte）的设计思路

### 交付物

- `research.md`: 详细的研究报告，包含：
  - 响应式系统设计方案（含伪代码）
  - 组件模型统一抽象方案（含示例）
  - 标准组件协议初稿（覆盖 10+ 核心组件）
  - 类型系统设计草案（含类型定义示例）
  - 性能优化策略清单

---

## Phase 1: Design

**Status**: ⏳ 待 Phase 0 完成  
**Output**: `data-model.md`, `quickstart.md`, `contracts/`

### 设计目标

基于 Phase 0 的研究成果，设计 UI DSL 的完整 API 和类型契约。

### 1. 数据模型设计 (`data-model.md`)

**内容**:

#### 1.1 响应式系统类型定义

```typescript
// 核心类型
interface ReactiveState<T> {
  readonly value: T;
  value: T; // setter
}

interface ComputedState<T> {
  readonly value: T;
}

interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
}

// API 签名
function useState<T>(initialValue: T): ReactiveState<T>;
function useState<T>(): ReactiveState<T | undefined>;

function useComputed<T>(getter: () => T): ComputedState<T>;

function useWatch<T>(
  source: ReactiveState<T> | ComputedState<T> | (() => T),
  callback: (newValue: T, oldValue: T) => void,
  options?: WatchOptions
): () => void; // 返回停止监听的函数
```

#### 1.2 组件模型类型定义

```typescript
// 页面元数据
interface PageMeta {
  route: string;
  title: string;
  permission?: string;
  menu?: {
    parent?: string;
    order?: number;
    icon?: string;
  };
}

// 组件 Props 定义
interface ComponentOptions<P = {}> {
  props?: PropDefinition<P>;
  emits?: EmitDefinition;
}

// API 签名
function definePage<P = {}>(
  meta: PageMeta,
  setup: (props: P) => () => JSX.Element
): Component<P>;

function defineComponent<P = {}>(
  options: ComponentOptions<P>,
  setup: (props: P) => () => JSX.Element
): Component<P>;
```

#### 1.3 生命周期钩子类型定义

```typescript
// 副作用选项
interface EffectOptions {
  onCleanup?: (fn: () => void) => void;
}

// API 签名
function useEffect(
  effect: (onCleanup: (fn: () => void) => void) => void | Promise<void>,
  deps?: readonly any[]
): void;

function onMounted(callback: () => void): void;
function onUnmounted(callback: () => void): void;
function onBeforeMount(callback: () => void): void;
function onBeforeUnmount(callback: () => void): void;
```

#### 1.4 路由与导航类型定义

```typescript
// 路由接口
interface Router {
  push(path: string): Promise<void>;
  replace(path: string): Promise<void>;
  back(): void;
  go(n: number): void;
}

interface Route {
  path: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  meta: Record<string, any>;
}

// API 签名
function useRouter(): Router;
function useRoute(): Readonly<Route>;
function useParams<T extends Record<string, string>>(): T;
```

#### 1.5 服务调用类型定义

```typescript
// 查询选项
interface QueryOptions<TData, TError = Error> {
  enabled?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retry?: number | boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

// 查询结果
interface QueryResult<TData, TError = Error> {
  data: ComputedState<TData | undefined>;
  error: ComputedState<TError | null>;
  loading: ComputedState<boolean>;
  refetch: () => Promise<void>;
}

// 变更选项
interface MutationOptions<TData, TVariables, TError = Error> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

// 变更结果
interface MutationResult<TData, TVariables, TError = Error> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: ComputedState<boolean>;
  error: ComputedState<TError | null>;
  data: ComputedState<TData | undefined>;
  reset: () => void;
}

// API 签名
function useQuery<TData, TError = Error>(
  queryFn: () => Promise<TData>,
  options?: QueryOptions<TData, TError>
): QueryResult<TData, TError>;

function useMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables, TError>
): MutationResult<TData, TVariables, TError>;
```

### 2. 快速开始指南 (`quickstart.md`)

**内容**:

- 安装和配置（`pnpm add @ai-builder/dsl`）
- 第一个响应式组件（计数器示例）
- 使用计算属性
- 定义页面和路由
- 调用后端服务
- 使用标准 UI 组件
- 完整的 CRUD 页面示例

**示例代码**:

```typescript
// OrderList.view.tsx
import { definePage, useState, useComputed, useEffect } from '@ai-builder/dsl/ui';
import { Page, Table, Button } from '@ai-builder/dsl/std-ui';
import { OrderService } from '../application/Order.app';

export default definePage({
  route: '/orders',
  title: '订单列表',
  permission: 'order:list'
}, () => {
  // 状态
  const orders = useState<Order[]>([]);
  const loading = useState(false);
  const selectedIds = useState<string[]>([]);

  // 计算属性
  const selectedCount = useComputed(() => selectedIds.value.length);

  // 副作用：加载数据
  useEffect(async () => {
    loading.value = true;
    try {
      orders.value = await OrderService.getList();
    } finally {
      loading.value = false;
    }
  }, []);

  // 事件处理
  const handleDelete = async () => {
    await OrderService.batchDelete(selectedIds.value);
    // 刷新列表
  };

  // 渲染
  return () => (
    <Page loading={loading.value}>
      <Table 
        data={orders.value} 
        selection={selectedIds}
        columns={[
          { prop: 'orderNo', label: '订单号' },
          { prop: 'customer', label: '客户' },
          { prop: 'totalAmount', label: '金额' }
        ]}
      />
      <div>
        已选择 {selectedCount.value} 项
        <Button onClick={handleDelete} disabled={selectedCount.value === 0}>
          批量删除
        </Button>
      </div>
    </Page>
  );
});
```

### 3. API 契约文档 (`contracts/`)

为每个子模块创建详细的 API 契约文档：

#### 3.1 `reactive-api.md`
- `useState` 完整签名和行为规范
- `useComputed` 完整签名和缓存策略
- `useWatch` 完整签名和触发时机
- 类型推导示例
- 编译器实现要求

#### 3.2 `lifecycle-api.md`
- `useEffect` 完整签名和执行顺序
- 生命周期钩子列表和触发时机
- 清理函数的行为规范
- Vue/React 编译差异说明

#### 3.3 `component-api.md`
- `definePage` 完整签名和元数据结构
- `defineComponent` 完整签名和 Props 约定
- setup 函数的执行时机和参数
- 渲染函数的返回值规范

#### 3.4 `std-ui-api.md`
- 每个标准组件的 Props 接口定义
- 事件回调的命名约定
- 插槽的使用规范
- 编译时组件映射配置格式

### 交付物

- `data-model.md`: 完整的类型定义和接口契约
- `quickstart.md`: 5 分钟快速上手指南
- `contracts/`: 4 个详细的 API 契约文档
- `examples/order-management/src/views/`: 至少 2 个完整的示例页面

---

## Phase 2: Implementation

**Status**: ⏳ 待 Phase 1 完成  
**Output**: 由 `/speckit.tasks` 命令生成 `tasks.md`

### 实施策略

Phase 2 将由 `/speckit.tasks` 命令自动生成详细的任务分解，预期的实施顺序：

1. **Setup**: 创建包结构和配置文件
2. **Core Reactive**: 实现 `useState`, `useComputed`, `useWatch` 类型定义
3. **Lifecycle**: 实现 `useEffect`, `onMounted` 等钩子类型定义
4. **Component**: 实现 `definePage`, `defineComponent` 类型定义
5. **Router**: 实现路由相关 API 类型定义
6. **Query**: 实现 `useQuery`, `useMutation` 类型定义
7. **Std-UI Core**: 实现核心标准组件接口（Page, Table, Form, Button）
8. **Std-UI Extended**: 实现扩展标准组件接口（其他 20+ 组件）
9. **Testing**: 编写类型测试和示例验证
10. **Documentation**: 完善 README 和 API 文档
11. **Integration**: 在示例项目中验证完整流程

### 质量门禁

每个实施阶段完成后必须通过：

1. **类型检查**: `tsc --noEmit` 无错误
2. **类型测试**: Vitest 类型断言全部通过
3. **示例验证**: 至少一个示例代码可以正确编译（虽然运行时会报错，但类型检查通过）
4. **文档同步**: API 变更必须同步更新契约文档

---

## Dependencies & Risks

### 依赖项

1. **前置依赖**:
   - ✅ `@ai-builder/dsl` 核心包已完成（001-dsl-core-package）
   - ✅ `@ai-builder/runtime` 核心包已完成（002-runtime-core）
   - ⏳ ESLint 插件支持 `.view.tsx` 文件约束（可并行开发）

2. **外部依赖**:
   - TypeScript 5.0+ （已满足）
   - Vitest 测试框架（已满足）
   - Element Plus 和 Ant Design 文档（公开可访问）

### 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| TypeScript 类型推导性能瓶颈 | 高 | 中 | Phase 0 进行性能测试，必要时简化泛型 |
| Vue/React 差异无法完全抹平 | 中 | 高 | 在契约文档中明确差异，提供条件编译支持 |
| UI 库版本升级导致接口变化 | 中 | 中 | 明确支持的 UI 库版本范围，提供版本检查工具 |
| 标准组件协议覆盖不足 | 低 | 中 | 优先覆盖 90% 常用场景，剩余 10% 允许使用原生组件 |
| 学习曲线过陡 | 低 | 低 | 提供丰富的示例和分步教程，API 命名与 Vue/React 一致 |

---

## Success Metrics

Phase 0-2 完成后，必须满足以下指标才能视为成功：

1. **功能完整性**:
   - ✅ 实现规范中定义的 15+ 逻辑原语 API
   - ✅ 实现规范中定义的 30+ 标准 UI 组件接口
   - ✅ 所有 API 有完整的 TypeScript 类型定义

2. **质量指标**:
   - ✅ 类型推导覆盖率 > 95%（通过类型测试验证）
   - ✅ 示例项目编译通过（类型检查无错误）
   - ✅ 契约文档与实现 100% 一致

3. **性能指标**:
   - ✅ 包含 200 个页面的项目类型检查时间 < 5s
   - ✅ VSCode 智能提示响应 < 100ms

4. **可用性指标**:
   - ✅ 至少 2 个完整的示例页面可运行（在仿真环境）
   - ✅ Quickstart 文档可在 10 分钟内完成演练
   - ✅ API 命名与 Vue 3/React 保持 90% 一致性

---

## Next Steps

1. **立即执行**: 本计划已自动创建 Phase 0 研究文档框架
2. **开发者行动**: 
   - 阅读本计划文档
   - 开始 Phase 0 研究（预计 2-3 天）
   - 完成后执行 `/speckit.tasks` 生成详细任务列表
3. **里程碑**:
   - Phase 0 完成: 2025-12-10
   - Phase 1 完成: 2025-12-15
   - Phase 2 完成: 2025-12-25（圣诞节前交付 🎄）





