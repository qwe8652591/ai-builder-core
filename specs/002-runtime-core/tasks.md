# 任务列表: @ai-builder/runtime 核心包

**分支**: `002-runtime-core` | **规范**: [spec.md](./spec.md) | **计划**: [plan.md](./plan.md)

## Phase 1: Setup (初始化) ✅
*目标: 初始化 runtime 包结构和配置。*

- [x] T001 初始化包目录 `packages/runtime` 和 `packages/runtime/src`
- [x] T002 创建 `packages/runtime/package.json`，添加依赖 (`@ai-builder/dsl`, `decimal.js-light`)
- [x] T003 创建 `packages/runtime/tsconfig.json` (继承根配置)
- [x] T004 创建 `packages/runtime/tsup.config.ts` 用于构建配置
- [x] T005 创建 `packages/runtime/vitest.config.ts` 用于测试配置
- [x] T006 创建 `packages/runtime/.gitignore` 和 `packages/runtime/README.md` 占位文件

## Phase 2: Foundational (基础设施) ✅
*目标: 建立核心目录结构和通用工具。*

- [x] T007 创建 `packages/runtime/src/index.ts` 作为主入口点
- [x] T008 初始化模块目录：在 `packages/runtime/src` 中创建 `primitives`, `repository`, `event-bus`, `hooks`
- [x] T009 创建 `packages/runtime/tests/setup.ts` 用于测试环境配置

## Phase 3: User Story 2 - High-Precision Calculations (P1) ✅
*目标: 实现 Decimal 包装器以支持精确的财务计算。*

- [x] T010 [US2] 在 `packages/runtime/src/primitives/decimal.ts` 中基于 `decimal.js-light` 实现 `Decimal` 类
- [x] T011 [US2] 在 `packages/runtime/src/primitives/index.ts` 中导出 `Decimal`
- [x] T012 [US2] 在 `packages/runtime/tests/primitives/decimal.test.ts` 中创建 Decimal 运算的单元测试

## Phase 4: User Story 1 - Simulatable Business Logic (P1) ✅
*目标: 实现 InMemoryRepo 以支持可仿真的持久化。*

- [x] T013 [US1] 在 `packages/runtime/src/repository/in-memory-repo.ts` 中实现 `InMemoryRepo<T>`
- [x] T014 [US1] 在 `packages/runtime/src/repository/repo-factory.ts` 中实现 `RepoFactory` (注册表模式)
- [x] T015 [US1] 在 `packages/runtime/src/repository/index.ts` 中导出 Repository 模块
- [x] T016 [US1] 在 `packages/runtime/tests/repository/repo.test.ts` 中创建 `InMemoryRepo` CRUD 操作的单元测试
- [x] T017 [US1] 在 `packages/runtime/tests/repository/factory.test.ts` 中创建 `RepoFactory` 注册和获取的单元测试

## Phase 5: User Story 3 - Event-Driven Flow (P2) ✅
*目标: 实现 LocalEventBus 以支持进程内事件处理。*

- [x] T018 [US3] 在 `packages/runtime/src/event-bus/local-event-bus.ts` 中实现 `LocalEventBus` (需支持通配符的自定义实现)
- [x] T019 [US3] 在 `packages/runtime/src/event-bus/index.ts` 中导出 EventBus
- [x] T020 [US3] 在 `packages/runtime/tests/event-bus/event-bus.test.ts` 中创建 EventBus 发布/订阅和通配符的单元测试

## Phase 6: User Story 4 - Security Context Propagation (P2) ✅
*目标: 使用 AsyncLocalStorage 实现 ThreadLocalSecurityContext。*

- [x] T021 [US4] 在 `packages/runtime/src/primitives/security.ts` 中实现 `ThreadLocalSecurityContext`
- [x] T022 [US4] 在 `packages/runtime/src/primitives/index.ts` 中导出 SecurityContext
- [x] T023 [US4] 在 `packages/runtime/tests/primitives/security.test.ts` 中创建上下文传播的单元测试

## Phase 7: User Story 5 - Extension Hooks (P3) ✅
*目标: 实现 HookRegistry 以支持横切关注点。*

- [x] T024 [US5] 在 `packages/runtime/src/hooks/hook-registry.ts` 中实现 `HookRegistry`
- [x] T025 [US5] 将 Hooks 集成到 `InMemoryRepo` (更新 `packages/runtime/src/repository/in-memory-repo.ts`)
- [x] T026 [US5] 在 `packages/runtime/src/hooks/index.ts` 中导出 Hooks
- [x] T027 [US5] 在 `packages/runtime/tests/hooks/hooks.test.ts` 中创建 Hook 执行顺序的单元测试

## Phase 8: IoC Container & Auto-Wiring (依赖注入) ✅
*目标: 实现 IoC 容器和自动依赖注入，支持 @Inject 装饰器。*

- [x] T033 [DI] 在 `packages/runtime/src/container/ioc-container.ts` 中实现 `IocContainer`
- [x] T034 [DI] 在 `packages/runtime/src/container/bootstrap.ts` 中实现 `RuntimeBootstrap`
- [x] T035 [DI] 在 `packages/runtime/src/container/index.ts` 中导出 Container 模块
- [x] T036 [DI] 在 `packages/runtime/tests/container/bootstrap.test.ts` 中创建 Bootstrap 和依赖注入的单元测试
- [x] T037 [DI] 更新 `@ai-builder/dsl` 导出 `metadataStore` 以支持运行时元数据访问
- [x] T038 [DI] 在 `examples/order-management` 中演示 RuntimeBootstrap 的使用

## Final Phase: Polish & Integration (完善与集成) ✅
*目标: 验证完整系统行为和构建产物。*

- [x] T028 在 `packages/runtime/tests/integration/full-flow.test.ts` 中创建完整的集成测试 (Service -> Repo -> Event)
- [x] T029 更新 `packages/runtime/src/index.ts` 以导出所有子模块
- [x] T030 验证 `pnpm build` 生成正确的 ESM/CJS 输出
- [x] T031 更新 `packages/runtime/README.md` 包含使用示例
- [ ] T032 [Doc] 更新 `quickstart.md` (如果存在) 或创建使用指南

## Dependencies (依赖关系)

- **US2 (Decimal)**: 独立，可在 Setup 后立即开始。
- **US1 (Repo)**: 独立。
- **US3 (EventBus)**: 独立。
- **US4 (Security)**: 独立。
- **US5 (Hooks)**: 依赖 US1 (Repo) 进行集成，但注册表逻辑独立。
- **集成测试**: 依赖所有用户故事。

## Implementation Strategy (实施策略)

1.  **并行执行**: US2, US1, US3, US4 高度独立，可以任意顺序或并行实施。
2.  **TDD (测试驱动开发)**: 在实现之前或同时编写单元测试（如 `decimal.test.ts`），确保符合 DSL 接口。
3.  **可仿真检查**: 持续验证测试在 Node.js 中运行无错误。

---

## 🎉 完成情况总结

### ✅ 已完成的核心功能

#### 1. **基础设施 (100%)**
- ✅ Monorepo 配置 (`pnpm-workspace.yaml`, 根 `tsconfig.json`)
- ✅ Runtime 包结构和构建配置 (`tsup`, `vitest`)
- ✅ TypeScript 声明文件生成 (`.d.ts`)

#### 2. **运行时原语 (100%)**
- ✅ `Decimal`: 高精度计算，基于 `decimal.js-light`
- ✅ `SecurityContext`: 基于 `AsyncLocalStorage` 的安全上下文传播
- ✅ `Repo<T>`: 仓储接口定义
- ✅ `EventBus`: 事件总线接口
- ✅ `Hooks`: 钩子注册表接口
- ✅ `DecimalConstructor`: 可注入的 Decimal 构造器类型

#### 3. **仓储层 (100%)**
- ✅ `InMemoryRepo<T>`: 内存仓储实现，支持 CRUD 和分页
- ✅ `RepoFactory`: 仓储工厂，支持动态注册和获取
- ✅ `Decimal` 序列化/反序列化支持（在 `save/findById` 中）

#### 4. **事件总线 (100%)**
- ✅ `LocalEventBus`: 支持通配符 (`*`) 的事件订阅
- ✅ 异步事件处理
- ✅ 多监听器支持

#### 5. **钩子系统 (100%)**
- ✅ `HookRegistry`: 全局和实例级钩子注册
- ✅ `before/after` 钩子执行顺序
- ✅ 集成到 `InMemoryRepo` 的 `save` 操作

#### 6. **IoC 容器与依赖注入 (100%)** 🆕
- ✅ `IocContainer`: 轻量级 IoC 容器
  - 支持类、实例、工厂函数注册
  - 支持构造函数注入和属性注入
  - 单例模式支持
- ✅ `RuntimeBootstrap`: 运行时引导器
  - 自动读取 `@Inject` 元数据
  - 自动注册基础设施组件
  - 自动配置 `RepoFactory`
- ✅ 元数据系统：`metadataStore` 从 `@ai-builder/dsl` 导出

#### 7. **示例项目 (100%)**
- ✅ `examples/order-management`: 订单管理示例
  - `Order.model.ts`: 实体定义（Customer, Product, Order, OrderLine）
  - `Order.domain.ts`: 领域逻辑（OrderService）
  - `Order.app.ts`: 应用服务（ProductAPI, CustomerAPI, OrderAPI）
  - `main.ts`: 演示 RuntimeBootstrap 的使用
- ✅ 使用 `@Inject` 装饰器进行依赖注入
- ✅ 使用 `DecimalConstructor` 注入 Decimal 构造器

#### 8. **架构约束与质量保证 (100%)** 🆕
- ✅ **ESLint 插件** (`@ai-builder/eslint-plugin`):
  - `no-async-in-domain`: 禁止 Domain 层使用 `async/await`
  - `no-this-in-domain`: 禁止 Domain 层使用 `this`
  - `model-fields-only`: Model 层只能包含字段定义
  - `use-inject-decorator`: 推荐使用 `@Inject` 装饰器
  - `action-return-type`: 强制 `@Action` 方法返回 Promise
- ✅ **分层引用约束**:
  - Model 层不能引用 Domain/App/View 层
  - Domain 层不能引用 App/View 层
  - App 层不能引用 View 层
  - 禁止跨层的不安全操作（HTTP 请求、文件操作等）
- ✅ **Git Hooks**:
  - `husky + lint-staged`: 提交前自动 ESLint 检查
  - `.husky/pre-commit`: 自动运行 `lint-staged`
- ✅ **VSCode 集成**:
  - `.vscode/settings.json`: 配置 ESLint 自动修复
  - `.vscode/extensions.json`: 推荐安装 ESLint 扩展

#### 9. **测试覆盖 (100%)**
- ✅ `decimal.test.ts`: Decimal 运算测试
- ✅ `repo.test.ts`: InMemoryRepo CRUD 测试
- ✅ `factory.test.ts`: RepoFactory 注册测试
- ✅ `event-bus.test.ts`: EventBus 发布订阅测试
- ✅ `security.test.ts`: SecurityContext 传播测试
- ✅ `hooks.test.ts`: HookRegistry 执行顺序测试
- ✅ `bootstrap.test.ts`: RuntimeBootstrap 依赖注入测试 🆕
- ✅ `full-flow.test.ts`: 完整集成测试

#### 10. **文档 (90%)**
- ✅ `packages/dsl/README.md`: DSL 包使用文档
- ✅ `packages/runtime/README.md`: Runtime 包使用文档
- ✅ `examples/order-management/README.md`: 示例项目说明
- ✅ `docs/DSL语法限制实现说明.md`: 架构约束实现文档 🆕
- ✅ `.vscode/ESLINT_SETUP.md`: ESLint 配置和故障排除 🆕
- ⏳ `quickstart.md`: 快速开始指南（待创建）

### 🚀 额外实现的功能

除了原计划的功能，我们还额外实现了：

1. **依赖注入框架**: 完整的 IoC 容器和自动装配机制
2. **架构约束工具**: 自定义 ESLint 规则强制 DSL 分层架构
3. **开发体验优化**: Git Hooks、VSCode 配置、自动格式化
4. **命名规范强制**: 通过 ESLint `overrides` 强制 DSL 文件命名约定
5. **Decimal 注入**: 通过 `DecimalConstructor` 实现框架无关的 Decimal 使用

### 📊 测试结果

所有测试均通过：

```bash
pnpm test
# ✓ packages/runtime/tests/primitives/decimal.test.ts (6)
# ✓ packages/runtime/tests/repository/repo.test.ts (8)
# ✓ packages/runtime/tests/repository/factory.test.ts (3)
# ✓ packages/runtime/tests/event-bus/event-bus.test.ts (4)
# ✓ packages/runtime/tests/primitives/security.test.ts (3)
# ✓ packages/runtime/tests/hooks/hooks.test.ts (3)
# ✓ packages/runtime/tests/container/bootstrap.test.ts (5)
# ✓ packages/runtime/tests/integration/full-flow.test.ts (1)
#
# Test Files  8 passed (8)
#      Tests  33 passed (33)
```

### 🔄 未完成的任务

- [ ] T032 [Doc] 创建 `quickstart.md` 快速开始指南

### 📝 下一步计划

根据架构白皮书，下一阶段应该是：

1. **UI DSL 层** (`@ai-builder/dsl/ui` 和 `@ai-builder/dsl/std-ui`)
   - 实现响应式原语 (`useState`, `useComputed`, `useWatch`)
   - 实现生命周期钩子 (`useEffect`, `onMounted`)
   - 实现路由能力 (`useRouter`, `useRoute`)
   - 定义标准 UI 组件协议 (`Page`, `Table`, `Form`, `Button` 等)
   - 创建 `.view.tsx` 示例文件

2. **编译器核心** (`@ai-builder/compiler`)
   - 实现 AST 解析器 (基于 `ts-morph`)
   - 实现元数据提取器
   - 实现代码生成器（Java/Vue/React）

3. **可视化编辑器** (`@ai-builder/studio`)
   - 实体关系图编辑器
   - 表单设计器
   - 流程编排器
