# Tasks: UI DSL 层实现

**Input**: Design documents from `/specs/003-ui-dsl-implementation/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories)  
**Branch**: `003-ui-dsl-implementation`

**Tests**: 本特性包含类型测试，用于验证 TypeScript 类型定义的正确性。

**Organization**: 任务按用户故事组织，使每个故事可以独立实现和测试。由于本特性是纯类型定义包（无运行时实现），重点在类型系统和接口设计上。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（如 US1, US2, US3）
- 包含精确的文件路径

## Path Conventions

基于 plan.md 中的项目结构：

- **@ai-builder/dsl/ui**: `packages/dsl/src/ui/`
- **@ai-builder/dsl/std-ui**: `packages/std-ui/src/`
- **Tests**: `packages/dsl/tests/ui/`, `packages/std-ui/tests/`
- **Examples**: `examples/order-management/src/views/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 创建包结构和配置文件

- [x] T001 创建 UI DSL 源码目录结构 `packages/dsl/src/ui/`
- [x] T002 [P] 创建标准组件协议包目录结构 `packages/std-ui/src/`
- [x] T003 [P] 创建 UI DSL 测试目录 `packages/dsl/tests/ui/`
- [x] T004 配置 `packages/dsl/package.json` 添加 `exports` 字段支持 `/ui` 子路径导出
- [x] T005 [P] 创建 `packages/std-ui/package.json` 定义独立包
- [x] T006 [P] 配置 `packages/std-ui/tsconfig.json` 继承根 tsconfig
- [x] T007 [P] 创建 `packages/std-ui/README.md` 使用文档框架
- [x] T008 更新根 `pnpm-workspace.yaml` 包含 `packages/std-ui`
- [x] T009 [P] 创建示例项目视图目录 `examples/order-management/src/views/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心类型定义，所有用户故事依赖的基础设施

**⚠️ CRITICAL**: 必须完成此阶段后才能开始用户故事实现

- [x] T010 创建 UI 层公共类型文件 `packages/dsl/src/ui/types.ts` 定义 Symbol 标记和基础接口
- [x] T011 [P] 创建标准组件公共类型文件 `packages/std-ui/src/types.ts` 定义 Props 基类和事件类型
- [x] T012 [P] 配置 Vitest 测试框架支持类型测试 `packages/dsl/vitest.config.ts`
- [x] T013 更新 `.eslintrc.js` 添加 UI DSL 文件（`*.ui.ts`, `*.view.tsx`）的引用约束规则
- [x] T014 [P] 创建 `packages/dsl/src/ui/index.ts` 主导出文件
- [x] T015 [P] 创建 `packages/std-ui/src/index.ts` 主导出文件

**Checkpoint**: 基础结构就绪 - 用户故事实现可以并行开始

---

## Phase 3: User Story 1 - 基础响应式状态管理 (Priority: P1) 🎯 MVP

**Goal**: 实现 `useState` API，支持响应式状态的读写和自动更新通知

**Independent Test**: 创建计数器组件示例，使用 `useState(0)` 定义状态，验证类型推导和 `.value` 读写语法

### Implementation for User Story 1

- [x] T016 [P] [US1] 定义 `ReactiveState<T>` 接口在 `packages/dsl/src/ui/types.ts`，包含 `value` getter/setter 和响应式标记
- [x] T017 [P] [US1] 实现 `useState` 函数签名和类型定义在 `packages/dsl/src/ui/reactive.ts`
- [x] T018 [P] [US1] 添加 `useState` 函数重载支持可选初始值 `useState<T>()` 和 `useState<T>(initialValue)`
- [x] T019 [US1] 在 `packages/dsl/src/ui/index.ts` 中导出 `useState` 和 `ReactiveState`
- [x] T020 [US1] 更新 `packages/dsl/src/index.ts` 添加 `export * from './ui';` 和 `export * as UI from './ui';`
- [x] T021 [P] [US1] 编写类型测试 `packages/dsl/tests/ui/reactive.test.ts` 验证 `useState` 类型推导
- [x] T022 [US1] 添加 `useState` JSDoc 文档注释，说明这是编译期 DSL
- [x] T023 [US1] 创建计数器示例 `examples/order-management/src/views/Counter.view.tsx` 验证 API 可用性

**Checkpoint**: `useState` API 完成，可以定义和使用响应式状态

---

## Phase 4: User Story 2 - 计算属性与依赖追踪 (Priority: P1)

**Goal**: 实现 `useComputed` 和 `useWatch` API，支持自动依赖追踪和计算属性缓存

**Independent Test**: 创建购物车总价计算示例，`totalPrice` 依赖 `items` 数组自动重新计算

### Implementation for User Story 2

- [x] T024 [P] [US2] 定义 `ComputedState<T>` 接口在 `packages/dsl/src/ui/types.ts`，只读的响应式状态
- [x] T025 [P] [US2] 定义 `WatchOptions` 接口在 `packages/dsl/src/ui/types.ts`，包含 `immediate`, `deep` 选项
- [x] T026 [P] [US2] 实现 `useComputed` 函数签名在 `packages/dsl/src/ui/reactive.ts`，接收 getter 函数返回 `ComputedState`
- [x] T027 [P] [US2] 实现 `useWatch` 函数签名在 `packages/dsl/src/ui/reactive.ts`，支持监听状态变化
- [x] T028 [US2] 在 `packages/dsl/src/ui/index.ts` 中导出 `useComputed`, `useWatch`, `ComputedState`, `WatchOptions`
- [x] T029 [P] [US2] 编写类型测试 `packages/dsl/tests/ui/reactive.test.ts` 验证 `useComputed` 泛型推导
- [x] T030 [P] [US2] 编写类型测试验证 `useWatch` 的 source 和 callback 类型兼容性
- [x] T031 [US2] 添加 JSDoc 文档注释，说明依赖追踪和缓存策略（由编译器实现）
- [x] T032 [US2] 创建购物车示例 `examples/order-management/src/views/CartExample.view.tsx` 演示计算属性

**Checkpoint**: 计算属性和监听器 API 完成，形成完整的响应式系统

---

## Phase 5: User Story 3 - 页面与组件定义 (Priority: P1)

**Goal**: 实现 `definePage` 和 `defineComponent` API，支持页面路由、权限和组件 Props 定义

**Independent Test**: 创建用户列表页面，使用 `definePage` 定义路由和权限，验证元数据类型检查

### Implementation for User Story 3

- [x] T033 [P] [US3] 定义 `PageMeta` 接口在 `packages/dsl/src/ui/types.ts`，包含 `route`, `title`, `permission`, `menu` 字段
- [x] T034 [P] [US3] 定义 `ComponentOptions<P>` 接口在 `packages/dsl/src/ui/types.ts`，包含 `props`, `emits` 定义
- [x] T035 [P] [US3] 定义 `Component<P>` 类型和 `RenderFunction` 类型在 `packages/dsl/src/ui/types.ts`
- [x] T036 [P] [US3] 实现 `definePage` 函数签名在 `packages/dsl/src/ui/component.ts`，接收元数据和 setup 函数
- [x] T037 [P] [US3] 实现 `defineComponent` 函数签名在 `packages/dsl/src/ui/component.ts`，支持 Props 泛型推导
- [x] T038 [US3] 在 `packages/dsl/src/ui/index.ts` 中导出组件定义相关 API
- [x] T039 [P] [US3] 编写类型测试 `packages/dsl/tests/ui/component.test.ts` 验证 `definePage` 元数据类型
- [x] T040 [P] [US3] 编写类型测试验证 `defineComponent` 的 Props 类型推导
- [x] T041 [US3] 添加 JSDoc 文档注释，说明 setup 函数执行时机和返回值规范
- [x] T042 [US3] 创建订单列表页面示例 `examples/order-management/src/views/OrderList.view.tsx` 演示 `definePage` 用法
- [x] T043 [US3] 创建可复用组件示例 `examples/order-management/src/views/components/OrderStatus.tsx` 演示 `defineComponent`

**Checkpoint**: 页面和组件定义 API 完成，形成完整的 P1 MVP（响应式 + 组件模型）

---

## Phase 6: User Story 4 - 副作用与生命周期 (Priority: P2)

**Goal**: 实现 `useEffect`, `onMounted`, `onUnmounted` 等生命周期钩子 API

**Independent Test**: 创建数据加载组件，在 `useEffect` 中加载数据，验证依赖数组和清理函数类型

### Implementation for User Story 4

- [x] T044 [P] [US4] 定义 `EffectCallback` 和 `CleanupFunction` 类型在 `packages/dsl/src/ui/types.ts`
- [x] T045 [P] [US4] 定义 `DependencyList` 类型在 `packages/dsl/src/ui/types.ts`，表示只读的依赖数组
- [x] T046 [P] [US4] 实现 `useEffect` 函数签名在 `packages/dsl/src/ui/lifecycle.ts`，支持异步副作用和依赖数组
- [x] T047 [P] [US4] 实现 `onMounted` 函数签名在 `packages/dsl/src/ui/lifecycle.ts`
- [x] T048 [P] [US4] 实现 `onUnmounted` 函数签名在 `packages/dsl/src/ui/lifecycle.ts`
- [x] T049 [P] [US4] 实现 `onBeforeMount` 和 `onBeforeUnmount` 函数签名在 `packages/dsl/src/ui/lifecycle.ts`
- [x] T050 [US4] 在 `packages/dsl/src/ui/index.ts` 中导出生命周期钩子 API
- [x] T051 [P] [US4] 编写类型测试 `packages/dsl/tests/ui/lifecycle.test.ts` 验证 `useEffect` 的 async 支持
- [x] T052 [P] [US4] 编写类型测试验证清理函数的类型签名
- [x] T053 [US4] 添加 JSDoc 文档注释，说明 Vue/React 编译差异和执行时机
- [x] T054 [US4] 更新订单列表示例 `examples/order-management/src/views/OrderList.view.tsx` 添加数据加载副作用

**Checkpoint**: 生命周期 API 完成，支持复杂的副作用管理

---

## Phase 7: User Story 5 - 标准 UI 组件协议 (Priority: P2)

**Goal**: 实现 30+ 标准 UI 组件的框架无关接口定义（Page, Table, Form, Button 等）

**Independent Test**: 编写包含 Table 和 Button 的 DSL 页面，验证 Props 类型检查和事件回调类型

### Implementation for User Story 5

#### 布局组件

- [x] T055 [P] [US5] 定义 `PageProps` 接口在 `packages/std-ui/src/layout/Page.ts`，包含 `loading`, `title` 等属性
- [x] T056 [P] [US5] 定义 `CardProps` 接口在 `packages/std-ui/src/layout/Card.ts`
- [x] T057 [P] [US5] 定义 `RowProps` 和 `ColProps` 接口在 `packages/std-ui/src/layout/Row.ts` 和 `Col.ts`
- [x] T058 [US5] 在 `packages/std-ui/src/index.ts` 中导出布局组件，创建 JSX 声明

#### 表单组件

- [x] T059 [P] [US5] 定义 `FormProps` 接口在 `packages/std-ui/src/form/Form.ts`，包含 `model`, `rules` 属性
- [x] T060 [P] [US5] 定义 `InputProps` 接口在 `packages/std-ui/src/form/Input.ts`
- [x] T061 [P] [US5] 定义 `SelectProps` 接口在 `packages/std-ui/src/form/Select.ts`，支持 options 数组
- [x] T062 [P] [US5] 定义 `DatePickerProps` 接口在 `packages/std-ui/src/form/DatePicker.ts`
- [x] T063 [P] [US5] 定义 `UploadProps` 接口在 `packages/std-ui/src/form/Upload.ts`
- [x] T064 [US5] 在 `packages/std-ui/src/index.ts` 中导出表单组件

#### 数据展示组件

- [x] T065 [P] [US5] 定义 `TableProps<T>` 泛型接口在 `packages/std-ui/src/data/Table.ts`，支持 data 和 columns
- [x] T066 [P] [US5] 定义 `ColumnDefinition<T>` 接口在 `packages/std-ui/src/data/Table.ts`，支持 prop, label, formatter
- [x] T067 [P] [US5] 定义 `PaginationProps` 接口在 `packages/std-ui/src/data/Pagination.ts`
- [x] T068 [P] [US5] 定义 `TagProps` 接口在 `packages/std-ui/src/data/Tag.ts`
- [x] T069 [P] [US5] 定义 `DescriptionsProps` 接口在 `packages/std-ui/src/data/Descriptions.ts`
- [x] T070 [US5] 在 `packages/std-ui/src/index.ts` 中导出数据展示组件

#### 反馈组件

- [x] T071 [P] [US5] 定义 `ModalProps` 接口在 `packages/std-ui/src/feedback/Modal.ts`，包含 `visible`, `onOk`, `onCancel`
- [x] T072 [P] [US5] 定义 `MessageOptions` 接口在 `packages/std-ui/src/feedback/Message.ts`，支持 success/error/warning
- [x] T073 [P] [US5] 定义 `LoadingProps` 接口在 `packages/std-ui/src/feedback/Loading.ts`
- [x] T074 [P] [US5] 定义 `NotificationOptions` 接口在 `packages/std-ui/src/feedback/Notification.ts`
- [x] T075 [US5] 在 `packages/std-ui/src/index.ts` 中导出反馈组件

#### 导航组件

- [x] T076 [P] [US5] 定义 `MenuProps` 接口在 `packages/std-ui/src/navigation/Menu.ts`
- [x] T077 [P] [US5] 定义 `TabsProps` 接口在 `packages/std-ui/src/navigation/Tabs.ts`
- [x] T078 [P] [US5] 定义 `BreadcrumbProps` 接口在 `packages/std-ui/src/navigation/Breadcrumb.ts`
- [x] T079 [US5] 在 `packages/std-ui/src/index.ts` 中导出导航组件

#### 基础组件

- [x] T080 [P] [US5] 定义 `ButtonProps` 接口在 `packages/std-ui/src/basic/Button.ts`，包含 `type`, `size`, `disabled`, `onClick`
- [x] T081 [P] [US5] 定义 `IconProps` 接口在 `packages/std-ui/src/basic/Icon.ts`
- [x] T082 [P] [US5] 定义 `LinkProps` 接口在 `packages/std-ui/src/basic/Link.ts`
- [x] T083 [US5] 在 `packages/std-ui/src/index.ts` 中导出基础组件

#### 测试与文档

- [ ] T084 [P] [US5] 编写类型兼容性测试 `packages/std-ui/tests/type-check.test.ts` 验证所有组件 Props 定义
- [ ] T085 [US5] 更新 `packages/std-ui/README.md` 添加组件列表和使用示例
- [ ] T086 [US5] 更新订单列表示例 `examples/order-management/src/views/OrderList.view.tsx` 使用 Table 和 Button 组件
- [ ] T087 [US5] 创建订单详情页面示例 `examples/order-management/src/views/OrderDetail.view.tsx` 演示 Form 组件

**Checkpoint**: 标准组件协议完成，覆盖 90% 常见 ERP 场景

---

## Phase 8: User Story 6 - 路由与导航 (Priority: P3)

**Goal**: 实现 `useRouter`, `useRoute`, `useParams` API，支持路由操作和参数获取

**Independent Test**: 创建列表页和详情页，点击列表行导航到详情页，验证路由参数传递

### Implementation for User Story 6

- [ ] T088 [P] [US6] 定义 `Router` 接口在 `packages/dsl/src/ui/types.ts`，包含 `push`, `replace`, `back`, `go` 方法
- [ ] T089 [P] [US6] 定义 `Route` 接口在 `packages/dsl/src/ui/types.ts`，包含 `path`, `params`, `query`, `meta` 属性
- [ ] T090 [P] [US6] 实现 `useRouter` 函数签名在 `packages/dsl/src/ui/router.ts`
- [ ] T091 [P] [US6] 实现 `useRoute` 函数签名在 `packages/dsl/src/ui/router.ts`，返回只读的路由信息
- [ ] T092 [P] [US6] 实现 `useParams<T>` 泛型函数签名在 `packages/dsl/src/ui/router.ts`，支持类型安全的参数获取
- [ ] T093 [US6] 在 `packages/dsl/src/ui/index.ts` 中导出路由相关 API
- [ ] T094 [P] [US6] 编写类型测试 `packages/dsl/tests/ui/router.test.ts` 验证 `useParams` 泛型推导
- [ ] T095 [US6] 添加 JSDoc 文档注释，说明路由守卫和权限校验机制
- [ ] T096 [US6] 更新订单列表示例 `examples/order-management/src/views/OrderList.view.tsx` 添加跳转到详情页逻辑
- [ ] T097 [US6] 更新订单详情示例 `examples/order-management/src/views/OrderDetail.view.tsx` 使用 `useParams` 获取 ID

**Checkpoint**: 路由 API 完成，支持多页面导航

---

## Phase 9: User Story 7 - 服务调用与异步状态 (Priority: P3)

**Goal**: 实现 `useQuery` 和 `useMutation` API，自动管理 loading, error 状态，支持缓存和重试

**Independent Test**: 创建列表页使用 `useQuery` 加载数据，验证 loading 状态和错误处理

### Implementation for User Story 7

- [ ] T098 [P] [US7] 定义 `QueryOptions<TData, TError>` 接口在 `packages/dsl/src/ui/types.ts`
- [ ] T099 [P] [US7] 定义 `QueryResult<TData, TError>` 接口在 `packages/dsl/src/ui/types.ts`，包含 `data`, `loading`, `error`, `refetch`
- [ ] T100 [P] [US7] 定义 `MutationOptions<TData, TVariables, TError>` 接口在 `packages/dsl/src/ui/types.ts`
- [ ] T101 [P] [US7] 定义 `MutationResult<TData, TVariables, TError>` 接口在 `packages/dsl/src/ui/types.ts`
- [ ] T102 [P] [US7] 实现 `useQuery` 函数签名在 `packages/dsl/src/ui/query.ts`，支持泛型推导
- [ ] T103 [P] [US7] 实现 `useMutation` 函数签名在 `packages/dsl/src/ui/query.ts`
- [ ] T104 [US7] 在 `packages/dsl/src/ui/index.ts` 中导出服务调用相关 API
- [ ] T105 [P] [US7] 编写类型测试 `packages/dsl/tests/ui/query.test.ts` 验证 `useQuery` 泛型推导
- [ ] T106 [P] [US7] 编写类型测试验证 `useMutation` 的 variables 和 data 类型关系
- [ ] T107 [US7] 添加 JSDoc 文档注释，说明缓存策略和重试机制
- [ ] T108 [US7] 更新订单列表示例 `examples/order-management/src/views/OrderList.view.tsx` 使用 `useQuery` 替代手动状态管理

**Checkpoint**: 服务调用 API 完成，提供完整的异步状态管理能力

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 完善文档、测试和开发体验

- [ ] T109 [P] 编写集成测试 `packages/dsl/tests/ui/integration.test.ts` 验证完整的 DSL 页面示例编译通过
- [ ] T110 [P] 创建 `packages/dsl/src/ui/README.md` API 参考文档
- [ ] T111 [P] 编写 `specs/003-ui-dsl-implementation/quickstart.md` 快速上手指南
- [ ] T112 [P] 编写 `specs/003-ui-dsl-implementation/data-model.md` 类型系统完整文档
- [ ] T113 [P] 编写 `specs/003-ui-dsl-implementation/contracts/reactive-api.md` 响应式 API 契约
- [ ] T114 [P] 编写 `specs/003-ui-dsl-implementation/contracts/lifecycle-api.md` 生命周期 API 契约
- [ ] T115 [P] 编写 `specs/003-ui-dsl-implementation/contracts/component-api.md` 组件定义 API 契约
- [ ] T116 [P] 编写 `specs/003-ui-dsl-implementation/contracts/std-ui-api.md` 标准组件协议契约
- [ ] T117 运行 `tsc --noEmit` 验证所有类型定义无错误
- [ ] T118 [P] 运行 `pnpm test` 验证所有类型测试通过
- [ ] T119 [P] 更新根 README.md 添加 UI DSL 包介绍
- [ ] T120 性能测试：验证 200 页面项目的类型检查时间 < 5s
- [ ] T121 [P] 代码审查和重构，确保类型定义的一致性
- [ ] T122 更新 `packages/dsl/CHANGELOG.md` 记录 UI DSL 新特性

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-9)**: 全部依赖 Foundational 完成
  - US1 (响应式状态) - 基础，其他故事可能依赖
  - US2 (计算属性) - 依赖 US1
  - US3 (页面组件) - 依赖 US1，形成 P1 MVP
  - US4 (生命周期) - 依赖 US1, US3
  - US5 (标准组件) - 独立，可与其他故事并行
  - US6 (路由) - 依赖 US3
  - US7 (服务调用) - 依赖 US1, US4
- **Polish (Phase 10)**: 依赖所有期望的用户故事完成

### User Story Dependencies

```text
Phase 2 (Foundational) ✅
   ↓
   ├─→ US1 (响应式状态) P1 ✅ [T016-T023]
   │    ↓
   │    ├─→ US2 (计算属性) P1 [T024-T032]
   │    │    ↓
   │    │    └─→ US3 (页面组件) P1 🎯 MVP [T033-T043]
   │    │         ↓
   │    │         ├─→ US4 (生命周期) P2 [T044-T054]
   │    │         │    ↓
   │    │         │    └─→ US7 (服务调用) P3 [T098-T108]
   │    │         │
   │    │         └─→ US6 (路由) P3 [T088-T097]
   │    │
   │    └─→ US5 (标准组件) P2 [T055-T087] (可并行)
   │
   └─→ Phase 10 (Polish) [T109-T122]
```

### Within Each User Story

- 类型定义可并行（标记 [P]）
- 导出和集成必须在类型定义完成后
- 测试可以与实现并行编写
- 示例代码在 API 导出后创建

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T005, T006, T007, T009 可并行

**Phase 2 (Foundational)**: T011, T012, T014, T015 可并行

**US1**: T016, T017, T018, T021, T022 可并行

**US2**: T024, T025, T026, T027, T029, T030, T031 可并行

**US3**: T033, T034, T035, T036, T037, T039, T040, T041 可并行

**US4**: T044, T045, T046, T047, T048, T049, T051, T052, T053 可并行

**US5**: 所有组件接口定义（T055-T083）可并行

**US6**: T088, T089, T090, T091, T092, T094 可并行

**US7**: T098, T099, T100, T101, T102, T103, T105, T106, T107 可并行

**Phase 10**: 大部分文档和测试任务可并行

---

## Parallel Example: User Story 1

```bash
# 同时创建所有 US1 类型定义：
Task: "定义 ReactiveState<T> 接口在 packages/dsl/src/ui/types.ts"
Task: "实现 useState 函数签名在 packages/dsl/src/ui/reactive.ts"
Task: "添加 useState 函数重载"
Task: "编写类型测试 reactive.test.ts"
Task: "添加 JSDoc 文档注释"

# 然后顺序执行集成任务：
Task: "在 packages/dsl/src/ui/index.ts 中导出"
Task: "更新 packages/dsl/src/index.ts"
Task: "创建计数器示例"
```

---

## Parallel Example: User Story 5 (Standard Components)

```bash
# 所有组件接口可以完全并行创建：
Task: "定义 PageProps 接口 (packages/std-ui/src/layout/Page.ts)"
Task: "定义 CardProps 接口 (packages/std-ui/src/layout/Card.ts)"
Task: "定义 FormProps 接口 (packages/std-ui/src/form/Form.ts)"
Task: "定义 TableProps 接口 (packages/std-ui/src/data/Table.ts)"
Task: "定义 ButtonProps 接口 (packages/std-ui/src/basic/Button.ts)"
# ... 共 30+ 组件定义可并行

# 然后集中导出：
Task: "在 packages/std-ui/src/index.ts 中导出所有组件"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

1. **完成 Phase 1: Setup** [T001-T009]
2. **完成 Phase 2: Foundational** [T010-T015] - **关键阻塞**
3. **完成 US1: 响应式状态** [T016-T023] - 核心能力
4. **完成 US2: 计算属性** [T024-T032] - 响应式完整
5. **完成 US3: 页面组件** [T033-T043] - 🎯 **MVP 完成**
6. **STOP and VALIDATE**: 验证可以编写完整的响应式 DSL 页面
7. 运行 `tsc --noEmit` 和类型测试，确保 MVP 质量

### Incremental Delivery

1. **MVP (P1)**: Setup + Foundational + US1 + US2 + US3 → 最小可用 DSL
2. **P2 功能**: 添加 US4 (生命周期) + US5 (标准组件) → 企业级 UI
3. **P3 功能**: 添加 US6 (路由) + US7 (服务调用) → 完整能力
4. **Polish**: Phase 10 文档和性能优化 → 生产就绪

### Parallel Team Strategy

多开发者并行工作：

1. **团队共同完成**: Setup + Foundational (必须)
2. **Foundational 完成后**:
   - 开发者 A: US1 + US2 (响应式系统)
   - 开发者 B: US3 (组件模型)
   - 开发者 C: US5 (标准组件协议) - 可独立并行
3. **P1 完成后**:
   - 开发者 A: US4 (生命周期)
   - 开发者 B: US6 (路由)
   - 开发者 C: US7 (服务调用)
4. **最后**: 全员参与 Phase 10 (文档和测试)

---

## Notes

- **纯类型定义**: 所有函数体都是 `throw new Error('Runtime not implemented')`，重点在类型签名
- **[P] 任务**: 不同文件，无依赖，可并行执行
- **[Story] 标签**: 任务到用户故事的可追溯性
- **类型测试**: 使用 Vitest + `expectTypeOf` 验证类型推导正确性
- **提交策略**: 每完成一个用户故事提交一次，保持 Git 历史清晰
- **Checkpoint**: 每个用户故事完成后独立验证，确保可编译和类型检查通过
- **避免**: 过度复杂的泛型、跨故事的强依赖、运行时逻辑混入

---

## Success Validation

完成所有任务后，必须验证：

1. ✅ `pnpm install` 无错误，所有包正确链接
2. ✅ `tsc --noEmit` 对所有 DSL 源码和示例代码无类型错误
3. ✅ `pnpm test` 所有类型测试通过
4. ✅ VSCode 打开示例文件时智能提示正常，无类型警告
5. ✅ `examples/order-management/src/views/` 中至少 2 个完整示例页面
6. ✅ 4 个契约文档（contracts/*.md）完成并与实现一致
7. ✅ quickstart.md 可在 10 分钟内完成演练
8. ✅ 类型检查性能测试通过（< 5s for 200 pages）

---

**总任务数**: 122 tasks  
**P1 MVP 任务数**: 43 tasks (T001-T043)  
**并行机会**: 60+ tasks 可并行执行  
**预计完成时间**: MVP 3-5 天，完整实现 10-12 天

