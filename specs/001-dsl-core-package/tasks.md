# Tasks: @ai-builder/dsl Core Package

**Branch**: `001-dsl-core-package` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup
*目标：初始化现代 TypeScript 5.0+ 库的包结构和配置。*

- [x] T001 初始化包目录 `packages/dsl` 和 `packages/dsl/src`
- [x] T002 创建 `packages/dsl/package.json`，配置正确的 exports、scripts 和 `sideEffects: false`
- [x] T003 创建 `packages/dsl/tsconfig.json`，启用 Stage 3 装饰器 (`experimentalDecorators: false`)
- [x] T004 创建 `packages/dsl/tsup.config.ts`，配置支持 tree-shaking 的 ESM/CJS 构建
- [x] T005 创建 `packages/dsl/vitest.config.ts` 用于单元测试
- [x] T006 创建 `packages/dsl/.gitignore` 和 `packages/dsl/README.md` 占位文件

## Phase 2: Foundational
*目标：建立内部结构和特定用户故事所需的通用工具。*

- [x] T007 创建 `packages/dsl/src/index.ts` 作为主入口点
- [x] T008 创建 `packages/dsl/src/utils/type-helpers.ts` 用于内部类型工具（如果需要）
- [x] T009 初始化模块目录：在 `packages/dsl/src` 中创建 `decorators`、`types`、`primitives`

## Phase 3: User Story 1 - Model Decorators
*目标：实现用于定义数据模型和实体关系的装饰器。*

- [x] T010 [US1] 在 `packages/dsl/src/decorators/entity.ts` 中实现 `Entity` 和 `EntityOptions`
- [x] T011 [US1] 在 `packages/dsl/src/decorators/entity.ts` 中实现 `Field` 和 `FieldOptions`
- [x] T012 [P] [US1] 在 `packages/dsl/src/decorators/relation.ts` 中实现 `Composition` 和 `Association` 装饰器
- [x] T013 [P] [US1] 在 `packages/dsl/src/decorators/validation.ts` 中实现 `Validation` 装饰器
- [x] T014 [US1] 在 `packages/dsl/src/decorators/index.ts` 中导出模型装饰器
- [x] T015 [US1] 在 `packages/dsl/tests/decorators/entity.test.ts` 中创建模型装饰器的单元测试
- [x] T016 [P] [US1] 在 `packages/dsl/tests/decorators/relation.test.ts` 中创建关系装饰器的单元测试

## Phase 4: User Story 2 - Service Decorators
*目标：实现用于定义业务逻辑、服务和动作的装饰器。*

- [x] T017 [US2] 在 `packages/dsl/src/decorators/service.ts` 中实现 `DomainLogic` 和 `AppService` 装饰器
- [x] T018 [P] [US2] 在 `packages/dsl/src/decorators/action.ts` 中实现 `Action` 和 `Rule` 装饰器
- [x] T019 [P] [US2] 在 `packages/dsl/src/decorators/action.ts` 中实现 `Inject` 和 `Expose` 装饰器
- [x] T020 [US2] 在 `packages/dsl/src/decorators/index.ts` 中导出服务装饰器
- [x] T021 [US2] 在 `packages/dsl/tests/decorators/service.test.ts` 中创建服务装饰器的单元测试
- [x] T022 [P] [US2] 在 `packages/dsl/tests/decorators/action.test.ts` 中创建动作装饰器的单元测试

## Phase 5: User Story 3 - Type System
*目标：实现用于 DTO 生成和分页的类型工具。*

- [x] T023 [US3] 在 `packages/dsl/src/types/dto.ts` 中实现 DTO 类型（`Command`, `View`, `Event`）
- [x] T024 [P] [US3] 在 `packages/dsl/src/types/dto.ts` 中实现 `CreateCommand`, `UpdateCommand`, `DetailView` 辅助工具
- [x] T025 [P] [US3] 在 `packages/dsl/src/types/pagination.ts` 中实现 `Query`, `PageParam`, `PageResult`
- [x] T026 [US3] 在 `packages/dsl/src/types/index.ts` 中导出类型
- [x] T027 [US3] 在 `packages/dsl/tests/types/dto.test.ts` 中创建类型测试（使用 `tsd` 或标准编译检查）

## Phase 6: User Story 4 - Runtime Primitives
*目标：定义运行时能力的接口（实现由 @ai-builder/runtime 提供）。*

- [x] T028 [US4] 在 `packages/dsl/src/primitives/decimal.ts` 中定义 `Decimal` 接口和值声明
- [x] T029 [P] [US4] 在 `packages/dsl/src/primitives/repo.ts` 中定义 `Repo` 接口
- [x] T030 [P] [US4] 在 `packages/dsl/src/primitives/event-bus.ts` 中定义 `EventBus` 接口
- [x] T031 [P] [US4] 在 `packages/dsl/src/primitives/hooks.ts` 中定义 `Hooks` 接口
- [x] T032 [US4] 在 `packages/dsl/src/primitives/index.ts` 中导出原语
- [x] T033 [US4] 在 `packages/dsl/tests/primitives/primitives.test.ts` 中创建验证测试

## Final Phase: Polish & Cross-Cutting
*目标：验证构建产物、tree-shaking 和文档。*

- [x] T034 验证 `dist/` 输出包含 ESM 和 CJS 格式
- [x] T035 在 `packages/dsl/tests/integration/tree-shaking.test.ts` 中创建 tree-shaking 验证测试
- [x] T036 更新 `packages/dsl/index.ts` 以导出所有模块
- [x] T037 完成 `packages/dsl/README.md`，包含安装和基本使用说明

## Dependencies

- **US1**: Depends on Phase 1 & 2
- **US2**: Depends on Phase 1 & 2
- **US3**: Independent (can start after Phase 1)
- **US4**: Independent (can start after Phase 1)
- **Tree-shaking check**: Depends on all implementation tasks

## Implementation Strategy

1.  **Strictly Typed**: All decorators must use `ClassDecoratorContext` etc. from TS 5.0.
2.  **Zero Runtime**: Decorators should return `void` or the original target where possible, only collecting metadata if absolutely necessary (or relying on external metadata collection strategies defined in `research.md`). *Correction based on research.md*: The plan is to collect metadata. We will likely need a simple internal metadata store if we want to test "recognition". However, the spec emphasizes "decorators as type markers". If metadata collection is needed for the CLI, it might be done via static analysis of the source code, OR via these decorators pushing to a global store. The research notes suggest "MetadataStore.registerEntity". We will implement this lightweight registration logic.
3.  **Parallelism**: US1, US2, US3, US4 are largely independent modules within the same package.
