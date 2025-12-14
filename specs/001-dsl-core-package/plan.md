# Implementation Plan: @ai-builder/dsl Core Package

**Branch**: `001-dsl-core-package` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-dsl-core-package/spec.md`

## Summary

本特性实现 `@ai-builder/dsl` 核心包，提供 TypeScript 装饰器、类型工具和运行时原语接口，作为 ai-builder MDA 工具链的基础 SDK。核心能力包括：

1. **模型装饰器**：`@Entity`, `@Field`, `@Composition`, `@Association`, `@Validation` 用于定义数据模型
2. **服务装饰器**：`@DomainLogic`, `@AppService`, `@Action`, `@Rule`, `@Inject`, `@Expose` 用于定义业务逻辑
3. **类型系统**：`Command`, `View`, `Query`, `Event`, `PageParam` 类型工具快速派生 DTO
4. **运行时原语接口**：`Decimal`, `Repo`, `EventBus`, `Hooks` 的类型定义（实现由 `@ai-builder/runtime` 提供）

**技术策略**：采用纯 TypeScript 类型定义实现装饰器（零运行时逻辑），通过 tsup 构建多格式产物（ESM/CJS），确保完整的类型推断和 tree-shaking 支持。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: 
- 开发依赖：`typescript@^5.0.0`, `tsup@^8.0.0`, `vitest@^1.0.0`
- 生产依赖：无（零运行时依赖）

**Storage**: N/A（本包不涉及存储）  
**Testing**: Vitest（类型测试 + 单元测试）  
**Target Platform**: Node.js 18+ / 浏览器（通过编译器生成代码使用）  
**Project Type**: 单包（Monorepo 中的一个子包）  
**Performance Goals**: 
- 包体积 < 5KB (minified + gzipped)
- 类型推断时间 < 100ms（大型项目）
- tree-shaking 减少至少 30% 未使用代码

**Constraints**: 
- 零运行时依赖（装饰器仅作为类型标记）
- 必须支持完整的 TypeScript 类型推断
- 必须支持 ES Module 和 CommonJS 两种格式
- 所有 API 必须有完整的 JSDoc 注释

**Scale/Scope**: 
- 导出约 15 个装饰器
- 导出约 5 个类型工具
- 导出约 4 个运行时原语接口
- 预计被数百个 DSL 文件引用

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ 宪法合规性检查

| 原则 | 检查项 | 状态 | 说明 |
|------|--------|------|------|
| **I. DSL-First, Zero Runtime Magic** | 装饰器零运行时逻辑 | ✅ 通过 | 装饰器仅作为类型标记，不执行任何运行时代码 |
| **I. DSL-First, Zero Runtime Magic** | 生成代码透明可控 | ✅ 通过 | 本包只提供类型定义，不影响生成代码 |
| **II. 可仿真优先** | 运行时接口定义清晰 | ✅ 通过 | `Decimal`, `Repo`, `EventBus`, `Hooks` 接口定义明确 |
| **III. 生成代码质量等同手写** | 类型定义完整 | ✅ 通过 | 所有 API 都有完整的 TypeScript 类型定义 |
| **III. 生成代码质量等同手写** | JSDoc 注释完整 | ⚠️ 待实现 | 需在实现时添加完整的 JSDoc |
| **V. 测试驱动，文档同步** | 单元测试覆盖率 > 90% | ⚠️ 待实现 | Phase 2 实现测试 |
| **V. 测试驱动，文档同步** | API 文档完整 | ⚠️ 待实现 | Phase 1 输出 quickstart.md |

**结论**：核心架构原则符合宪法要求，待实现项将在各 Phase 中完成。

## Project Structure

### Documentation (this feature)

```text
specs/001-dsl-core-package/
├── spec.md              # 功能规范（已完成）
├── plan.md              # 本文件 - 技术实施计划
├── research.md          # Phase 0 - 技术调研输出
├── data-model.md        # Phase 1 - 数据模型设计输出
├── quickstart.md        # Phase 1 - 快速开始文档输出
├── contracts/           # Phase 1 - 接口契约输出
│   ├── decorators.ts    # 装饰器类型定义
│   ├── types.ts         # 类型工具定义
│   └── primitives.ts    # 运行时原语接口
├── checklists/          # 质量检查清单
│   └── requirements.md  # 需求检查清单（已完成）
└── tasks.md             # Phase 2 - 任务分解（/speckit.tasks 输出）
```

### Source Code (repository root)

```text
packages/dsl/                # @ai-builder/dsl 核心包
├── package.json             # 包配置（name, version, exports）
├── tsconfig.json            # TypeScript 配置
├── tsup.config.ts           # 构建配置
├── README.md                # 包文档
│
├── src/                     # 源代码
│   ├── index.ts             # 主入口（导出所有 API）
│   │
│   ├── decorators/          # 装饰器定义
│   │   ├── index.ts         # 装饰器统一导出
│   │   ├── entity.ts        # @Entity, @Field, @DbField
│   │   ├── relation.ts      # @Composition, @Association
│   │   ├── validation.ts    # @Validation
│   │   ├── service.ts       # @DomainLogic, @AppService
│   │   └── action.ts        # @Action, @Rule, @Inject, @Expose
│   │
│   ├── types/               # 类型系统
│   │   ├── index.ts         # 类型统一导出
│   │   ├── dto.ts           # Command, View, Query, Event
│   │   └── pagination.ts    # PageParam, PageResult
│   │
│   ├── primitives/          # 运行时原语接口
│   │   ├── index.ts         # 原语统一导出
│   │   ├── decimal.ts       # Decimal 接口
│   │   ├── repo.ts          # Repo<T> 接口
│   │   ├── event-bus.ts     # EventBus 接口
│   │   └── hooks.ts         # Hooks 接口
│   │
│   └── utils/               # 工具类型（可选）
│       └── type-helpers.ts  # TypeScript 类型辅助工具
│
├── tests/                   # 测试
│   ├── decorators/          # 装饰器测试
│   │   ├── entity.test.ts
│   │   ├── relation.test.ts
│   │   ├── validation.test.ts
│   │   ├── service.test.ts
│   │   └── action.test.ts
│   │
│   ├── types/               # 类型系统测试
│   │   ├── dto.test.ts
│   │   └── pagination.test.ts
│   │
│   ├── primitives/          # 运行时原语接口测试
│   │   ├── decimal.test.ts
│   │   ├── repo.test.ts
│   │   ├── event-bus.test.ts
│   │   └── hooks.test.ts
│   │
│   └── integration/         # 集成测试
│       └── full-example.test.ts  # 完整 DSL 示例测试
│
└── dist/                    # 构建产物（Git Ignored）
    ├── index.js             # CJS 格式
    ├── index.mjs            # ESM 格式
    ├── index.d.ts           # TypeScript 类型定义
    └── index.d.mts          # ESM 类型定义
```

**Structure Decision**: 采用 Monorepo 中的单包结构（`packages/dsl/`）。源代码按功能模块组织（decorators/types/primitives），每个模块独立导出，支持按需引入和 tree-shaking。测试目录镜像源代码结构，确保每个模块都有对应的测试。

## Complexity Tracking

本特性无宪法违规项，无需复杂性追踪。

---

## Phase 0: Research & Validation

**目标**: 调研 TypeScript 装饰器最佳实践、类型推断技巧、tree-shaking 优化方案，验证技术可行性。

### 0.1 技术调研任务

1. **TypeScript 装饰器机制调研**
   - 调研 TypeScript 5.x 的装饰器实现（legacy vs stage 3）
   - 调研如何实现零运行时逻辑的装饰器（仅作为类型标记）
   - 调研装饰器的类型推断限制和解决方案
   - 输出：装饰器实现策略文档

2. **类型推断与泛型调研**
   - 调研 TypeScript 高级类型技巧（条件类型、映射类型、infer）
   - 调研如何保持装饰器前后的类型一致性
   - 调研 `Repo<T>` 等泛型接口的最佳实践
   - 输出：类型系统设计文档

3. **Tree-shaking 优化调研**
   - 调研 tsup 的 tree-shaking 配置
   - 调研如何标记副作用（package.json sideEffects）
   - 调研如何验证 tree-shaking 效果
   - 输出：构建配置策略文档

4. **参考实现调研**
   - 调研 TypeORM、MikroORM 的装饰器设计
   - 调研 NestJS 的依赖注入装饰器实现
   - 调研 class-validator 的验证装饰器设计
   - 输出：参考实现对比表

### 0.2 可行性验证（PoC）

创建最小化验证项目（`packages/dsl-poc/`）：

```typescript
// 验证装饰器零运行时逻辑
function Entity(options: { table: string }) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return constructor; // 不修改构造函数
  };
}

// 验证类型推断保持
@Entity({ table: 'users' })
class User {
  id: number;
  name: string;
}

// 验证：User 类型是否保持不变
const user: User = new User();
```

**验收标准**：
- PoC 证明装饰器可以零运行时逻辑实现
- PoC 证明类型推断完全保持
- PoC 证明 tree-shaking 能正确移除未使用代码

### 0.3 输出物

- `specs/001-dsl-core-package/research.md`：技术调研报告
  - TypeScript 装饰器实现策略
  - 类型推断技巧总结
  - Tree-shaking 配置方案
  - 参考实现对比分析
  - PoC 验证结果

---

## Phase 1: Design & Contracts

**目标**: 设计详细的接口契约、数据模型和快速开始文档。

### 1.1 接口契约设计

创建 `specs/001-dsl-core-package/contracts/` 目录，定义所有导出 API 的类型签名：

#### 1.1.1 装饰器契约 (`contracts/decorators.ts`)

```typescript
/**
 * 实体装饰器选项
 */
export interface EntityOptions {
  /** 数据库表名 */
  table: string;
  /** 表注释 */
  comment?: string;
}

/**
 * 实体装饰器
 * @param options - 实体配置选项
 * @returns 类装饰器
 * @example
 * ```typescript
 * @Entity({ table: 'users', comment: '用户表' })
 * class User {
 *   id: number;
 *   name: string;
 * }
 * ```
 */
export function Entity(options: EntityOptions): ClassDecorator;

/**
 * 字段装饰器选项
 */
export interface FieldOptions {
  /** 字段标签（用于 UI 展示） */
  label: string;
  /** 是否可为空 */
  nullable?: boolean;
  /** 是否支持国际化 */
  i18n?: boolean;
}

/**
 * 字段装饰器
 * @param options - 字段配置选项
 * @returns 属性装饰器
 */
export function Field(options: FieldOptions): PropertyDecorator;

// ... 其他装饰器契约
```

#### 1.1.2 类型工具契约 (`contracts/types.ts`)

```typescript
/**
 * Command 基类 - 用于写操作入参
 */
export type Command = {};

/**
 * View 基类 - 用于读操作出参
 */
export type View = {};

/**
 * Query 基类 - 用于查询参数
 */
export interface Query {
  /** 页码（从 1 开始） */
  pageNo?: number;
  /** 每页大小 */
  pageSize?: number;
}

/**
 * PageParam 基类（Query 的别名）
 */
export type PageParam = Query;

/**
 * 分页结果
 */
export interface PageResult<T> {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNo: number;
  /** 每页大小 */
  pageSize: number;
}

// ... 其他类型工具契约
```

#### 1.1.3 运行时原语契约 (`contracts/primitives.ts`)

```typescript
/**
 * 高精度数值类型（接口定义）
 * 实现由 @ai-builder/runtime 提供
 */
export interface Decimal {
  /** 加法 */
  add(other: Decimal | number | string): Decimal;
  /** 减法 */
  sub(other: Decimal | number | string): Decimal;
  /** 乘法 */
  mul(other: Decimal | number | string): Decimal;
  /** 除法 */
  div(other: Decimal | number | string): Decimal;
  /** 转为字符串 */
  toString(): string;
  /** 转为数字 */
  toNumber(): number;
}

/**
 * Decimal 构造函数
 */
export interface DecimalConstructor {
  new (value: number | string): Decimal;
}

export const Decimal: DecimalConstructor;

/**
 * 仓储接口（泛型）
 */
export interface Repo<T> {
  /** 根据 ID 查询 */
  findById(id: any): Promise<T | null>;
  /** 根据条件查询单条 */
  findOne(query: any): Promise<T | null>;
  /** 根据条件查询多条 */
  findAll(query?: any): Promise<T[]>;
  /** 保存实体 */
  save(entity: T): Promise<T>;
  /** 更新实体 */
  update(id: any, data: Partial<T>): Promise<T>;
  /** 删除实体 */
  delete(id: any): Promise<boolean>;
}

// ... 其他运行时原语契约
```

### 1.2 数据模型设计

创建 `specs/001-dsl-core-package/data-model.md`：

- **装饰器元数据结构**：描述装饰器参数的数据结构
- **类型关系图**：描述 Command/View/Query/Event 的继承和组合关系
- **运行时原语依赖关系**：描述各原语之间的依赖

### 1.3 快速开始文档

创建 `specs/001-dsl-core-package/quickstart.md`：

```markdown
# @ai-builder/dsl 快速开始

## 安装

```bash
pnpm add @ai-builder/dsl
```

## 定义数据模型

```typescript
import { Entity, Field, Validation } from '@ai-builder/dsl';

@Entity({ table: 'users' })
export class User {
  @Field({ label: 'ID' })
  id: number;

  @Field({ label: '用户名' })
  @Validation({ required: true, max: 50 })
  username: string;

  @Field({ label: '邮箱' })
  @Validation({ email: true })
  email: string;
}
```

## 定义业务逻辑

```typescript
import { DomainLogic, Action } from '@ai-builder/dsl';
import { Decimal } from '@ai-builder/dsl/primitives';

@DomainLogic
export class OrderLogic {
  @Action
  static calculateTotal(items: OrderItem[]): Decimal {
    let total = new Decimal(0);
    for (const item of items) {
      total = total.add(item.price.mul(item.quantity));
    }
    return total;
  }
}
```

## API 文档

完整 API 文档请查看：[API Reference](./api-reference.md)
```

### 1.4 输出物

- `specs/001-dsl-core-package/contracts/`：所有接口契约的 TypeScript 定义
- `specs/001-dsl-core-package/data-model.md`：数据模型设计文档
- `specs/001-dsl-core-package/quickstart.md`：快速开始文档

---

## Phase 2: Task Breakdown

**目标**: 将实现工作分解为可执行的任务列表。

**注意**: 本阶段由 `/speckit.tasks` 命令完成，不在本计划中展开。

任务分解将基于以下模块：

1. **包基础设施**
   - 初始化 `packages/dsl/` 目录
   - 配置 `package.json`、`tsconfig.json`、`tsup.config.ts`
   - 配置 ESLint、Prettier、Vitest

2. **装饰器实现**
   - 实现模型装饰器（Entity、Field、DbField）
   - 实现关系装饰器（Composition、Association）
   - 实现验证装饰器（Validation）
   - 实现服务装饰器（DomainLogic、AppService）
   - 实现动作装饰器（Action、Rule、Inject、Expose）

3. **类型系统实现**
   - 实现 DTO 基础类型（Command、View、Query、Event）
   - 实现分页类型（PageParam、PageResult）
   - 实现类型辅助工具

4. **运行时原语接口**
   - 定义 Decimal 接口
   - 定义 Repo 接口
   - 定义 EventBus 接口
   - 定义 Hooks 接口

5. **测试与文档**
   - 编写单元测试（覆盖率 > 90%）
   - 编写集成测试（完整 DSL 示例）
   - 编写 API 文档
   - 编写 README

6. **构建与发布**
   - 配置构建流程
   - 验证 tree-shaking
   - 验证包体积 < 5KB
   - 发布到 NPM（内部使用可选）

---

## Risk Assessment

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|----------|
| TypeScript 装饰器类型推断不完整 | 高 | 中 | Phase 0 PoC 验证，必要时使用类型断言辅助 |
| Tree-shaking 效果不理想 | 中 | 低 | 使用 tsup 的 splitting 和 sideEffects 配置优化 |
| 运行时原语接口与实现不匹配 | 高 | 低 | 与 `@ai-builder/runtime` 包开发者紧密协作，接口先行设计 |
| 包体积超过 5KB 限制 | 中 | 低 | 定期检查构建产物大小，必要时拆分子包 |
| 类型定义过于复杂导致 IDE 性能下降 | 中 | 中 | 限制类型嵌套深度，使用类型别名简化复杂类型 |

---

## Dependencies

### 上游依赖（本包依赖的其他包）

- 无（本包是基础 SDK，不依赖其他 ai-builder 包）

### 下游依赖（依赖本包的其他包）

- `@ai-builder/dsl-ui`：前端原语包，依赖本包的类型定义
- `@ai-builder/runtime`：运行时仿真包，实现本包定义的接口
- `@ai-builder/cli`：CLI 工具，用于读取本包的装饰器元数据
- `@ai-builder/core`：编译器核心，解析本包的装饰器
- `@qwe8652591/eslint-plugin`：ESLint 插件，检查本包装饰器的使用规范

**关键依赖关系**：本包必须在所有其他包之前完成，因为它定义了整个 DSL 的基础类型和接口。

---

## Success Metrics

| 指标 | 目标值 | 验证方法 |
|------|--------|----------|
| 包体积（minified + gzipped） | < 5KB | 构建后检查 `dist/` 目录，使用 `size-limit` 工具验证 |
| TypeScript 类型覆盖率 | 100% | 所有导出 API 都有类型定义，`tsc --noEmit` 无错误 |
| 单元测试覆盖率 | > 90% | Vitest coverage 报告 |
| Tree-shaking 效果 | 减少 > 30% | 创建测试项目，只引入部分 API，验证打包体积 |
| 类型推断准确性 | 100% | 所有装饰器使用后类型保持不变，IDE 智能提示正确 |
| JSDoc 注释完整性 | 100% | 所有导出 API 都有 JSDoc，生成的文档完整 |
| 开发者上手时间 | < 5 分钟 | 按照 quickstart.md 完成基础 Entity 定义 |

---

## Timeline Estimate

| Phase | 预计工作量 | 说明 |
|-------|-----------|------|
| Phase 0: Research & Validation | 2-3 天 | 技术调研 + PoC 验证 |
| Phase 1: Design & Contracts | 2-3 天 | 接口设计 + 文档编写 |
| Phase 2: Task Breakdown | 1 天 | 使用 `/speckit.tasks` 生成任务列表 |
| Implementation (估算) | 5-7 天 | 实现所有装饰器、类型和接口 |
| Testing & Documentation | 2-3 天 | 测试覆盖率 + 文档完善 |
| **总计** | **12-17 天** | 约 2.5-3.5 周 |

**注意**：本估算假设开发者熟悉 TypeScript 高级特性。实际时间可能因团队经验和优先级调整而变化。

---

## Next Steps

1. ✅ **已完成**: 创建功能规范 (`spec.md`)
2. ✅ **已完成**: 创建技术计划 (`plan.md` - 本文件)
3. ⏭️ **下一步**: 执行 Phase 0 - 技术调研与验证
   - 调研 TypeScript 装饰器实现
   - 创建 PoC 验证项目
   - 输出 `research.md` 文档
4. ⏭️ **然后**: 执行 Phase 1 - 设计接口契约
   - 定义所有 API 的 TypeScript 签名
   - 输出 `contracts/` 目录和 `quickstart.md`
5. ⏭️ **最后**: 使用 `/speckit.tasks` 生成任务分解
   - 将实现工作拆分为可执行任务
   - 输出 `tasks.md` 文件

**建议顺序**：按照 Phase 0 → Phase 1 → Phase 2 的顺序执行，确保每个阶段的输出物都经过审查后再进入下一阶段。






