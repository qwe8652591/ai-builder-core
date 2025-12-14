# Feature Specification: UI DSL 层实现

**Feature Branch**: `003-ui-dsl-implementation`  
**Created**: 2025-12-07  
**Status**: Draft  
**Input**: User description: "实现 UI DSL 层，包括 @ai-builder/dsl/ui 响应式原语包和 @ai-builder/dsl/std-ui 标准 UI 组件协议包，支持 definePage、useState、useComputed、useEffect 等函数式组件 API"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 基础响应式状态管理 (Priority: P1)

开发者可以在 DSL 中定义和使用响应式状态，实现数据驱动的界面更新，就像使用 Vue 3 的 `ref()` 或 React 的 `useState()` 一样自然。

**Why this priority**: 响应式状态是前端 UI DSL 的核心基础能力，所有其他功能都依赖于此。没有响应式系统，无法构建交互式界面。

**Independent Test**: 可以通过创建一个简单的计数器组件来测试，该组件使用 `useState` 定义计数器状态，点击按钮时状态更新并自动触发界面刷新。

**Acceptance Scenarios**:

1. **Given** 开发者使用 `useState<number>(0)` 定义了一个状态，**When** 访问 `count.value` 获取当前值，**Then** 返回初始值 0
2. **Given** 状态已定义，**When** 通过 `count.value = 5` 修改状态值，**Then** 所有引用该状态的界面元素自动更新显示 5
3. **Given** 在 TSX 中使用 `{count.value}` 绑定状态，**When** 状态值变化，**Then** 界面自动重新渲染显示新值
4. **Given** 开发者定义了复杂类型的状态 `useState<User>({ name: 'Alice', age: 30 })`，**When** 修改嵌套属性 `user.value.age = 31`，**Then** 界面能够检测到深层变化并更新

---

### User Story 2 - 计算属性与依赖追踪 (Priority: P1)

开发者可以定义计算属性，系统自动追踪依赖的状态并在依赖变化时重新计算，避免手动管理依赖关系。

**Why this priority**: 计算属性是响应式系统的关键能力，能够大幅简化派生状态的管理，与 P1 的状态管理共同构成最小可用的响应式系统。

**Independent Test**: 可以通过创建一个购物车总价计算的场景来测试，`totalPrice` 计算属性依赖 `items` 数组和每个商品的 `price * quantity`，当 `items` 变化时自动重新计算总价。

**Acceptance Scenarios**:

1. **Given** 开发者使用 `useComputed(() => items.value.length)` 定义计算属性 `itemCount`，**When** `items` 数组添加新元素，**Then** `itemCount.value` 自动更新为新的数组长度
2. **Given** 计算属性 `totalPrice` 依赖多个状态 `items` 和 `discountRate`，**When** 任一依赖状态变化，**Then** `totalPrice` 自动重新计算并更新
3. **Given** 计算属性的计算函数中访问了 `priceA` 和 `priceB`，**When** 只修改 `priceA`，**Then** 计算属性重新计算；但如果修改不相关的 `unrelatedState`，计算属性不重新计算
4. **Given** 计算属性返回对象 `useComputed(() => ({ sum: a.value + b.value }))`，**When** 依赖变化导致重新计算，**Then** 返回新的对象实例而不是修改原对象

---

### User Story 3 - 页面与组件定义 (Priority: P1)

开发者可以使用 `definePage` 和 `defineComponent` 定义页面和可复用组件，声明路由、标题、权限等元数据，并编写 setup 函数来组织逻辑。

**Why this priority**: 页面和组件是 UI DSL 的基本组织单位，必须在 P1 阶段实现才能构建完整的可测试界面。与响应式系统配合形成完整的 MVP。

**Independent Test**: 可以通过创建一个简单的用户列表页面来测试，使用 `definePage` 定义路由为 `/users`，在 setup 函数中定义状态和逻辑，返回渲染函数。

**Acceptance Scenarios**:

1. **Given** 开发者使用 `definePage({ route: '/cart', title: '购物车' }, setup)` 定义页面，**When** 用户访问 `/cart` 路由，**Then** 页面组件被加载并执行 setup 函数
2. **Given** 页面定义中包含 `permission: 'trade:cart:view'`，**When** 用户无此权限尝试访问，**Then** 路由守卫拦截并跳转到权限错误页
3. **Given** 开发者使用 `defineComponent({ props: { userId: String } }, setup)` 定义可复用组件，**When** 父组件传入 props `<UserCard userId="123" />`，**Then** 子组件的 setup 函数接收到 props 并正确渲染
4. **Given** setup 函数返回渲染函数 `return () => <div>{count.value}</div>`，**When** 状态 `count` 变化，**Then** 渲染函数自动重新执行并更新界面

---

### User Story 4 - 副作用与生命周期 (Priority: P2)

开发者可以使用 `useEffect` 和 `onMounted` 等钩子函数在特定时机执行副作用操作（如数据加载、事件监听），并在组件卸载时自动清理。

**Why this priority**: 副作用管理是复杂交互的必需能力，但基础的静态展示和简单交互可以在 P1 完成。P2 阶段补全后可支持数据加载、定时器等场景。

**Independent Test**: 可以通过创建一个数据加载组件来测试，在 `useEffect(() => { fetchData(); }, [])` 中加载数据，组件挂载时自动触发，卸载时清理请求。

**Acceptance Scenarios**:

1. **Given** 开发者使用 `useEffect(async () => { items.value = await fetchItems(); }, [])` 定义挂载时执行的副作用，**When** 组件首次挂载，**Then** 自动执行异步数据加载并更新状态
2. **Given** `useEffect` 的依赖数组指定为 `[userId]`，**When** `userId` 状态变化，**Then** 副作用重新执行；当其他状态变化时，副作用不执行
3. **Given** `useEffect` 返回清理函数 `return () => clearInterval(timer)`，**When** 组件卸载或依赖变化导致副作用重新执行，**Then** 清理函数自动执行清理之前的定时器
4. **Given** 使用 `onMounted(() => console.log('mounted'))`，**When** 组件挂载完成（DOM 已渲染），**Then** 回调函数执行，可以安全地访问 DOM 元素

---

### User Story 5 - 标准 UI 组件协议 (Priority: P2)

开发者可以在 DSL 中使用标准 UI 组件（如 `<Page>`, `<Table>`, `<Form>`, `<Button>` 等），这些组件在编译时根据目标框架（Vue/React）和 UI 库（Element Plus/Ant Design）自动替换为具体实现。

**Why this priority**: 标准组件协议是实现"一次编写，多框架生成"的关键，但在 P1 阶段可以先使用原生 HTML 元素验证核心响应式能力。P2 补全后才能生成真正的企业级 UI。

**Independent Test**: 可以通过编写一个包含 `<Table>`, `<Button>` 的 DSL 页面，分别编译为 Vue 3 + Element Plus 和 React + Ant Design，验证两个目标产物都能正确渲染和交互。

**Acceptance Scenarios**:

1. **Given** 开发者在 DSL 中使用 `<Table data={items.value} columns={columns} />`，**When** 编译为 Vue 3 + Element Plus，**Then** 生成 `<el-table :data="items" :columns="columns" />`
2. **Given** 同样的 `<Table>` DSL 代码，**When** 编译为 React + Ant Design，**Then** 生成 `<Table dataSource={items} columns={columns} />`
3. **Given** 开发者使用 `<Button onClick={handleClick} type="primary">提交</Button>`，**When** 编译为 Vue，**Then** 生成 `<el-button @click="handleClick" type="primary">提交</el-button>`，事件绑定语法正确
4. **Given** DSL 中使用 `<Form model={formData}>`，**When** 编译为 React，**Then** 自动处理表单双向绑定的差异（Vue 使用 `v-model`，React 使用 `value + onChange`）

---

### User Story 6 - 路由与导航 (Priority: P3)

开发者可以使用 `useRouter` 和 `useRoute` 进行路由操作和参数获取，实现页面间导航和参数传递。

**Why this priority**: 路由能力对于多页面应用必不可少，但单页面或简单应用可以暂时不依赖此功能。P3 补全后支持完整的 SPA 导航。

**Independent Test**: 可以通过创建订单列表页和订单详情页，在列表页点击行时使用 `router.push('/orders/' + id)` 导航到详情页，详情页使用 `useParams()` 获取 `id` 参数并加载数据。

**Acceptance Scenarios**:

1. **Given** 开发者在按钮点击事件中调用 `router.push('/orders')`，**When** 用户点击按钮，**Then** 浏览器导航到 `/orders` 路由并加载对应页面组件
2. **Given** 页面 URL 为 `/orders/123/edit`，**When** 组件中调用 `const { id } = useParams()`，**Then** `id` 的值为 `'123'`
3. **Given** 使用 `router.push('/orders?status=pending')`，**When** 目标页面使用 `const query = useRoute().query`，**Then** `query.status` 的值为 `'pending'`
4. **Given** 当前页面有未保存的修改，**When** 用户尝试离开页面，**Then** 路由守卫触发确认弹窗，用户确认后才允许导航

---

### User Story 7 - 服务调用与异步状态 (Priority: P3)

开发者可以使用 `useService` 或 `useQuery`/`useMutation` 封装调用 `.app.ts` 服务的逻辑，自动管理 loading、error 状态，并提供缓存和重试能力。

**Why this priority**: 服务调用封装能显著提升开发效率，但 P1/P2 阶段可以直接使用 `await Service.method()` 手动管理状态。P3 补全后提供更好的开发体验。

**Independent Test**: 可以通过创建一个使用 `const { data, loading, error, refetch } = useQuery(() => OrderService.getList(params))` 的列表页，验证自动管理 loading 状态、错误处理和数据刷新功能。

**Acceptance Scenarios**:

1. **Given** 开发者使用 `const { data, loading } = useQuery(() => OrderService.getList())`，**When** 组件挂载触发查询，**Then** `loading` 初始为 `true`，查询完成后变为 `false`，`data` 包含查询结果
2. **Given** 查询过程中发生错误，**When** 服务返回错误，**Then** `error` 状态包含错误信息，可以在界面显示错误提示
3. **Given** 使用 `const { mutate, loading } = useMutation((data) => OrderService.create(data))`，**When** 调用 `await mutate(newOrder)`，**Then** 自动管理 loading 状态，成功后可以触发列表刷新
4. **Given** `useQuery` 配置了 `{ cacheTime: 5 * 60 * 1000 }`，**When** 5 分钟内多次访问同一页面，**Then** 使用缓存数据而不重新请求服务器

---

### Edge Cases

- 当开发者在计算属性中访问未定义的状态时会发生什么？（应该在开发模式下抛出友好的错误提示，指出哪个状态未定义）
- 当状态更新导致无限循环时系统如何处理？（例如在 `useEffect` 中修改自己依赖的状态）- 应该检测循环并抛出错误
- 当组件快速挂载和卸载时，异步副作用如何避免内存泄漏？（应该在卸载时自动取消未完成的异步操作）
- 当深层嵌套的对象状态只修改了叶子节点时，响应式系统如何高效检测变化？（应该使用 Proxy 深度代理或提供 immutable 更新辅助函数）
- 当 DSL 中使用的标准组件在目标 UI 库中不存在对应组件时如何处理？（编译时应该报错并提示缺少组件映射）
- 当页面定义的路由与现有路由冲突时如何处理？（编译时应该检测并报错）
- 当开发者错误地在渲染函数中直接调用 `useState` 会发生什么？（应该在开发模式下抛出错误，提示只能在 setup 函数中调用）

## Requirements *(mandatory)*

### Functional Requirements

#### 核心响应式系统

- **FR-001**: 系统必须提供 `useState<T>(initialValue)` 函数，返回响应式状态对象，包含 `.value` 属性用于读写状态值
- **FR-002**: 当状态的 `.value` 被修改时，系统必须自动通知所有依赖该状态的计算属性和渲染函数重新执行
- **FR-003**: 系统必须提供 `useComputed<T>(getter)` 函数，创建计算属性，自动追踪 getter 函数中访问的所有状态依赖
- **FR-004**: 计算属性必须具有缓存机制，只有依赖变化时才重新计算，重复访问 `.value` 时返回缓存结果
- **FR-005**: 系统必须提供 `useWatch(source, callback)` 函数，监听状态或计算属性的变化并执行回调函数
- **FR-006**: 响应式系统必须支持深层对象的响应式追踪，包括数组和嵌套对象的属性变化

#### 组件与页面定义

- **FR-007**: 系统必须提供 `definePage(meta, setup)` 函数，其中 `meta` 包含 `route`, `title`, `permission`, `menu` 等元数据
- **FR-008**: 系统必须提供 `defineComponent(options, setup)` 函数，支持定义可复用组件，`options` 包含 `props` 定义
- **FR-009**: `setup` 函数必须在组件实例创建时执行一次，接收 `props` 参数（如有），返回渲染函数或响应式状态
- **FR-010**: 渲染函数必须返回 TSX/JSX 结构，当依赖的响应式状态变化时自动重新执行
- **FR-011**: 页面元数据中的 `permission` 必须在编译时生成路由守卫配置，在运行时进行权限校验

#### 副作用与生命周期

- **FR-012**: 系统必须提供 `useEffect(effect, deps?)` 函数，在组件挂载后和依赖变化时执行副作用函数
- **FR-013**: `useEffect` 的副作用函数可以返回清理函数，系统必须在组件卸载或依赖变化时执行清理函数
- **FR-014**: 当 `deps` 参数为空数组 `[]` 时，副作用只在组件挂载时执行一次
- **FR-015**: 当 `deps` 参数省略时，副作用在每次渲染后都执行（Vue: watchEffect 行为）
- **FR-016**: 系统必须提供 `onMounted(callback)` 钩子，在组件挂载完成（DOM 可访问）时执行
- **FR-017**: 系统必须提供 `onUnmounted(callback)` 钩子，在组件卸载前执行清理逻辑

#### 标准 UI 组件协议

- **FR-018**: 系统必须提供标准组件接口定义，包括但不限于：`Page`, `Table`, `Form`, `Input`, `Button`, `Select`, `Modal`, `Message`
- **FR-019**: 标准组件的接口定义必须是框架无关的，仅定义 Props 类型和事件回调签名
- **FR-020**: 编译器必须根据 `ai-builder.config.ts` 中的目标框架（Vue3/React）和 UI 库（Element Plus/Ant Design）配置，将标准组件映射到具体实现
- **FR-021**: 标准组件的事件绑定语法必须统一（如 `onClick`），编译时自动转换为目标框架的事件语法（Vue: `@click`, React: `onClick`）
- **FR-022**: 标准组件必须支持插槽（Slots）定义，编译时转换为目标框架的插槽语法

#### 路由与导航

- **FR-023**: 系统必须提供 `useRouter()` 函数，返回路由实例，包含 `push`, `replace`, `back`, `go` 等导航方法
- **FR-024**: 系统必须提供 `useRoute()` 函数，返回当前路由信息，包含 `path`, `params`, `query`, `meta` 等属性
- **FR-025**: 系统必须提供 `useParams()` 函数，以 TypeScript 类型安全的方式获取路由参数
- **FR-026**: 路由守卫必须支持基于 `permission` 元数据的权限校验，编译时自动生成守卫配置

#### 服务调用与异步状态

- **FR-027**: 系统必须提供 `useQuery(queryFn, options?)` 函数，封装数据查询逻辑，返回 `{ data, loading, error, refetch }` 状态
- **FR-028**: 系统必须提供 `useMutation(mutationFn, options?)` 函数，封装数据修改逻辑，返回 `{ mutate, loading, error }` 状态
- **FR-029**: `useQuery` 必须支持缓存配置（`cacheTime`, `staleTime`），避免重复请求
- **FR-030**: `useQuery` 和 `useMutation` 必须支持错误重试配置（`retry`, `retryDelay`）

#### 类型系统与 TypeScript 支持

- **FR-031**: 所有 DSL API 必须提供完整的 TypeScript 类型定义，支持泛型推导
- **FR-032**: `useState<T>(value)` 的类型必须从初始值自动推导，或由泛型参数显式指定
- **FR-033**: `definePage` 和 `defineComponent` 的 Props 定义必须支持类型推导，setup 函数的参数类型自动匹配
- **FR-034**: 标准组件的 Props 必须有严格的类型定义，错误的 Props 传递应该在 IDE 中报类型错误

#### 开发体验

- **FR-035**: 所有 DSL API 在开发模式下必须提供友好的错误提示，指出具体的错误位置和修复建议
- **FR-036**: 当检测到性能问题（如无限循环、过深嵌套）时，系统必须在开发模式下发出警告
- **FR-037**: DSL 代码必须支持 Hot Module Replacement (HMR)，状态在热更新后尽可能保留

### Key Entities

- **State (响应式状态)**: 表示可变的响应式数据，包含当前值 `value` 和依赖追踪信息 `deps`。当值变化时通知所有订阅者
- **Computed (计算属性)**: 表示派生的响应式数据，包含 getter 函数、缓存值 `cachedValue`、依赖列表 `dependencies` 和脏标记 `isDirty`。只读，值由 getter 函数计算得出
- **Effect (副作用)**: 表示需要在特定时机执行的函数，包含副作用函数 `fn`、依赖列表 `deps`、清理函数 `cleanup` 和执行时机 `timing`（mounted/updated/unmounted）
- **Component (组件)**: 表示可复用的 UI 单元，包含 Props 定义 `propsDef`、setup 函数 `setup`、渲染函数 `render` 和实例状态 `instances`
- **Page (页面)**: 特殊的组件，额外包含路由元数据 `route`、权限配置 `permission`、菜单配置 `menu` 和标题 `title`
- **Router (路由器)**: 表示路由管理器，包含路由表 `routes`、当前路由 `currentRoute`、导航守卫 `guards` 和导航方法 `push/replace/back/go`
- **StandardComponent (标准组件协议)**: 表示框架无关的组件接口定义，包含组件名 `name`、Props 类型 `propsType`、事件类型 `eventsType` 和插槽定义 `slots`
- **Query (查询状态)**: 表示异步数据查询的状态，包含查询函数 `queryFn`、数据 `data`、加载状态 `loading`、错误 `error`、缓存配置 `cacheConfig` 和刷新方法 `refetch`
- **Mutation (变更状态)**: 表示异步数据修改的状态，包含变更函数 `mutationFn`、加载状态 `loading`、错误 `error`、执行方法 `mutate` 和成功/失败回调 `onSuccess/onError`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 开发者可以使用不超过 10 行 DSL 代码完成一个包含状态管理和响应式更新的简单计数器组件，代码可读性和简洁性与原生 Vue 3 Composition API 或 React Hooks 相当
- **SC-002**: 使用 `useState` 和 `useComputed` 定义的响应式系统在处理 1000 个响应式状态和 500 个计算属性时，状态更新的响应时间不超过 16ms（保证 60fps 流畅度）
- **SC-003**: 标准 UI 组件协议能够覆盖 90% 的常见 ERP 界面场景，包括表单、表格、列表、详情页、对话框等，无需开发者手写原生 Vue/React 组件代码
- **SC-004**: 同一份 DSL 代码编译为 Vue 3 + Element Plus 和 React + Ant Design 两个目标后，界面展示效果和交互行为完全一致，功能无差异
- **SC-005**: 开发者使用 DSL 编写一个包含列表查询、详情展示、表单提交的标准 CRUD 页面，代码量相比手写 Vue/React 代码减少 40% 以上
- **SC-006**: DSL API 的 TypeScript 类型推导覆盖率达到 95% 以上，开发者在 VSCode 中编写 DSL 代码时，智能提示和类型检查与手写 TypeScript 代码无差异
- **SC-007**: 当开发者犯常见错误（如在渲染函数中调用 Hook、忘记依赖数组、循环依赖）时，系统在 3 秒内在控制台输出清晰的错误提示，包含错误位置和修复建议
- **SC-008**: 使用 `useQuery` 封装数据查询后，相同查询在 5 分钟内重复触发时，90% 的情况下使用缓存数据，减少不必要的 API 请求

## Assumptions *(optional)*

- 假设目标开发者已熟悉 Vue 3 Composition API 或 React Hooks 的基本概念，理解响应式状态、副作用、生命周期等术语
- 假设编译目标为现代浏览器（支持 ES2020+）和主流前端框架（Vue 3.3+ 或 React 18+）
- 假设 UI 库选择为 Element Plus（Vue）或 Ant Design（React），这两个库的组件 API 已知且稳定
- 假设 DSL 代码运行在 TypeScript 5.0+ 环境，享受最新的类型推导特性
- 假设响应式系统采用 Proxy-based 实现（类似 Vue 3），不需要支持 IE11 等不支持 Proxy 的旧浏览器
- 假设标准组件协议的映射配置在 `ai-builder.config.ts` 中集中管理，不支持运行时动态切换 UI 库
- 假设路由系统基于 Vue Router（Vue）或 React Router（React）生成，不需要自研路由内核

## Dependencies *(optional)*

- 依赖 `@ai-builder/dsl` 核心包已实现基础的装饰器系统和类型定义
- 依赖 `@ai-builder/runtime` 已实现 IoC 容器和依赖注入，用于在仿真环境中运行 DSL
- 依赖编译器能够正确解析 TSX 语法，识别 JSX 元素和属性
- 依赖目标 UI 库（Element Plus 和 Ant Design）的最新稳定版本，组件 API 不发生破坏性变更
- 依赖 `decimal.js` 或类似库处理精确计算（在响应式状态中可能需要）

## Out of Scope *(optional)*

- 不支持 Vue 2 或 React 17 以下的旧版本框架
- 不支持 SSR（服务端渲染）场景的响应式系统优化，首期仅保证 CSR（客户端渲染）正确性
- 不实现自定义渲染器（Custom Renderer），不支持渲染到 Canvas、WebGL 等非 DOM 目标
- 不提供可视化拖拽式 UI 编辑器（这属于 VS Code Extension 的范畴，不在 DSL SDK 范围）
- 不实现状态持久化到 LocalStorage/SessionStorage 的自动机制（需要开发者手动实现）
- 不支持 Server Components 或 Islands Architecture 等新兴架构模式
- 不实现时间旅行调试（Time-Travel Debugging）功能
- 不支持多语言（i18n）的响应式切换（i18n 集成属于独立功能）

## Constraints *(optional)*

- DSL API 的命名必须与 Vue 3 Composition API 或 React Hooks 保持高度一致，降低学习成本（如 `useState`, `useEffect` 与 React 一致）
- 响应式系统的性能必须接近原生 Vue 3 或 React 的性能，不能因为 DSL 抽象层导致明显性能下降（目标：性能差异不超过 10%）
- 标准组件协议的 Props 命名必须统一（如 `data` 统一表示表格数据），不受目标 UI 库 API 差异影响（如 Element Plus 的 `data` vs Ant Design 的 `dataSource`）
- 所有 DSL API 必须是纯 TypeScript 函数，不依赖运行时全局状态或单例，确保多实例和测试场景下的可预测性
- 错误提示必须包含错误代码（如 `DSL-UI-001`），方便用户查询文档和提问
- 编译产物的代码必须具有良好的可读性，保留变量名和注释，便于调试生成的 Vue/React 代码

## Risks *(optional)*

- **风险 1: 响应式系统性能瓶颈** - 如果深层对象的响应式追踪实现不当，可能导致大量 Proxy 对象创建，影响性能。缓解措施：参考 Vue 3 的 shallowRef 和 shallowReactive 提供浅层响应式选项。
- **风险 2: 框架 API 差异难以抹平** - Vue 和 React 的响应式模型存在本质差异（Pull-based vs Push-based），可能导致某些边界场景行为不一致。缓解措施：明确文档说明差异，对于无法统一的场景提供条件编译支持。
- **风险 3: UI 库版本升级导致组件映射失效** - Element Plus 或 Ant Design 大版本升级可能改变组件 API，导致生成的代码无法编译。缓解措施：在 `ai-builder.config.ts` 中明确指定 UI 库版本范围，提供版本兼容性检查工具。
- **风险 4: TypeScript 类型推导复杂度过高** - 过于复杂的泛型类型可能导致 IDE 卡顿或类型推导错误。缓解措施：限制类型嵌套深度，提供简化版的类型定义作为 fallback。
- **风险 5: 学习曲线陡峭** - 虽然 API 设计与 Vue/React 一致，但开发者需要理解 DSL 编译的概念和调试方式。缓解措施：提供丰富的示例代码和分步教程，强调 DSL 代码就是可运行的 TypeScript 代码。
