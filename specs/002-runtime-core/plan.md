# 实施计划 - @ai-builder/runtime 核心包

**分支**: `002-runtime-core`
**规范**: [spec.md](./spec.md)
**宪法**: [constitution.md](../../.specify/memory/constitution.md)

## 摘要

本计划概述了 `@ai-builder/runtime` 核心包的实施方案。该包提供了 `@ai-builder/dsl` (Layer 1) 中定义接口的具体实现。遵循 "Simulatable-First"（可仿真优先）原则（宪法第二条），该运行时将支持 DSL 代码在 Node.js 环境中使用内存数据结构执行，从而促进无需重型外部依赖的快速开发和测试。

## 技术上下文

- **现有包**: `@ai-builder/dsl` (Layer 1) 定义了所有接口 (`Repo`, `EventBus`, `SecurityContext`, `Decimal`, `Hooks`)。
- **新包**: `packages/runtime` (Layer 2) 实现这些接口。
- **技术栈**: TypeScript 5.x, pnpm workspace (Monorepo)。
- **依赖库**:
  - `decimal.js-light` (或类似库) 用于 `Decimal` 实现。
  - `mitt` 用于轻量级 `EventBus`。
  - 原生 `Map` 用于 `InMemoryRepo`。
  - Node.js `AsyncLocalStorage` 用于 `SecurityContext`。
- **测试**: Vitest (单元测试 & 集成测试)。

## 宪法检查

### I. DSL-First, Zero Runtime Magic (DSL 优先，零运行时魔法)
- **合规性**: 运行时包实现了 DSL 定义的接口，但不改变 DSL 定义本身。它提供了原则中提到的 "runtime polyfill"，允许在 Node.js 中执行。

### II. Simulatable-First (可仿真优先)
- **合规性**: 整个特性是 "Simulatable-First" 原则第二阶段（"实现 `@ai-builder/runtime` (Node.js 仿真环境)"）的具体实现。它提供了仿真所需的 InMemoryRepo、EventBus 和 Hooks。

### III. Generated Code Quality (生成代码质量)
- **相关性**: 不适用于本阶段（运行时实现，而非代码生成）。

### IV. Plugin-First Architecture (插件化架构)
- **合规性**: 运行时被设计为独立包。未来的插件（例如真实的数据库 Repo）可以实现相同的接口，保持可插拔特性。

### V. Test & Docs as First-Class Citizens (测试与文档作为一等公民)
- **合规性**: 计划包含全面的单元测试和集成测试 (SC-002, SC-004) 以及文档更新任务。

## 项目结构

```
packages/runtime/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── src/
│   ├── index.ts                  # 主入口点
│   ├── primitives/
│   │   ├── decimal.ts            # Decimal 实现
│   │   ├── security.ts           # SecurityContext 实现
│   │   └── index.ts
│   ├── repository/
│   │   ├── in-memory-repo.ts     # InMemoryRepo 实现
│   │   ├── repo-factory.ts       # Repo 工厂/注册表
│   │   └── index.ts
│   ├── event-bus/
│   │   ├── local-event-bus.ts    # LocalEventBus 实现
│   │   └── index.ts
│   └── hooks/
│       ├── hook-registry.ts      # Hooks 实现
│       └── index.ts
└── tests/
    ├── primitives/
    ├── repository/
    ├── event-bus/
    ├── integration/
    └── setup.ts
```

## 复杂度跟踪

- **复杂度得分**: 3/10 (低 - 已定义接口的标准实现)
- **风险等级**: 低

## Phase 0: 调研 (技术决策)

*目标: 确定库的选择和实施细节。*

- [ ] **调研任务**: 评估 `decimal.js-light` vs `big.js` 用于 `Decimal` 实现。
  - *标准*: 包大小、与 DSL 接口的 API 兼容性、精度。
- [ ] **调研任务**: 评估 `mitt` vs `eventemitter3` 用于 `EventBus`。
  - *标准*: 对通配符订阅的支持 (FR-007)、性能、大小。
- [ ] **调研任务**: 设计 `RepoFactory` 模式以实现无缝注入。
  - *目标*: 用户如何获取 Repo？`RepoFactory.get(User)`？

## Phase 1: 设计与契约

*目标: 定义运行时包的内部架构和 API 表面。*

- [ ] **设计**: 创建 `data-model.md` 将 DSL 接口映射到运行时类。
- [ ] **契约**: 定义 `@ai-builder/runtime` 的公开 API 导出。
- [ ] **快速开始**: 创建在测试环境中设置运行时的使用指南。

## Phase 2: 实施细分

*目标: 分步实施任务。*

### 步骤 1: 包初始化
- 初始化 `packages/runtime`。
- 配置 `tsup`, `vitest`, `tsconfig`。
- 添加依赖 (`@ai-builder/dsl`, `decimal.js-light`, `mitt` 等)。

### 步骤 2: 原语实现
- 实现 `Decimal` 包装器。
- 实现 `ThreadLocalSecurityContext`。
- **验证**: 数学精度和上下文传播的单元测试。

### 步骤 3: 事件总线与钩子
- 实现 `LocalEventBus`。
- 实现 `HookRegistry`。
- **验证**: 测试事件发布/订阅和钩子执行顺序。

### 步骤 4: 仓储实现
- 实现 `InMemoryRepo<T>`。
- 实现 `RepoFactory`。
- **验证**: CRUD 测试、分页测试。

### 步骤 5: 集成与验证
- 创建模拟完整流程的集成测试:
  - 设置 SecurityContext。
  - Service 保存实体到 Repo (触发钩子)。
  - Service 发布事件。
  - 订阅者接收事件。
- 验证 "Simulatable-First" 成功标准。

## 风险评估

1.  **风险**: `InMemoryRepo` 的查询能力可能相比 SQL 过于有限。
    -   **缓解**: 实现一个支持常见操作符 (eq, gt, lt, like) 的基础 "过滤器匹配器"，覆盖 80% 的测试用例。记录限制。
2.  **风险**: DSL 和 Runtime 之间产生循环依赖。
    -   **缓解**: Runtime 依赖 DSL。DSL **绝不能** 依赖 Runtime。确保严格的单向依赖。

## 依赖关系

- **@ai-builder/dsl**: 必须在本地链接 (workspace) 并已构建。

## 成功指标

- **功能**: 100% 的 DSL 原语拥有运行时实现。
- **性能**: 集成测试套件运行时间 < 100ms。
- **独立性**: 不需要外部数据库。

## 时间预估

- **调研**: 0.5 天
- **实施**: 2 天
- **测试与完善**: 0.5 天
- **总计**: 3 天
