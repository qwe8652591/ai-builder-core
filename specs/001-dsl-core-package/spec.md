# Feature Specification: @ai-builder/dsl Core Package

**Feature Branch**: `001-dsl-core-package`  
**Created**: 2025-12-07  
**Status**: Draft  
**Input**: User description: "包含以下能力：1. 模型装饰器: @Entity, @Field, @Composition, @Association, @Validation 2. 服务装饰器: @DomainLogic, @AppService, @Action, @Rule, @Inject, @Expose 3. 类型系统: Command, View, Query, Event, PageParam 类型工具 4. 运行时原语: Decimal (高精度数值), Repo (仓储接口), EventBus (事件总线), Hooks (钩子系统) 约束：- 纯 TypeScript 实现，零运行时依赖（装饰器仅作为类型标记）- 所有装饰器必须支持完整的 TypeScript 类型推断 - 导出的 API 必须支持 tree-shaking"

## User Scenarios & Testing

### User Story 1 - 定义数据模型与实体关系 (Priority: P1)

作为 DSL 使用者，我需要使用装饰器定义数据库实体、字段属性和实体间关系，以便编译器能够生成对应的后端 DO 类、前端 Interface 和数据库 Schema。

**Why this priority**: 这是 MDA 架构的基础，所有其他功能都依赖于清晰的数据模型定义。没有模型定义，就无法进行业务逻辑开发和代码生成。

**Independent Test**: 可以通过创建一个简单的 Entity 类（如 `User`），使用 `@Entity`, `@Field`, `@Composition`, `@Association` 装饰器，验证类型推断是否正确，装饰器是否能被编译器正确识别和解析。

**Acceptance Scenarios**:

1. **Given** 一个空的 TypeScript 类，**When** 使用 `@Entity({ table: 'users' })` 装饰器标记类，**Then** TypeScript 编译器不报错，且类型推断保持完整
2. **Given** 一个实体类，**When** 使用 `@Field({ label: '用户名' })` 装饰器标记字段，**Then** 字段类型被正确推断，装饰器参数获得智能提示
3. **Given** 两个实体类 A 和 B，**When** 在 A 中使用 `@Composition` 装饰一个类型为 `B[]` 的字段，**Then** 类型关系被正确推断为组合关系
4. **Given** 两个实体类 A 和 B，**When** 在 A 中使用 `@Association` 装饰一个类型为 `B` 的字段，**Then** 类型关系被正确推断为关联关系
5. **Given** 一个字段，**When** 使用 `@Validation({ required: true, min: 1 })` 装饰器，**Then** 验证规则参数获得完整的类型检查和智能提示

---

### User Story 2 - 定义业务逻辑与服务 (Priority: P1)

作为 DSL 使用者，我需要使用装饰器定义领域逻辑和应用服务，以便区分纯业务逻辑（可前后端复用）和编排逻辑（仅后端执行），确保架构分层清晰。

**Why this priority**: 这是实现"逻辑同构"的核心能力，直接关系到 ai-builder 的核心价值主张（Single Source of Truth）。必须在早期建立。

**Independent Test**: 可以通过创建一个 `@DomainLogic` 类和一个 `@AppService` 类，分别使用 `@Action` 和 `@Rule` 装饰方法，验证装饰器能否被正确识别，类型推断是否准确。

**Acceptance Scenarios**:

1. **Given** 一个空的 TypeScript 类，**When** 使用 `@DomainLogic` 装饰器标记类，**Then** 类被识别为领域逻辑类，所有方法默认被认为是纯函数
2. **Given** 一个领域逻辑类，**When** 使用 `@Action` 装饰器标记方法，**Then** 方法被识别为业务动作，参数和返回值类型被完整推断
3. **Given** 一个领域逻辑类，**When** 使用 `@Rule` 装饰器标记校验方法，**Then** 方法被识别为校验规则
4. **Given** 一个空的 TypeScript 类，**When** 使用 `@AppService` 装饰器标记类，**Then** 类被识别为应用服务
5. **Given** 一个应用服务类，**When** 使用 `@Inject` 装饰器标记依赖字段，**Then** 依赖类型被正确推断
6. **Given** 一个应用服务方法，**When** 使用 `@Expose({ method: 'POST', path: '/api/xxx' })` 装饰器，**Then** API 元数据被正确识别

---

### User Story 3 - 使用类型工具快速派生 DTO (Priority: P2)

作为 DSL 使用者，我需要使用 `Command`, `View`, `Query`, `Event` 等类型工具，从实体类快速派生出请求/响应/查询/事件对象，以避免重复定义相同的字段。

**Why this priority**: 这是提升开发效率的关键能力，但不影响核心功能的实现。可以在 P1 完成后再实现。

**Independent Test**: 可以通过从一个 `Entity` 类派生出 `Command` 和 `View` 类型，验证类型工具是否正确工作，TypeScript 类型系统是否正确推断派生类型。

**Acceptance Scenarios**:

1. **Given** 一个实体类 `User`，**When** 使用 `Omit<User, 'id' | 'createdAt'>` 派生 `CreateUserCmd`，**Then** 派生类型包含除 `id` 和 `createdAt` 外的所有字段，且类型正确
2. **Given** 一个实体类 `User`，**When** 使用 `Pick<User, 'id' | 'username'>` 派生 `UserBriefView`，**Then** 派生类型只包含 `id` 和 `username` 字段
3. **Given** 一个 `PageParam` 基类，**When** 扩展它创建 `UserQuery`，**Then** 查询类自动包含 `pageNo` 和 `pageSize` 字段
4. **Given** 一个实体类，**When** 使用类型工具创建 `Event` 类型，**Then** 事件类型被正确推断

---

### User Story 4 - 使用运行时原语实现业务逻辑 (Priority: P1)

作为 DSL 使用者，我需要使用 `Decimal`, `Repo`, `EventBus`, `Hooks` 等运行时原语，在 DSL 代码中实现高精度计算、数据持久化、事件发布和钩子注入，且这些代码能在 Node.js 中直接运行（开发调试）。

**Why this priority**: 这是实现"可仿真优先"原则的关键，必须确保 DSL 代码能在 Node.js 中直接运行，支持开发者快速验证逻辑。

**Independent Test**: 可以通过编写一个使用 `Decimal` 进行金额计算、使用 `Repo` 进行数据查询、使用 `EventBus` 发布事件的简单逻辑，并在 Node.js 中直接运行，验证运行时原语是否工作正常。

**Acceptance Scenarios**:

1. **Given** 两个 `Decimal` 类型的数值，**When** 使用 `.add()`, `.mul()` 等方法进行计算，**Then** 计算结果精度正确，不丢失小数位
2. **Given** 一个实体类 `User`，**When** 使用 `Repo<User>.findById(id)` 查询数据，**Then** 返回类型被正确推断为 `Promise<User | null>`
3. **Given** 一个实体类，**When** 使用 `Repo<Entity>.save(entity)` 保存数据，**Then** 返回类型被正确推断为 `Promise<Entity>`
4. **Given** 一个事件对象，**When** 使用 `EventBus.emit(event)` 发布事件，**Then** 事件被正确发布，订阅者能收到
5. **Given** 一个业务方法，**When** 使用 `Hooks.on('beforeSave', handler)` 注册钩子，**Then** 钩子在目标方法执行前被触发

---

### Edge Cases

- 当装饰器参数类型错误时（如 `@Field({ label: 123 })`），TypeScript 编译器是否能正确报错？
- 当在 `@DomainLogic` 类中使用 `async/await` 时（违反纯函数约束），是否有 lint 规则检测并报错？
- 当使用 `Repo` 查询不存在的实体时，返回值应该是 `null` 还是抛出异常？
- 当 `Decimal` 类型与普通 `number` 类型混用时，TypeScript 类型系统是否能防止类型错误？
- 当装饰器嵌套超过 3 层时，类型推断是否仍然准确？
- 当模块被打包（如 webpack/rollup）时，未使用的装饰器和工具函数是否能被正确 tree-shake？

## Requirements

### Functional Requirements

#### 模型装饰器 (Model Decorators)

- **FR-001**: 包必须导出 `@Entity` 装饰器，用于标记数据库实体类，接受参数 `{ table: string, comment?: string }`
- **FR-002**: 包必须导出 `@Field` 装饰器，用于标记通用字段属性，接受参数 `{ label: string, nullable?: boolean, i18n?: boolean }`
- **FR-003**: 包必须导出 `@DbField` 装饰器，用于标记数据库物理属性，接受参数 `{ type?: string, primaryKey?: boolean, index?: boolean, unique?: boolean, default?: any, precision?: number, scale?: number }`
- **FR-004**: 包必须导出 `@Composition` 装饰器，用于标记组合关系（父子关系，级联操作），接受参数 `{ cascade?: string[], fetch?: 'EAGER' | 'LAZY' }`
- **FR-005**: 包必须导出 `@Association` 装饰器，用于标记关联关系（引用关系，无级联），接受参数 `{ to: () => EntityClass, on: (entity) => any }`
- **FR-006**: 包必须导出 `@Validation` 装饰器，用于标记校验规则，接受参数 `{ required?: boolean, min?: number, max?: number, email?: boolean, regex?: string }`

#### 服务装饰器 (Service Decorators)

- **FR-007**: 包必须导出 `@DomainLogic` 装饰器，用于标记纯领域逻辑类（无 IO 操作，可前后端复用）
- **FR-008**: 包必须导出 `@AppService` 装饰器，用于标记应用服务类（包含事务和编排逻辑，仅后端执行）
- **FR-009**: 包必须导出 `@Action` 装饰器，用于标记业务方法，接受参数 `{ transaction?: boolean, log?: string }`
- **FR-010**: 包必须导出 `@Rule` 装饰器，用于标记校验规则方法（通常抛出异常表示校验失败）
- **FR-011**: 包必须导出 `@Inject` 装饰器，用于标记依赖注入字段
- **FR-012**: 包必须导出 `@Expose` 装饰器，用于标记 API 暴露配置，接受参数 `{ method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, auth?: boolean }`

#### 类型系统 (Type System)

- **FR-013**: 包必须导出 `Command` 基类或类型别名，用于标识写操作入参（自动剔除审计字段）
- **FR-014**: 包必须导出 `View` 基类或类型别名，用于标识读操作出参（可扩展额外展示字段）
- **FR-015**: 包必须导出 `Query` 基类，包含 `pageNo?: number` 和 `pageSize?: number` 字段，用于查询参数
- **FR-016**: 包必须导出 `PageParam` 基类，作为 `Query` 的别名，提供更清晰的语义
- **FR-017**: 包必须导出 `Event` 基类或装饰器，用于标识领域事件，接受参数 `{ topic?: string }`

#### 运行时原语 (Runtime Primitives)

- **FR-018**: 包必须导出 `Decimal` 类，提供高精度数值计算能力（如 `.add()`, `.sub()`, `.mul()`, `.div()` 方法）
- **FR-019**: `Decimal` 类必须支持从 `string`, `number` 构造，并提供 `.toString()`, `.toNumber()` 方法
- **FR-020**: 包必须导出 `Repo<T>` 泛型接口或类，提供以下方法：
  - `findById(id: any): Promise<T | null>`
  - `findOne(query: any): Promise<T | null>`
  - `findAll(query?: any): Promise<T[]>`
  - `save(entity: T): Promise<T>`
  - `update(id: any, data: Partial<T>): Promise<T>`
  - `delete(id: any): Promise<boolean>`
- **FR-021**: 包必须导出 `EventBus` 类或对象，提供以下方法：
  - `emit(event: any): void | Promise<void>`
  - `on(topic: string, handler: Function): void`
  - `off(topic: string, handler?: Function): void`
- **FR-022**: 包必须导出 `Hooks` 类或对象，提供以下方法：
  - `on(hookName: string, handler: Function, priority?: number): void`
  - `emit(hookName: string, ...args: any[]): void | Promise<void>`
  - `off(hookName: string, handler?: Function): void`

#### 类型推断与约束 (Type Inference & Constraints)

- **FR-023**: 所有装饰器必须支持 TypeScript 类型推断，不改变被装饰类或成员的类型
- **FR-024**: 装饰器参数必须有完整的类型定义，在 IDE 中提供智能提示
- **FR-025**: 所有导出的 API 必须有清晰的 JSDoc 注释，包含参数说明和使用示例
- **FR-026**: 包必须支持 ES Module 和 CommonJS 两种模块格式
- **FR-027**: 包必须支持 tree-shaking，未使用的装饰器和工具函数能被打包工具正确移除

#### 零运行时依赖约束 (Zero Runtime Dependency)

- **FR-028**: 装饰器在运行时不执行任何逻辑（仅作为类型标记），不依赖 `reflect-metadata` 或其他运行时库
- **FR-029**: 包的生产依赖（dependencies）必须为空或仅包含必要的类型定义包
- **FR-030**: `Decimal`, `Repo`, `EventBus`, `Hooks` 等运行时原语的实现必须由 `@ai-builder/runtime` 包提供（本包仅导出类型定义和接口）

### Key Entities

- **Decorator Metadata**: 装饰器的参数配置信息，如 `@Entity({ table: 'users' })` 中的 `{ table: 'users' }`，这些信息在编译期被编译器提取，不在运行时存在
- **Entity Class**: 使用 `@Entity` 装饰的数据模型类，代表数据库表或聚合根
- **Service Class**: 使用 `@DomainLogic` 或 `@AppService` 装饰的业务逻辑类
- **DTO Types**: 使用类型工具（`Command`, `View`, `Query`, `Event`）派生的数据传输对象
- **Runtime Primitives**: `Decimal`, `Repo`, `EventBus`, `Hooks` 等运行时原语的类型定义和接口

## Success Criteria

### Measurable Outcomes

- **SC-001**: DSL 使用者能在 5 分钟内完成包的安装和基础 Entity 定义，无需阅读额外文档
- **SC-002**: 所有装饰器和类型工具在 VS Code 中提供完整的智能提示，参数错误能被 TypeScript 编译器立即发现
- **SC-003**: 包的打包体积（minified + gzipped）小于 5KB，确保对使用者项目的性能影响最小
- **SC-004**: 包支持 tree-shaking，未使用的装饰器能被打包工具移除，实测减少至少 30% 的打包体积（相比全量引入）
- **SC-005**: 包的 TypeScript 类型定义覆盖率 100%，所有导出的 API 都有完整的类型签名
- **SC-006**: 编译器能够正确解析所有装饰器元数据，生成的代码符合预期（通过集成测试验证）
- **SC-007**: 运行时原语（`Decimal`, `Repo`, `EventBus`, `Hooks`）的接口定义清晰，`@ai-builder/runtime` 包能够基于这些接口实现仿真环境

### Quality Attributes

- **可扩展性**: 未来新增装饰器或类型工具时，无需修改现有 API，保持向后兼容
- **可测试性**: 所有导出的类型定义和接口能被单元测试覆盖
- **文档完整性**: 每个装饰器和类型工具都有清晰的 JSDoc 注释和使用示例
- **开发体验**: 使用者在编写 DSL 代码时，能获得与编写普通 TypeScript 代码相同的开发体验（智能提示、类型检查、跳转定义）
